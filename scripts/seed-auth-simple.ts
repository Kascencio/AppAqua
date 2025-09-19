#!/usr/bin/env ts-node

import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

// Configuración de la base de datos
const db = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/aquamonitor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

async function seedAuthData() {
  try {
    console.log('🌱 Iniciando seed de datos de autenticación...')

    // 1. Insertar roles si no existen
    const roles = [
      { id: 1, nombre: 'admin' },
      { id: 2, nombre: 'manager' },
      { id: 3, nombre: 'operator' },
      { id: 4, nombre: 'viewer' }
    ]

    for (const role of roles) {
      await db.query(
        'INSERT IGNORE INTO tipo_rol (id_rol, nombre) VALUES (?, ?)',
        [role.id, role.nombre]
      )
    }
    console.log('✅ Roles insertados')

    // 2. Insertar usuario administrador si no existe
    const adminPassword = await bcrypt.hash('admin123', 12)
    
    await db.query(
      `INSERT IGNORE INTO usuario 
       (id_usuario, id_rol, nombre_completo, correo, telefono, password_hash, estado, fecha_creacion) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1, // id_usuario
        1, // id_rol (admin)
        'Administrador Sistema',
        'admin@aquamonitor.com',
        '+52 999 123 4567',
        adminPassword,
        'activo',
        new Date()
      ]
    )
    console.log('✅ Usuario administrador creado')

    // 3. Insertar datos geográficos básicos
    await db.query(
      'INSERT IGNORE INTO estados (id_estado, nombre_estado) VALUES (?, ?)',
      [1, 'Tabasco']
    )

    await db.query(
      'INSERT IGNORE INTO municipios (id_municipio, id_estado, nombre_municipio) VALUES (?, ?, ?)',
      [1, 1, 'Centro']
    )

    await db.query(
      'INSERT IGNORE INTO codigos_postales (id_cp, id_municipio, codigo_postal) VALUES (?, ?, ?)',
      [1, 1, '86000']
    )

    await db.query(
      'INSERT IGNORE INTO colonias (id_colonia, id_cp, nombre_colonia) VALUES (?, ?, ?)',
      [1, 1, 'Centro']
    )
    console.log('✅ Datos geográficos insertados')

    // 4. Insertar empresa principal
    await db.query(
      `INSERT IGNORE INTO empresa_sucursal 
       (id_empresa_sucursal, id_padre, nombre, tipo, telefono, email, estado_operativo, fecha_registro, id_estado, id_cp, id_colonia, calle, numero_int_ext) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1, // id_empresa_sucursal
        null, // id_padre (empresa principal)
        'Cooperativa Transformando Mecoacán',
        'empresa',
        '+52 993 123 4567',
        'contacto@mecoacan.com',
        'activa',
        new Date(),
        1, // id_estado
        1, // id_cp
        1, // id_colonia
        'Av. Principal',
        '123'
      ]
    )
    console.log('✅ Empresa principal creada')

    // 5. Insertar especie de prueba
    await db.query(
      'INSERT IGNORE INTO especies (id_especie, nombre) VALUES (?, ?)',
      [1, 'Camarón Blanco']
    )
    console.log('✅ Especie de prueba creada')

    // 6. Insertar proceso de prueba
    await db.query(
      `INSERT IGNORE INTO procesos (id_proceso, id_especie, fecha_inicio, fecha_final) 
       VALUES (?, ?, ?, ?)`,
      [
        1, // id_proceso
        1, // id_especie
        new Date().toISOString().split('T')[0], // fecha_inicio (hoy)
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // fecha_final (90 días)
      ]
    )
    console.log('✅ Proceso de prueba creado')

    // 7. Insertar instalación de prueba
    await db.query(
      `INSERT IGNORE INTO instalacion 
       (id_instalacion, id_empresa_sucursal, nombre_instalacion, fecha_instalacion, estado_operativo, descripcion, tipo_uso, id_proceso) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1, // id_instalacion
        1, // id_empresa_sucursal
        'Estanque Principal',
        new Date().toISOString().split('T')[0],
        'activo',
        'Estanque principal para cultivo de camarón',
        'acuicultura',
        1 // id_proceso
      ]
    )
    console.log('✅ Instalación de prueba creada')

    // 8. Insertar asignación del usuario administrador
    await db.query(
      `INSERT IGNORE INTO asignacion_usuario 
       (id_asignacion, id_usuario, id_empresa_sucursal, fecha_asignacion) 
       VALUES (?, ?, ?, ?)`,
      [
        1, // id_asignacion
        1, // id_usuario
        1, // id_empresa_sucursal
        new Date()
      ]
    )
    console.log('✅ Asignación de usuario creada')

    console.log('🎉 Seed de datos de autenticación completado exitosamente!')
    console.log('📧 Credenciales de prueba:')
    console.log('   Email: admin@aquamonitor.com')
    console.log('   Contraseña: admin123')

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  } finally {
    await db.end()
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAuthData()
    .then(() => {
      console.log('✅ Seed completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en seed:', error)
      process.exit(1)
    })
}

export { seedAuthData }
