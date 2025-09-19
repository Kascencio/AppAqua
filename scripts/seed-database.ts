import { db } from '@/lib/db'
import { PasswordUtils } from '@/lib/auth-utils'

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...')

    // 1. Insertar roles
    console.log('📝 Insertando roles...')
    await db.query(`
      INSERT IGNORE INTO tipo_rol (id_rol, nombre) VALUES 
      (1, 'admin'),
      (2, 'manager'),
      (3, 'operator'),
      (4, 'viewer')
    `)

    // 2. Insertar estados
    console.log('📍 Insertando estados...')
    await db.query(`
      INSERT IGNORE INTO estados (id_estado, nombre_estado) VALUES 
      (1, 'Yucatán'),
      (2, 'Quintana Roo'),
      (3, 'Campeche')
    `)

    // 3. Insertar municipios
    console.log('🏘️ Insertando municipios...')
    await db.query(`
      INSERT IGNORE INTO municipios (id_municipio, id_estado, nombre_municipio) VALUES 
      (1, 1, 'Mérida'),
      (2, 1, 'Progreso'),
      (3, 2, 'Cancún'),
      (4, 2, 'Playa del Carmen'),
      (5, 3, 'Campeche')
    `)

    // 4. Insertar códigos postales
    console.log('📮 Insertando códigos postales...')
    await db.query(`
      INSERT IGNORE INTO codigos_postales (id_cp, id_municipio, codigo_postal) VALUES 
      (1, 1, '97000'),
      (2, 2, '97320'),
      (3, 3, '77500'),
      (4, 4, '77710'),
      (5, 5, '24000')
    `)

    // 5. Insertar colonias
    console.log('🏠 Insertando colonias...')
    await db.query(`
      INSERT IGNORE INTO colonias (id_colonia, id_cp, nombre_colonia) VALUES 
      (1, 1, 'Centro'),
      (2, 1, 'García Ginerés'),
      (3, 2, 'Centro'),
      (4, 3, 'Centro'),
      (5, 4, 'Centro'),
      (6, 5, 'Centro')
    `)

    // 6. Insertar especies
    console.log('🐟 Insertando especies...')
    await db.query(`
      INSERT IGNORE INTO especies (id_especie, nombre) VALUES 
      (1, 'Tilapia'),
      (2, 'Camarón'),
      (3, 'Lobina'),
      (4, 'Carpa'),
      (5, 'Bagre')
    `)

    // 7. Insertar parámetros
    console.log('📊 Insertando parámetros...')
    await db.query(`
      INSERT IGNORE INTO parametros (id_parametro, nombre_parametro, unidad_medida) VALUES 
      (1, 'Temperatura', '°C'),
      (2, 'pH', 'pH'),
      (3, 'Oxígeno Disuelto', 'mg/L'),
      (4, 'Amonio', 'mg/L'),
      (5, 'Nitrito', 'mg/L'),
      (6, 'Nitrato', 'mg/L'),
      (7, 'Fósforo', 'mg/L'),
      (8, 'Turbidez', 'NTU')
    `)

    // 8. Insertar catálogo de sensores
    console.log('🔧 Insertando catálogo de sensores...')
    await db.query(`
      INSERT IGNORE INTO catalogo_sensores (id_sensor, modelo, marca, rango_medicion, unidad_medida, sensor, descripcion) VALUES 
      (1, 'DS18B20', 'Maxim Integrated', '0-100°C', '°C', 'Temperatura', 'Sensor digital de temperatura'),
      (2, 'pH-2000', 'Hanna Instruments', '0-14', 'pH', 'pH', 'Sensor de pH digital'),
      (3, 'DO-2000', 'Hanna Instruments', '0-20 mg/L', 'mg/L', 'Oxígeno Disuelto', 'Sensor de oxígeno disuelto'),
      (4, 'NH4-200', 'Hanna Instruments', '0-10 mg/L', 'mg/L', 'Amonio', 'Sensor de amonio'),
      (5, 'NO2-200', 'Hanna Instruments', '0-1 mg/L', 'mg/L', 'Nitrito', 'Sensor de nitrito')
    `)

    // 9. Crear usuario administrador
    console.log('👤 Creando usuario administrador...')
    const adminPassword = await PasswordUtils.hashPassword('admin123')
    
    await db.query(`
      INSERT IGNORE INTO usuario (id_usuario, id_rol, nombre_completo, correo, telefono, password_hash, estado, fecha_creacion) VALUES 
      (1, 1, 'Administrador del Sistema', 'admin@aquamonitor.com', '999-123-4567', ?, 'activo', NOW())
    `, [adminPassword])

    // 10. Insertar empresa principal
    console.log('🏢 Insertando empresa principal...')
    await db.query(`
      INSERT IGNORE INTO empresa_sucursal (id_empresa_sucursal, id_padre, nombre, tipo, telefono, email, estado_operativo, fecha_registro, id_estado, id_cp, id_colonia, calle, numero_int_ext, referencia) VALUES 
      (1, NULL, 'AquaMonitor S.A. de C.V.', 'empresa', '999-123-4567', 'info@aquamonitor.com', 'activa', CURDATE(), 1, 1, 1, 'Calle 60', '123', 'Edificio principal')
    `)

    // 11. Insertar sucursales
    console.log('🏪 Insertando sucursales...')
    await db.query(`
      INSERT IGNORE INTO empresa_sucursal (id_empresa_sucursal, id_padre, nombre, tipo, telefono, email, estado_operativo, fecha_registro, id_estado, id_cp, id_colonia, calle, numero_int_ext, referencia) VALUES 
      (2, 1, 'Sucursal Progreso', 'sucursal', '969-123-4567', 'progreso@aquamonitor.com', 'activa', CURDATE(), 1, 2, 3, 'Malecón', '456', 'Puerto de Progreso'),
      (3, 1, 'Sucursal Cancún', 'sucursal', '998-123-4567', 'cancun@aquamonitor.com', 'activa', CURDATE(), 2, 3, 4, 'Av. Tulum', '789', 'Zona Hotelera'),
      (4, 1, 'Sucursal Campeche', 'sucursal', '981-123-4567', 'campeche@aquamonitor.com', 'activa', CURDATE(), 3, 5, 6, 'Calle 8', '321', 'Centro Histórico')
    `)

    // 12. Insertar procesos
    console.log('🔄 Insertando procesos...')
    await db.query(`
      INSERT IGNORE INTO procesos (id_proceso, id_especie, fecha_inicio, fecha_final) VALUES 
      (1, 1, '2024-01-01', '2024-06-01'),
      (2, 2, '2024-02-01', '2024-08-01'),
      (3, 3, '2024-03-01', '2024-09-01')
    `)

    // 13. Insertar instalaciones
    console.log('🏭 Insertando instalaciones...')
    await db.query(`
      INSERT IGNORE INTO instalacion (id_instalacion, id_empresa_sucursal, nombre_instalacion, fecha_instalacion, estado_operativo, descripcion, tipo_uso, id_proceso) VALUES 
      (1, 2, 'Granja Acuícola Progreso 1', '2024-01-01', 'activo', 'Instalación principal de cultivo de tilapia', 'acuicultura', 1),
      (2, 3, 'Granja Acuícola Cancún 1', '2024-02-01', 'activo', 'Instalación de cultivo de camarón', 'acuicultura', 2),
      (3, 4, 'Granja Acuícola Campeche 1', '2024-03-01', 'activo', 'Instalación de cultivo de lobina', 'acuicultura', 3)
    `)

    // 14. Insertar sensores instalados
    console.log('📡 Insertando sensores instalados...')
    await db.query(`
      INSERT IGNORE INTO sensor_instalado (id_sensor_instalado, id_instalacion, id_sensor, fecha_instalada, descripcion, id_lectura) VALUES 
      (1, 1, 1, '2024-01-01', 'Sensor de temperatura principal', NULL),
      (2, 1, 2, '2024-01-01', 'Sensor de pH principal', NULL),
      (3, 1, 3, '2024-01-01', 'Sensor de oxígeno disuelto', NULL),
      (4, 2, 1, '2024-02-01', 'Sensor de temperatura principal', NULL),
      (5, 2, 2, '2024-02-01', 'Sensor de pH principal', NULL),
      (6, 3, 1, '2024-03-01', 'Sensor de temperatura principal', NULL),
      (7, 3, 3, '2024-03-01', 'Sensor de oxígeno disuelto', NULL)
    `)

    // 15. Asignar usuario administrador a todas las sucursales
    console.log('👥 Asignando usuario administrador...')
    await db.query(`
      INSERT IGNORE INTO asignacion_usuario (id_usuario, id_empresa_sucursal, id_instalacion, fecha_asignacion) VALUES 
      (1, 1, NULL, NOW()),
      (1, 2, NULL, NOW()),
      (1, 3, NULL, NOW()),
      (1, 4, NULL, NOW())
    `)

    // 16. Insertar algunas lecturas de ejemplo
    console.log('📈 Insertando lecturas de ejemplo...')
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toTimeString().split(' ')[0]
    
    await db.query(`
      INSERT IGNORE INTO lectura (id_lectura, id_sensor_instalado, valor, fecha, hora) VALUES 
      (1, 1, 28.5, ?, ?),
      (2, 2, 7.2, ?, ?),
      (3, 3, 6.8, ?, ?),
      (4, 4, 29.1, ?, ?),
      (5, 5, 7.0, ?, ?),
      (6, 6, 27.8, ?, ?),
      (7, 7, 7.1, ?, ?)
    `, [today, now, today, now, today, now, today, now, today, now, today, now, today, now])

    console.log('✅ Seed completado exitosamente!')
    console.log('')
    console.log('🔑 Credenciales de acceso:')
    console.log('   Email: admin@aquamonitor.com')
    console.log('   Contraseña: admin123')
    console.log('')
    console.log('📊 Datos creados:')
    console.log('   - 4 roles de usuario')
    console.log('   - 1 usuario administrador')
    console.log('   - 1 empresa principal')
    console.log('   - 3 sucursales')
    console.log('   - 3 instalaciones')
    console.log('   - 5 especies')
    console.log('   - 8 parámetros')
    console.log('   - 5 sensores en catálogo')
    console.log('   - 7 sensores instalados')
    console.log('   - 7 lecturas de ejemplo')

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Proceso completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error)
      process.exit(1)
    })
}

export default seedDatabase
