import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { addHours } from 'date-fns'
// Eliminamos dependencias de date-fns-tz para simplificar: trabajamos en hora local del servidor
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const app = express()
app.use(cors())
app.use(express.json())

const prisma = new PrismaClient()
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const TZ = process.env.TIMEZONE || 'America/Argentina/Buenos_Aires'
const JWT_SECRET = process.env.JWT_SECRET || 'ecolavado_dev_secret'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ecolavado.local'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234'
const REMINDER_WEBHOOK_KEY = process.env.REMINDER_WEBHOOK_KEY || 'dev_key'

// Helpers (hora local)
function buildLocalDate(dateIso: string, timeHHmm: string): Date {
  const [y, m, d] = dateIso.split('-').map(Number)
  const [hh, mm] = timeHHmm.split(':').map(Number)
  return new Date(y, (m - 1), d, hh, mm, 0, 0)
}
function pad(n: number) { return String(n).padStart(2, '0') }
function cryptoRandom() { return crypto.randomBytes(12).toString('hex') }

// Función para obtener configuración del negocio
async function getBusinessConfig() {
  const config = await prisma.businessConfig.findFirst({ where: { isActive: true } })
  if (!config) {
    // Configuración por defecto si no existe
    return {
      openTime: '08:30',
      closeTime: '18:30',
      slotDuration: 60,
      maxAppointmentsPerSlot: 2
    }
  }
  return config
}

// Función para generar horarios disponibles basada en configuración
async function generateDailySlots(dateIso: string): Promise<string[]> {
  const config = await getBusinessConfig()
  
  // Parsear horarios de apertura y cierre
  const [openHour, openMinute] = config.openTime.split(':').map(Number)
  const [closeHour, closeMinute] = config.closeTime.split(':').map(Number)
  
  const slots: string[] = []
  let currentHour = openHour
  let currentMinute = openMinute
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
    const hh = String(currentHour).padStart(2, '0')
    const mm = String(currentMinute).padStart(2, '0')
    const display = `${hh}:${mm}`
    slots.push(display)
    
    // Avanzar al siguiente slot
    currentMinute += config.slotDuration
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60)
      currentMinute = currentMinute % 60
    }
  }
  
  return slots
}

// Endpoints
app.get('/api/availability', async (req, res) => {
  const dateIso = String(req.query.date || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return res.status(400).json({ message: 'Fecha inválida' })

  try {
    // Verificar si la fecha está bloqueada
    const blockedDate = await prisma.blockedDate.findFirst({
      where: { date: dateIso, isActive: true }
    })
    
    if (blockedDate) {
      return res.json({ date: dateIso, slots: [], blocked: true, reason: blockedDate.reason })
    }

    const all = await generateDailySlots(dateIso)

    // Calcular inicio y fin del día en hora local
    const [y, m, d] = dateIso.split('-').map(Number)
    const startLocal = new Date(y, (m - 1), d, 0, 0, 0, 0)
    const endLocal = new Date(y, (m - 1), d, 23, 59, 59, 999)

    const busy = await prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: startLocal,
          lt: endLocal,
        }
      },
      select: { dateTime: true }
    })

    // Obtener configuración para la capacidad máxima
    const config = await getBusinessConfig()

    // Contar reservas por horario local
    const countByTime = new Map<string, number>()
    for (const b of busy) {
      const hh = pad(new Date(b.dateTime).getHours())
      const mm = pad(new Date(b.dateTime).getMinutes())
      const key = `${hh}:${mm}`
      countByTime.set(key, (countByTime.get(key) || 0) + 1)
    }

    // Obtener horarios bloqueados para esta fecha
    const blockedTimeSlots = await prisma.blockedTimeSlot.findMany({
      where: { date: dateIso, isActive: true }
    })
    
    const blockedTimes = new Set(blockedTimeSlots.map(bt => bt.time))

    // Disponibles si hay menos del máximo de reservas en ese horario y no está bloqueado
    let free = all.filter(s => {
      const isBlocked = blockedTimes.has(s)
      const isFull = (countByTime.get(s) || 0) >= config.maxAppointmentsPerSlot
      return !isBlocked && !isFull
    })

    // Si es el día de hoy, ocultar horarios de la hora actual hacia atrás
    const now = new Date()
    const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    if (dateIso === todayIso) {
      const nowHour = now.getHours()
      const nowMinute = now.getMinutes()
      free = free.filter(t => {
        const [slotHour, slotMinute] = t.split(':').map(Number)
        return slotHour > nowHour || (slotHour === nowHour && slotMinute > nowMinute)
      })
    }

    res.json({ date: dateIso, slots: free })
  } catch (error) {
    console.error('Error en availability:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

const CreateAppointment = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(8),
  licensePlate: z.string().min(5).max(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
})

app.post('/api/appointments', async (req, res) => {
  const parsed = CreateAppointment.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' })
  const { firstName, lastName, phone, licensePlate, date, time } = parsed.data
  const dateTimeUtc = buildLocalDate(date, time)
  try {
    // Verificar si la fecha o horario están bloqueados
    const blockedDate = await prisma.blockedDate.findFirst({
      where: { date, isActive: true }
    })
    if (blockedDate) return res.status(409).json({ message: 'Esta fecha no está disponible' })

    const blockedTimeSlot = await prisma.blockedTimeSlot.findFirst({
      where: { date, time, isActive: true }
    })
    if (blockedTimeSlot) return res.status(409).json({ message: 'Este horario no está disponible' })

    // Obtener configuración para la capacidad máxima
    const config = await getBusinessConfig()
    
    // Verificar capacidad por horario
    const count = await prisma.appointment.count({ where: { dateTime: dateTimeUtc } })
    if (count >= config.maxAppointmentsPerSlot) return res.status(409).json({ message: 'No hay cupo para ese horario' })
    
    // Restricción: máximo 2 turnos por día por número de WhatsApp
    const startDay = new Date(dateTimeUtc); startDay.setHours(0,0,0,0)
    const endDay = new Date(dateTimeUtc); endDay.setHours(23,59,59,999)
    const perDayByPhone = await prisma.appointment.count({
      where: { phone, dateTime: { gte: startDay, lte: endDay } }
    })
    if (perDayByPhone >= 2) return res.status(409).json({ message: 'Máximo 2 turnos por día por WhatsApp' })

    const created = await prisma.appointment.create({
      data: { firstName, lastName, phone, licensePlate, dateTime: dateTimeUtc, cancelToken: cryptoRandom() }
    })
    res.json(created)
  } catch (e: any) {
    res.status(500).json({ message: 'Error al crear turno' })
  }
})

// Auth simple para admin
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ message: 'Credenciales requeridas' })
  // Permitir login con env o con usuario en DB
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ sub: 'env-admin', email }, JWT_SECRET, { expiresIn: '12h' })
    return res.json({ token })
  }
  const user = await prisma.adminUser.findUnique({ where: { email } })
  if (!user || user.password !== password) return res.status(401).json({ message: 'Credenciales inválidas' })
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '12h' })
  res.json({ token })
})

function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) return res.status(401).json({ message: 'No autorizado' })
  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido' })
  }
}

app.get('/api/admin/appointments', auth, async (req, res) => {
  const from = String(req.query.from || '')
  const to = String(req.query.to || '')
  const where: any = {}
  if (from || to) {
    where.dateTime = {}
    if (from) (where.dateTime as any).gte = new Date(from)
    if (to) (where.dateTime as any).lte = new Date(to)
  } else {
    // Por defecto, devolver sólo turnos desde hoy (00:00) en adelante
    const t = new Date(); t.setHours(0,0,0,0)
    where.dateTime = { gte: t }
  }
  const list = await prisma.appointment.findMany({ where, orderBy: { dateTime: 'asc' } })
  res.json(list)
})

async function runReminders() {
  const now = new Date()
  const inThirty = new Date(now.getTime() + 30 * 60 * 1000)
  const pending = await prisma.appointment.findMany({
    where: {
      reminderSent: false,
      status: { not: 'canceled' },
      dateTime: { gte: now, lte: inThirty },
    }
  })
  for (const appt of pending) {
    try {
      // En producción, mandar WhatsApp con Twilio
      // await sendWhatsApp(appt.phone, buildReminderMessage(appt.firstName, appt.dateTime))
      await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSent: true, reminderSentAt: new Date() } })
      console.log('Recordatorio marcado como enviado para', appt.id)
    } catch (e) {
      console.error('Fallo recordatorio', appt.id, e)
    }
  }
}

// Cron de recordatorios cada 5 minutos (30 min antes)
cron.schedule('*/5 * * * *', () => { runReminders().catch(() => {}) }, { timezone: TZ })

// Cron nocturno: archiva (status=done) todos los turnos anteriores a hoy
cron.schedule('5 0 * * *', async () => {
  const now = new Date()
  const startToday = new Date(now)
  startToday.setHours(0, 0, 0, 0)
  await prisma.appointment.updateMany({
    where: { dateTime: { lt: startToday }, status: { not: 'done' } },
    data: { status: 'done' }
  })
  console.log('Archivo de turnos anterior a hoy completado')
}, { timezone: TZ })

app.get('/health', (_req, res) => res.json({ ok: true }))

// Endpoints para gestión de configuración del negocio
app.get('/api/admin/business-config', auth, async (_req, res) => {
  try {
    const config = await prisma.businessConfig.findFirst({ where: { isActive: true } })
    res.json(config)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener configuración' })
  }
})

app.put('/api/admin/business-config', auth, async (req, res) => {
  try {
    const { openTime, closeTime, slotDuration, maxAppointmentsPerSlot } = req.body
    
    // Validaciones básicas
    if (!openTime || !closeTime || !slotDuration || !maxAppointmentsPerSlot) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }
    
    if (slotDuration < 15 || slotDuration > 120) {
      return res.status(400).json({ message: 'La duración del turno debe estar entre 15 y 120 minutos' })
    }
    
    if (maxAppointmentsPerSlot < 1 || maxAppointmentsPerSlot > 10) {
      return res.status(400).json({ message: 'La capacidad por horario debe estar entre 1 y 10' })
    }

    const config = await prisma.businessConfig.upsert({
      where: { id: 'default-config' },
      update: { openTime, closeTime, slotDuration, maxAppointmentsPerSlot },
      create: { 
        id: 'default-config',
        openTime, 
        closeTime, 
        slotDuration, 
        maxAppointmentsPerSlot,
        isActive: true 
      }
    })
    
    res.json(config)
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar configuración' })
  }
})

// Endpoints para gestión de fechas bloqueadas
app.get('/api/admin/blocked-dates', auth, async (req, res) => {
  try {
    const { from, to } = req.query
    const where: any = { isActive: true }
    
    if (from && to) {
      where.date = { gte: String(from), lte: String(to) }
    }
    
    const blockedDates = await prisma.blockedDate.findMany({ 
      where, 
      orderBy: { date: 'asc' } 
    })
    res.json(blockedDates)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener fechas bloqueadas' })
  }
})

app.post('/api/admin/blocked-dates', auth, async (req, res) => {
  try {
    const { date, reason } = req.body
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Fecha inválida' })
    }
    
    const blockedDate = await prisma.blockedDate.upsert({
      where: { date },
      update: { reason, isActive: true },
      create: { date, reason, isActive: true }
    })
    
    res.json(blockedDate)
  } catch (error) {
    res.status(500).json({ message: 'Error al bloquear fecha' })
  }
})

app.delete('/api/admin/blocked-dates/:date', auth, async (req, res) => {
  try {
    const { date } = req.params
    
    await prisma.blockedDate.updateMany({
      where: { date },
      data: { isActive: false }
    })
    
    res.json({ message: 'Fecha desbloqueada' })
  } catch (error) {
    res.status(500).json({ message: 'Error al desbloquear fecha' })
  }
})

// Endpoints para gestión de horarios bloqueados
app.get('/api/admin/blocked-time-slots', auth, async (req, res) => {
  try {
    const { date } = req.query
    const where: any = { isActive: true }
    
    if (date) {
      where.date = String(date)
    }
    
    const blockedTimeSlots = await prisma.blockedTimeSlot.findMany({ 
      where, 
      orderBy: [{ date: 'asc' }, { time: 'asc' }] 
    })
    res.json(blockedTimeSlots)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener horarios bloqueados' })
  }
})

app.post('/api/admin/blocked-time-slots', auth, async (req, res) => {
  try {
    const { date, time, reason } = req.body
    
    if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ message: 'Fecha u horario inválido' })
    }
    
    const blockedTimeSlot = await prisma.blockedTimeSlot.upsert({
      where: { date_time: { date, time } },
      update: { reason, isActive: true },
      create: { date, time, reason, isActive: true }
    })
    
    res.json(blockedTimeSlot)
  } catch (error) {
    res.status(500).json({ message: 'Error al bloquear horario' })
  }
})

app.delete('/api/admin/blocked-time-slots/:date/:time', auth, async (req, res) => {
  try {
    const { date, time } = req.params
    
    await prisma.blockedTimeSlot.updateMany({
      where: { date, time },
      data: { isActive: false }
    })
    
    res.json({ message: 'Horario desbloqueado' })
  } catch (error) {
    res.status(500).json({ message: 'Error al desbloquear horario' })
  }
})

// Endpoint para obtener disponibilidad futura (admin)
app.get('/api/admin/availability', auth, async (req, res) => {
  try {
    const { from, to } = req.query
    const fromDate = String(from || '')
    const toDate = String(to || '')
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Rango de fechas requerido' })
    }
    
    const availability = []
    const currentDate = new Date(fromDate)
    const endDate = new Date(toDate)
    
    while (currentDate <= endDate) {
      const dateIso = currentDate.toISOString().split('T')[0]
      
      // Verificar si la fecha está bloqueada
      const blockedDate = await prisma.blockedDate.findFirst({
        where: { date: dateIso, isActive: true }
      })
      
      if (blockedDate) {
        availability.push({
          date: dateIso,
          blocked: true,
          reason: blockedDate.reason,
          slots: []
        })
      } else {
        // Generar horarios disponibles
        const allSlots = await generateDailySlots(dateIso)
        
        // Obtener horarios bloqueados
        const blockedTimeSlots = await prisma.blockedTimeSlot.findMany({
          where: { date: dateIso, isActive: true }
        })
        const blockedTimes = new Set(blockedTimeSlots.map(bt => bt.time))
        
        // Obtener turnos existentes
        const startLocal = new Date(currentDate)
        startLocal.setHours(0, 0, 0, 0)
        const endLocal = new Date(currentDate)
        endLocal.setHours(23, 59, 59, 999)
        
        const busy = await prisma.appointment.findMany({
          where: {
            dateTime: { gte: startLocal, lt: endLocal }
          },
          select: { dateTime: true }
        })
        
        const config = await getBusinessConfig()
        const countByTime = new Map<string, number>()
        
        for (const b of busy) {
          const hh = pad(new Date(b.dateTime).getHours())
          const mm = pad(new Date(b.dateTime).getMinutes())
          const key = `${hh}:${mm}`
          countByTime.set(key, (countByTime.get(key) || 0) + 1)
        }
        
        // Filtrar horarios disponibles
        const availableSlots = allSlots.filter(s => {
          const isBlocked = blockedTimes.has(s)
          const isFull = (countByTime.get(s) || 0) >= config.maxAppointmentsPerSlot
          return !isBlocked && !isFull
        })
        
        availability.push({
          date: dateIso,
          blocked: false,
          slots: availableSlots,
          totalSlots: allSlots.length,
          blockedSlots: blockedTimeSlots.length,
          bookedSlots: busy.length
        })
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    res.json(availability)
  } catch (error) {
    console.error('Error en admin availability:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

// Endpoints para gestión de mensajes de soporte
app.post('/api/support', async (req, res) => {
  try {
    const { category, priority, name, email, phone, message } = req.body
    
    // Validaciones básicas
    if (!category || !priority || !message) {
      return res.status(400).json({ message: 'Categoría, prioridad y mensaje son requeridos' })
    }
    
    if (message.trim().length < 10) {
      return res.status(400).json({ message: 'El mensaje debe tener al menos 10 caracteres' })
    }
    
    const supportMessage = await prisma.supportMessage.create({
      data: {
        category,
        priority,
        name: name || null,
        email: email || null,
        phone: phone || null,
        message: message.trim()
      }
    })
    
    res.json(supportMessage)
  } catch (error) {
    console.error('Error al crear mensaje de soporte:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

app.get('/api/admin/support-messages', auth, async (req, res) => {
  try {
    const { status, priority, category } = req.query
    const where: any = {}
    
    if (status) where.status = String(status)
    if (priority) where.priority = String(priority)
    if (category) where.category = String(category)
    
    const messages = await prisma.supportMessage.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })
    
    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener mensajes de soporte' })
  }
})

app.put('/api/admin/support-messages/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { status, response } = req.body
    
    if (!status && !response) {
      return res.status(400).json({ message: 'Status o respuesta son requeridos' })
    }
    
    const updateData: any = {}
    if (status) updateData.status = status
    if (response) {
      updateData.response = response
      updateData.respondedAt = new Date()
    }
    
    const updatedMessage = await prisma.supportMessage.update({
      where: { id },
      data: updateData
    })
    
    res.json(updatedMessage)
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar mensaje de soporte' })
  }
})

// Endpoint para ejecutar recordatorios manualmente (admin)
app.post('/api/admin/run-reminders', auth, async (_req, res) => {
  await runReminders()
  res.json({ ok: true })
})

// Endpoint público con key para cron-job.org
app.get('/api/run-reminders', async (req, res) => {
  const key = String(req.query.key || '')
  if (key !== REMINDER_WEBHOOK_KEY) return res.status(401).json({ message: 'Unauthorized' })
  await runReminders()
  res.json({ ok: true })
})

// Marcar auto como listo y notificar
app.post('/api/admin/appointments/:id/ready', auth, async (req, res) => {
  const { id } = req.params
  try {
    const appt = await prisma.appointment.update({ where: { id }, data: { status: 'ready', readyAt: new Date(), attended: true } })
    // await sendWhatsApp(appt.phone, buildReadyMessage(appt.firstName))
    res.json(appt)
  } catch (e) {
    res.status(404).json({ message: 'Turno no encontrado' })
  }
})

// Cancelar turno por link seguro
app.get('/api/appointments/cancel/:token', async (req, res) => {
  const { token } = req.params
  const appt = await prisma.appointment.findUnique({ where: { cancelToken: token } })
  if (!appt) return res.status(404).json({ message: 'Enlace inválido' })
  res.json({
    id: appt.id,
    dateTime: appt.dateTime,
    firstName: appt.firstName,
    lastName: appt.lastName,
    licensePlate: appt.licensePlate,
    phone: appt.phone,
    status: appt.status,
  })
})

app.post('/api/appointments/cancel/:token', async (req, res) => {
  const { token } = req.params
  const appt = await prisma.appointment.findUnique({ where: { cancelToken: token } })
  if (!appt) return res.status(404).json({ message: 'Enlace inválido' })
  if (appt.status === 'canceled') return res.json(appt)
  const updated = await prisma.appointment.update({ where: { id: appt.id }, data: { status: 'canceled' } })
  res.json(updated)
})

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`)
})

export { app }

