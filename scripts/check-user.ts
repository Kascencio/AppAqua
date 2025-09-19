#!/usr/bin/env ts-node

import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

// Configuración de la base de datos
const DB_CONFIG = {
  host: '195.35.11.179',
  port: 3306,
  user: 'root',
  password: 'Mvergel*',
  database: 'u889902058_sonda0109'
}

async function checkUser() {
  let db: mysql.Pool | undefined
  
  try {
    console.log('🔍 Verificando usuario en la base de datos...')
    
    db = mysql.createPool({
      ...DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })

    // Verificar si el usuario existe
    const [users] = await db.query(
      `SELECT u.*, tr.nombre as rol_nombre 
       FROM usuario u 
       JOIN tipo_rol tr ON u.id_rol = tr.id_rol 
       WHERE u.correo = ?`,
      ['admin@aquamonitor.com']
    )

    if (Array.isArray(users) && users.length > 0) {
      const user = users[0] as any
      console.log('✅ Usuario encontrado:')
      console.log('   ID:', user.id_usuario)
      console.log('   Nombre:', user.nombre_completo)
      console.log('   Email:', user.correo)
      console.log('   Rol:', user.rol_nombre)
      console.log('   Estado:', user.estado)
      
      // Verificar contraseña
      const isValidPassword = await bcrypt.compare('admin123', user.password_hash)
      console.log('   Contraseña válida:', isValidPassword)
      
      if (!isValidPassword) {
        console.log('❌ La contraseña no coincide. Regenerando...')
        const newPasswordHash = await bcrypt.hash('admin123', 12)
        await db.query(
          'UPDATE usuario SET password_hash = ? WHERE id_usuario = ?',
          [newPasswordHash, user.id_usuario]
        )
        console.log('✅ Contraseña actualizada')
      }
      
    } else {
      console.log('❌ Usuario no encontrado. Verificando si hay usuarios existentes...')
      
      // Verificar usuarios existentes
      const [existingUsers] = await db.query('SELECT * FROM usuario LIMIT 5')
      console.log('Usuarios existentes:', existingUsers)
      
      // Buscar el siguiente ID disponible
      const [maxId] = await db.query('SELECT MAX(id_usuario) as max_id FROM usuario')
      const nextId = (maxId as any)[0]?.max_id ? (maxId as any)[0].max_id + 1 : 1
      
      console.log('Creando usuario con ID:', nextId)
      
      // Crear usuario si no existe
      const passwordHash = await bcrypt.hash('admin123', 12)
      
      await db.query(
        `INSERT INTO usuario 
         (id_usuario, id_rol, nombre_completo, correo, telefono, password_hash, estado, fecha_creacion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nextId, // id_usuario
          1, // id_rol (admin)
          'Administrador Sistema',
          'admin@aquamonitor.com',
          '+52 999 123 4567',
          passwordHash,
          'activo',
          new Date()
        ]
      )
      console.log('✅ Usuario creado exitosamente con ID:', nextId)
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    if (db) {
      await db.end()
    }
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  checkUser()
    .then(() => {
      console.log('✅ Verificación completada')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en verificación:', error)
      process.exit(1)
    })
}

export { checkUser }
