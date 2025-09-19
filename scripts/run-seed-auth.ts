#!/usr/bin/env ts-node

const { seedAuthData } = require('./seed-auth-data')

async function main() {
  try {
    console.log('🚀 Iniciando seed de datos de autenticación...')
    await seedAuthData()
    console.log('✅ Seed completado exitosamente!')
  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    process.exit(1)
  }
}

main()
