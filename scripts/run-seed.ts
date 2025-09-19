#!/usr/bin/env ts-node

import { config } from 'dotenv'
import seedDatabase from './seed-database'

// Cargar variables de entorno
config()

async function main() {
  try {
    console.log('🚀 Iniciando seed de la base de datos AquaMonitor...')
    console.log('')
    
    await seedDatabase()
    
    console.log('')
    console.log('🎉 ¡Seed completado exitosamente!')
    console.log('')
    console.log('📝 Próximos pasos:')
    console.log('   1. Configura tu archivo .env.local con las variables de entorno')
    console.log('   2. Inicia el servidor con: npm run dev')
    console.log('   3. Accede a http://localhost:3000')
    console.log('   4. Usa las credenciales: admin@aquamonitor.com / admin123')
    
  } catch (error) {
    console.error('💥 Error durante el seed:', error)
    process.exit(1)
  }
}

main()
