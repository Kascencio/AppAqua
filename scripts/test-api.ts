/**
 * Script de pruebas para verificar que la API del backend funcione correctamente
 * 
 * Ejecutar con: npx tsx scripts/test-api.ts
 */

import { backendApi } from '../lib/backend-client'

// Colores para la salida en consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green)
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red)
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue)
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow)
}

function logSection(title: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan)
  log(`  ${title}`, colors.cyan)
  log(`${'='.repeat(60)}`, colors.cyan)
}

// Interfaz para resultados de tests
interface TestResult {
  name: string
  success: boolean
  message: string
  data?: any
}

const results: TestResult[] = []

function addResult(name: string, success: boolean, message: string, data?: any) {
  results.push({ name, success, message, data })
}

async function testAuthentication() {
  logSection('PRUEBAS DE AUTENTICACIÓN')
  
  try {
    // Test de login con credenciales de prueba
    logInfo('Probando login...')
    
    try {
      const loginResult = await backendApi.login('admin@aqua.com', 'admin123')
      
      if (loginResult.data && loginResult.data.token) {
        logSuccess(`Login exitoso - Token obtenido: ${loginResult.data.token.substring(0, 20)}...`)
        addResult('Login', true, 'Login exitoso', { 
          usuario: loginResult.data.usuario?.nombre || 'N/A',
          rol: loginResult.data.usuario?.rol || 'N/A'
        })
      } else {
        logError('Login falló - No se obtuvo token')
        addResult('Login', false, 'No se obtuvo token en la respuesta')
      }
    } catch (error: any) {
      logWarning(`Login con credenciales de prueba falló: ${error.message}`)
      logInfo('Esto es esperado si no existen usuarios en el sistema')
      addResult('Login', false, `Login falló: ${error.message}`)
    }
    
  } catch (error: any) {
    logError(`Error en pruebas de autenticación: ${error.message}`)
    addResult('Autenticación General', false, error.message)
  }
}

async function testOrganizaciones() {
  logSection('PRUEBAS DE ORGANIZACIONES')
  
  try {
    logInfo('Obteniendo lista de organizaciones...')
    const response = await backendApi.getOrganizaciones({ page: 1, limit: 10 })
    
    logSuccess(`Se obtuvieron ${response.data.length} organizaciones`)
    log(`Total en BD: ${response.pagination.total}`, colors.cyan)
    
    addResult('Organizaciones - Listar', true, `${response.data.length} organizaciones obtenidas`, {
      total: response.pagination.total,
      activas: response.data.filter(o => o.activo).length
    })
    
    if (response.data.length > 0) {
      const org = response.data[0]
      log(`Primera organización: ${org.nombre} (ID: ${org.id_organizacion})`, colors.cyan)
    }
    
  } catch (error: any) {
    logError(`Error en pruebas de organizaciones: ${error.message}`)
    addResult('Organizaciones - Listar', false, error.message)
  }
}

async function testSucursales() {
  logSection('PRUEBAS DE SUCURSALES')
  
  try {
    logInfo('Obteniendo lista de sucursales...')
    const response = await backendApi.getSucursales({ page: 1, limit: 10 })
    
    logSuccess(`Se obtuvieron ${response.data.length} sucursales`)
    log(`Total en BD: ${response.pagination.total}`, colors.cyan)
    
    addResult('Sucursales - Listar', true, `${response.data.length} sucursales obtenidas`, {
      total: response.pagination.total,
      activas: response.data.filter(s => s.activo).length
    })
    
    if (response.data.length > 0) {
      const suc = response.data[0]
      log(`Primera sucursal: ${suc.nombre} (ID: ${suc.id_sucursal})`, colors.cyan)
    }
    
  } catch (error: any) {
    logError(`Error en pruebas de sucursales: ${error.message}`)
    addResult('Sucursales - Listar', false, error.message)
  }
}

async function testInstalaciones() {
  logSection('PRUEBAS DE INSTALACIONES')
  
  try {
    logInfo('Obteniendo lista de instalaciones...')
    const response = await backendApi.getInstalaciones({ page: 1, limit: 10 })
    
    logSuccess(`Se obtuvieron ${response.data.length} instalaciones`)
    log(`Total en BD: ${response.pagination.total}`, colors.cyan)
    
    addResult('Instalaciones - Listar', true, `${response.data.length} instalaciones obtenidas`, {
      total: response.pagination.total,
      activas: response.data.filter(i => i.activo).length
    })
    
    if (response.data.length > 0) {
      const inst = response.data[0]
      log(`Primera instalación: ${inst.nombre} (ID: ${inst.id_instalacion})`, colors.cyan)
    }
    
  } catch (error: any) {
    logError(`Error en pruebas de instalaciones: ${error.message}`)
    addResult('Instalaciones - Listar', false, error.message)
  }
}

async function testSensores() {
  logSection('PRUEBAS DE SENSORES')
  
  try {
    logInfo('Obteniendo lista de sensores instalados...')
    const response = await backendApi.getSensoresInstalados({ page: 1, limit: 10 })
    
    logSuccess(`Se obtuvieron ${response.data.length} sensores`)
    log(`Total en BD: ${response.pagination.total}`, colors.cyan)
    
    addResult('Sensores - Listar', true, `${response.data.length} sensores obtenidos`, {
      total: response.pagination.total
    })
    
    if (response.data.length > 0) {
      const sensor = response.data[0]
      log(`Primer sensor: ${sensor.tipo_medida || 'N/A'} (ID: ${sensor.id_sensor_instalado})`, colors.cyan)
    }
    
  } catch (error: any) {
    logError(`Error en pruebas de sensores: ${error.message}`)
    addResult('Sensores - Listar', false, error.message)
  }
}

async function testEspecies() {
  logSection('PRUEBAS DE ESPECIES (CATÁLOGO)')
  
  try {
    logInfo('Obteniendo lista de especies desde catálogo...')
    const response = await backendApi.getEspecies({ page: 1, limit: 10 })
    
    logSuccess(`Se obtuvieron ${response.data.length} especies`)
    log(`Total en BD: ${response.pagination.total}`, colors.cyan)
    
    addResult('Especies - Listar', true, `${response.data.length} especies obtenidas`, {
      total: response.pagination.total
    })
    
    if (response.data.length > 0) {
      const especie = response.data[0]
      log(`Primera especie: ${especie.nombre_comun} (${especie.nombre_cientifico})`, colors.cyan)
    }
    
  } catch (error: any) {
    logError(`Error en pruebas de especies: ${error.message}`)
    addResult('Especies - Listar', false, error.message)
  }
}

async function testProcesos() {
  logSection('PRUEBAS DE PROCESOS')
  
  try {
    logInfo('Obteniendo lista de procesos...')
    const response = await backendApi.getProcesos({ page: 1, limit: 10 })
    
    logSuccess(`Se obtuvieron ${response.data.length} procesos`)
    log(`Total en BD: ${response.pagination.total}`, colors.cyan)
    
    addResult('Procesos - Listar', true, `${response.data.length} procesos obtenidos`, {
      total: response.pagination.total,
      activos: response.data.filter(p => p.estado === 'activo').length
    })
    
    if (response.data.length > 0) {
      const proc = response.data[0]
      log(`Primer proceso: ID ${proc.id_proceso} - Estado: ${proc.estado}`, colors.cyan)
    }
    
  } catch (error: any) {
    logError(`Error en pruebas de procesos: ${error.message}`)
    addResult('Procesos - Listar', false, error.message)
  }
}

async function testLecturas() {
  logSection('PRUEBAS DE LECTURAS')
  
  try {
    // Primero obtener un sensor válido
    logInfo('Obteniendo sensor para pruebas...')
    const sensorsResponse = await backendApi.getSensoresInstalados({ page: 1, limit: 1 })
    
    if (sensorsResponse.data.length === 0) {
      logWarning('No hay sensores disponibles para probar lecturas')
      addResult('Lecturas - Listar', false, 'No hay sensores disponibles')
      return
    }
    
    const sensorId = sensorsResponse.data[0].id_sensor_instalado
    logInfo(`Obteniendo lecturas del sensor ${sensorId}...`)
    
    const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Últimos 7 días
    const hasta = new Date().toISOString()
    
    const response = await backendApi.getLecturas({ 
      sensorInstaladoId: sensorId, // OBLIGATORIO (camelCase)
      page: 1, 
      limit: 100,
      desde,
      hasta 
    })
    
    logSuccess(`Se obtuvieron ${response.data.length} lecturas`)
    log(`Total en BD: ${response.pagination.total}`, colors.cyan)
    
    addResult('Lecturas - Listar', true, `${response.data.length} lecturas obtenidas`, {
      total: response.pagination.total,
      sensorId,
      rango: 'Últimos 7 días'
    })
    
    if (response.data.length > 0) {
      const lectura = response.data[0]
      log(`Última lectura: ${lectura.tipo_medida} = ${lectura.valor} (${new Date(lectura.tomada_en).toLocaleString()})`, colors.cyan)
    }
    
  } catch (error: any) {
    logError(`Error en pruebas de lecturas: ${error.message}`)
    addResult('Lecturas - Listar', false, error.message)
  }
}

function printSummary() {
  logSection('RESUMEN DE PRUEBAS')
  
  const total = results.length
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  log(`\nTotal de pruebas: ${total}`, colors.cyan)
  logSuccess(`Exitosas: ${passed}`)
  logError(`Fallidas: ${failed}`)
  
  log('\nDetalle de resultados:', colors.cyan)
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌'
    const color = result.success ? colors.green : colors.red
    log(`${index + 1}. ${icon} ${result.name}`, color)
    log(`   ${result.message}`, colors.reset)
    if (result.data) {
      log(`   Datos: ${JSON.stringify(result.data)}`, colors.reset)
    }
  })
  
  // Porcentaje de éxito
  const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0'
  log(`\nTasa de éxito: ${successRate}%`, colors.cyan)
  
  if (failed === 0) {
    log('\n🎉 ¡Todas las pruebas pasaron exitosamente!', colors.green)
  } else {
    log(`\n⚠️  ${failed} prueba(s) fallaron. Revisa los errores arriba.`, colors.yellow)
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan)
  log('║         PRUEBAS DE API - BACKEND AQUA MONITOR            ║', colors.cyan)
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan)
  
  logInfo(`Backend URL: ${process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'No configurado'}`)
  logInfo(`Fecha: ${new Date().toLocaleString()}`)
  
  try {
    // Ejecutar todas las pruebas
    await testAuthentication()
    await testOrganizaciones()
    await testSucursales()
    await testInstalaciones()
    await testSensores()
    await testEspecies()
    await testProcesos()
    await testLecturas()
    
    // Imprimir resumen
    printSummary()
    
  } catch (error: any) {
    logError(`Error crítico durante las pruebas: ${error.message}`)
    console.error(error)
  }
}

// Ejecutar pruebas
main().catch(console.error)
