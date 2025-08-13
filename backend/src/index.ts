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
const JWT_SECRET = process.env.JWT_SECRET || 'barberia_dev_secret'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@barberia.local'
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
  try {
    const config = await prisma.businessConfig.findFirst()
    if (config) {
      return {
        openDays: JSON.parse(config.openDays),
        openStart: config.openStart,
        openEnd: config.openEnd,
        slotDuration: config.slotDuration,
        maxSlotsPerTime: config.maxSlotsPerTime,
        blockedDates: JSON.parse(config.blockedDates),
        blockedTimes: JSON.parse(config.blockedTimes)
      }
    }
  } catch (error) {
    console.log('Error al cargar configuración, usando valores por defecto')
  }
  
  // Configuración por defecto
  return {
    openDays: [1, 2, 3, 4, 5, 6], // lunes a sábado
    openStart: "08:30",
    openEnd: "18:30",
    slotDuration: 60,
    maxSlotsPerTime: 2,
    blockedDates: [],
    blockedTimes: []
  }
}

// Función para generar horarios disponibles
async function generateAvailableSlots(dateIso: string): Promise<string[]> {
  const config = await getBusinessConfig()
  
  // Verificar si es un día de trabajo
  const date = new Date(dateIso)
  const dayOfWeek = date.getDay()
  if (!config.openDays.includes(dayOfWeek)) {
    return []
  }
  
  // Verificar si la fecha está bloqueada
  if (config.blockedDates.includes(dateIso)) {
    return []
  }
  
  // Generar horarios
  const slots: string[] = []
  const [startHour, startMin] = config.openStart.split(':').map(Number)
  const [endHour, endMin] = config.openEnd.split(':').map(Number)
  
  let currentHour = startHour
  let currentMin = startMin
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
    
    // Verificar si el horario no está bloqueado
    if (!config.blockedTimes.includes(timeStr)) {
      slots.push(timeStr)
    }
    
    currentMin += config.slotDuration
    if (currentMin >= 60) {
      currentMin = 0
      currentHour++
    }
  }
  
  return slots
}

// Endpoints
app.get('/api/availability', async (req, res) => {
  const dateIso = String(req.query.date || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return res.status(400).json({ message: 'Fecha inválida' })

  try {
    const allSlots = await generateAvailableSlots(dateIso)
    
    // Si es el día de hoy, ocultar horarios de la hora actual hacia atrás
    const now = new Date()
    const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    let availableSlots = allSlots
    
    if (dateIso === todayIso) {
      const nowHour = now.getHours()
      availableSlots = allSlots.filter(t => parseInt(t.slice(0, 2), 10) > nowHour)
    }
    
    // Verificar capacidad por horario
    const finalSlots: string[] = []
    for (const slot of availableSlots) {
      const dateTime = buildLocalDate(dateIso, slot)
      const count = await prisma.appointment.count({ 
        where: { 
          dateTime,
          status: { not: 'canceled' }
        } 
      })
      
      const config = await getBusinessConfig()
      if (count < config.maxSlotsPerTime) {
        finalSlots.push(slot)
      }
    }
    
    res.json({ date: dateIso, slots: finalSlots })
  } catch (error) {
    console.error('Error en availability:', error)
    res.status(500).json({ message: 'Error al obtener disponibilidad' })
  }
})

const CreateAppointment = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(8),
  service: z.string().min(3).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
})

app.post('/api/appointments', async (req, res) => {
  const parsed = CreateAppointment.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' })
  const { firstName, lastName, phone, service, date, time } = parsed.data
  const dateTimeUtc = buildLocalDate(date, time)
  
  try {
    // Verificar disponibilidad
    const availableSlots = await generateAvailableSlots(date)
    if (!availableSlots.includes(time)) {
      return res.status(409).json({ message: 'Horario no disponible' })
    }
    
    // Verificar capacidad
    const config = await getBusinessConfig()
    const count = await prisma.appointment.count({ 
      where: { 
        dateTime: dateTimeUtc,
        status: { not: 'canceled' }
      } 
    })
    
    if (count >= config.maxSlotsPerTime) {
      return res.status(409).json({ message: 'No hay cupo para ese horario' })
    }
    
    // Restricción: máximo 2 turnos por día por número de WhatsApp
    const startDay = new Date(dateTimeUtc); startDay.setHours(0,0,0,0)
    const endDay = new Date(dateTimeUtc); endDay.setHours(23,59,59,999)
    const perDayByPhone = await prisma.appointment.count({
      where: { 
        phone, 
        dateTime: { gte: startDay, lte: endDay },
        status: { not: 'canceled' }
      }
    })
    
    if (perDayByPhone >= 2) {
      return res.status(409).json({ message: 'Máximo 2 turnos por día por WhatsApp' })
    }

    const created = await prisma.appointment.create({
      data: { firstName, lastName, phone, service, dateTime: dateTimeUtc, cancelToken: cryptoRandom() }
    })
    res.json(created)
  } catch (e: any) {
    console.error('Error al crear turno:', e)
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

// Endpoints de configuración del negocio
app.get('/api/admin/business-config', auth, async (req, res) => {
  try {
    const config = await getBusinessConfig()
    res.json(config)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener configuración' })
  }
})

app.post('/api/admin/business-config', auth, async (req, res) => {
  try {
    const { openDays, openStart, openEnd, slotDuration, maxSlotsPerTime, blockedDates, blockedTimes } = req.body
    
    // Validar datos
    if (!Array.isArray(openDays) || !openDays.every(d => typeof d === 'number' && d >= 0 && d <= 6)) {
      return res.status(400).json({ message: 'Días de trabajo inválidos' })
    }
    
    if (typeof openStart !== 'string' || typeof openEnd !== 'string') {
      return res.status(400).json({ message: 'Horarios inválidos' })
    }
    
    if (typeof slotDuration !== 'number' || slotDuration < 15 || slotDuration > 240) {
      return res.status(400).json({ message: 'Duración de turno inválida' })
    }
    
    if (typeof maxSlotsPerTime !== 'number' || maxSlotsPerTime < 1 || maxSlotsPerTime > 10) {
      return res.status(400).json({ message: 'Capacidad por horario inválida' })
    }
    
    // Guardar o actualizar configuración
    const configData = {
      openDays: JSON.stringify(openDays),
      openStart,
      openEnd,
      slotDuration,
      maxSlotsPerTime,
      blockedDates: JSON.stringify(blockedDates || []),
      blockedTimes: JSON.stringify(blockedTimes || [])
    }
    
    const existing = await prisma.businessConfig.findFirst()
    let config
    
    if (existing) {
      config = await prisma.businessConfig.update({
        where: { id: existing.id },
        data: configData
      })
    } else {
      config = await prisma.businessConfig.create({
        data: configData
      })
    }
    
    res.json({
      openDays: JSON.parse(config.openDays),
      openStart: config.openStart,
      openEnd: config.openEnd,
      slotDuration: config.slotDuration,
      maxSlotsPerTime: config.maxSlotsPerTime,
      blockedDates: JSON.parse(config.blockedDates),
      blockedTimes: JSON.parse(config.blockedTimes)
    })
  } catch (error) {
    console.error('Error al guardar configuración:', error)
    res.status(500).json({ message: 'Error al guardar configuración' })
  }
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

// Marcar cliente como listo y notificar
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
    service: appt.service,
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

