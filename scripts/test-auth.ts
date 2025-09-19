#!/usr/bin/env ts-node

import { config } from 'dotenv'
import { db } from '../lib/db'
import { PasswordUtils, JWTUtils, ValidationUtils } from '../lib/auth-utils'

// Cargar variables de entorno
config()

async function testAuthSystem() {
  try {
    console.log('🧪 Iniciando pruebas del sistema de autenticación...')
    console.log('')

    // 1. Probar conexión a la base de datos
    console.log('1️⃣ Probando conexión a la base de datos...')
    const [result] = await db.query('SELECT 1 as test')
    console.log('✅ Conexión a BD exitosa')
    console.log('')

    // 2. Probar hash de contraseñas
    console.log('2️⃣ Probando hash de contraseñas...')
    const testPassword = 'TestPassword123!'
    const hashedPassword = await PasswordUtils.hashPassword(testPassword)
    const isValidPassword = await PasswordUtils.verifyPassword(testPassword, hashedPassword)
    
    if (isValidPassword) {
      console.log('✅ Hash y verificación de contraseñas funcionando')
    } else {
      throw new Error('❌ Error en hash de contraseñas')
    }
    console.log('')

    // 3. Probar validación de contraseñas
    console.log('3️⃣ Probando validación de contraseñas...')
    const weakPassword = '123'
    const strongPassword = 'StrongPass123!'
    
    const weakValidation = PasswordUtils.validatePasswordStrength(weakPassword)
    const strongValidation = PasswordUtils.validatePasswordStrength(strongPassword)
    
    if (!weakValidation.isValid && strongValidation.isValid) {
      console.log('✅ Validación de contraseñas funcionando')
    } else {
      throw new Error('❌ Error en validación de contraseñas')
    }
    console.log('')

    // 4. Probar JWT tokens
    console.log('4️⃣ Probando JWT tokens...')
    const testPayload = {
      id_usuario: 1,
      id_rol: 1,
      correo: 'test@example.com'
    }
    
    const accessToken = JWTUtils.generateAccessToken(testPayload)
    const refreshToken = JWTUtils.generateRefreshToken(testPayload)
    const decoded = JWTUtils.verifyToken(accessToken)
    
    if (decoded && decoded.id_usuario === testPayload.id_usuario) {
      console.log('✅ JWT tokens funcionando')
    } else {
      throw new Error('❌ Error en JWT tokens')
    }
    console.log('')

    // 5. Probar validaciones de entrada
    console.log('5️⃣ Probando validaciones de entrada...')
    const validEmail = 'test@example.com'
    const invalidEmail = 'invalid-email'
    const validPhone = '+52 999 123 4567'
    const invalidPhone = '123'
    
    const emailValid = ValidationUtils.isValidEmail(validEmail)
    const emailInvalid = ValidationUtils.isValidEmail(invalidEmail)
    const phoneValid = ValidationUtils.isValidPhone(validPhone)
    const phoneInvalid = ValidationUtils.isValidPhone(invalidPhone)
    
    if (emailValid && !emailInvalid && phoneValid && !phoneInvalid) {
      console.log('✅ Validaciones de entrada funcionando')
    } else {
      throw new Error('❌ Error en validaciones de entrada')
    }
    console.log('')

    // 6. Verificar datos en la base de datos
    console.log('6️⃣ Verificando datos en la base de datos...')
    
    // Verificar roles
    const [roles] = await db.query('SELECT COUNT(*) as count FROM tipo_rol')
    const roleCount = (roles as any[])[0].count
    console.log(`   - Roles: ${roleCount}`)
    
    // Verificar usuarios
    const [users] = await db.query('SELECT COUNT(*) as count FROM usuario')
    const userCount = (users as any[])[0].count
    console.log(`   - Usuarios: ${userCount}`)
    
    // Verificar empresas
    const [empresas] = await db.query('SELECT COUNT(*) as count FROM empresa_sucursal')
    const empresaCount = (empresas as any[])[0].count
    console.log(`   - Empresas/Sucursales: ${empresaCount}`)
    
    // Verificar instalaciones
    const [instalaciones] = await db.query('SELECT COUNT(*) as count FROM instalacion')
    const instalacionCount = (instalaciones as any[])[0].count
    console.log(`   - Instalaciones: ${instalacionCount}`)
    
    // Verificar sensores
    const [sensores] = await db.query('SELECT COUNT(*) as count FROM sensor_instalado')
    const sensorCount = (sensores as any[])[0].count
    console.log(`   - Sensores instalados: ${sensorCount}`)
    
    if (roleCount > 0 && userCount > 0 && empresaCount > 0) {
      console.log('✅ Datos de la base de datos verificados')
    } else {
      throw new Error('❌ Datos insuficientes en la base de datos')
    }
    console.log('')

    // 7. Probar usuario administrador
    console.log('7️⃣ Probando usuario administrador...')
    const [adminUsers] = await db.query(`
      SELECT u.*, tr.nombre as rol_nombre 
      FROM usuario u 
      JOIN tipo_rol tr ON u.id_rol = tr.id_rol 
      WHERE u.correo = 'admin@aquamonitor.com' AND u.estado = 'activo'
    `)
    
    if (Array.isArray(adminUsers) && adminUsers.length > 0) {
      const admin = adminUsers[0] as any
      console.log(`   - Usuario: ${admin.nombre_completo}`)
      console.log(`   - Email: ${admin.correo}`)
      console.log(`   - Rol: ${admin.rol_nombre}`)
      console.log(`   - Estado: ${admin.estado}`)
      
      // Probar login del administrador
      const isAdminPasswordValid = await PasswordUtils.verifyPassword('admin123', admin.password_hash)
      if (isAdminPasswordValid) {
        console.log('✅ Usuario administrador funcionando')
      } else {
        throw new Error('❌ Contraseña del administrador no válida')
      }
    } else {
      throw new Error('❌ Usuario administrador no encontrado')
    }
    console.log('')

    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!')
    console.log('')
    console.log('📋 Resumen de pruebas:')
    console.log('   ✅ Conexión a base de datos')
    console.log('   ✅ Hash de contraseñas')
    console.log('   ✅ Validación de contraseñas')
    console.log('   ✅ JWT tokens')
    console.log('   ✅ Validaciones de entrada')
    console.log('   ✅ Datos de la base de datos')
    console.log('   ✅ Usuario administrador')
    console.log('')
    console.log('🚀 El sistema de autenticación está listo para usar!')
    console.log('')
    console.log('🔑 Credenciales de acceso:')
    console.log('   Email: admin@aquamonitor.com')
    console.log('   Contraseña: admin123')

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error)
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAuthSystem()
    .then(() => {
      console.log('')
      console.log('✨ Proceso de pruebas completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error)
      process.exit(1)
    })
}

export default testAuthSystem
