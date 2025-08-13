import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function* nameGen() {
  const first = ['Juan','Ana','Luis','María','Sofía','Carlos','Leo','Julia']
  const last = ['Pérez','Gómez','López','Rodríguez','Fernández','Sosa','Martínez']
  let i = 0
  while (true) { yield { firstName: first[i % first.length], lastName: last[(i*3) % last.length] }; i++ }
}

function services(i: number) {
  const serviceList = ['Corte Clásico', 'Corte Moderno', 'Barba y Bigote', 'Corte + Barba', 'Degradado']
  return serviceList[i % serviceList.length]
}

async function main() {
  // Usuario admin de prueba si no existe
  const email = process.env.ADMIN_EMAIL || 'admin@barberia.local'
  const password = process.env.ADMIN_PASSWORD || 'admin1234'
  const existing = await prisma.adminUser.findUnique({ where: { email } }).catch(() => null)
  if (!existing) {
    await prisma.adminUser.create({ data: { email, password } })
    console.log('Admin seed creado:', email)
  } else {
    console.log('Admin ya existe:', email)
  }

  // Configuración del negocio por defecto si no existe
  const existingConfig = await prisma.businessConfig.findFirst().catch(() => null)
  if (!existingConfig) {
    await prisma.businessConfig.create({
      data: {
        openDays: JSON.stringify([1, 2, 3, 4, 5, 6]), // lunes a sábado
        openStart: "08:30",
        openEnd: "18:30",
        slotDuration: 60,
        maxSlotsPerTime: 2,
        blockedDates: JSON.stringify([]),
        blockedTimes: JSON.stringify([])
      }
    })
    console.log('Configuración del negocio creada')
  } else {
    console.log('Configuración del negocio ya existe')
  }

  // Limpiar turnos anteriores para mock
  await prisma.appointment.deleteMany({})

  // Crear turnos mock en próximos 6 días (sin domingos), horarios 08:30..18:30, hasta 2 por slot
  const gen = nameGen()
  let idx = 0
  const base = new Date()
  for (let d = 0; d <= 6; d++) {
    const day = new Date(base)
    day.setDate(base.getDate() + d)
    if (day.getDay() === 0) continue // domingo

    for (let h = 8; h <= 18; h++) {
      const slot = new Date(day)
      slot.setHours(h, 30, 0, 0)
      // pseudo-aleatorio: ocupar algunos slots
      const r = (h * 17 + d * 13) % 4 // 0..3
      const toCreate = r === 0 ? 0 : (r === 1 ? 1 : (r === 2 ? 2 : 1))
      for (let c = 0; c < toCreate; c++) {
        const next = gen.next()
        const person = next.value as { firstName: string; lastName: string }
        await prisma.appointment.create({
          data: {
            firstName: person.firstName,
            lastName: person.lastName,
            phone: '+5493510000000',
            service: services(idx++),
            dateTime: slot,
          }
        })
      }
    }
  }
  console.log('Seed de turnos mock creado')
}

main().finally(() => prisma.$disconnect())


