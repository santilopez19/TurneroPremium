import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Crear configuración por defecto del negocio
  const defaultConfig = await prisma.businessConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      openTime: '08:30',
      closeTime: '18:30',
      slotDuration: 60,
      maxAppointmentsPerSlot: 2,
      isActive: true
    }
  })

  console.log('✅ Configuración del negocio creada:', defaultConfig)

  // Crear usuario admin por defecto si no existe
  const adminUser = await prisma.adminUser.upsert({
    where: { email: 'admin@ecolavado.local' },
    update: {},
    create: {
      email: 'admin@ecolavado.local',
      password: 'admin1234'
    }
  })

  console.log('✅ Usuario admin creado:', adminUser.email)

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


