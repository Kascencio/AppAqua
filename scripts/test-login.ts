#!/usr/bin/env ts-node

import fetch from 'node-fetch'

const API_BASE = 'http://localhost:3000/api'

async function testLogin() {
  try {
    console.log('🧪 Probando el sistema de login...')

    // 1. Probar login con credenciales válidas
    console.log('\n1. Probando login con credenciales válidas...')
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correo: 'admin@aquamonitor.com',
        password: 'admin123'
      })
    })

    const loginData = await loginResponse.json()
    
    if (loginResponse.ok && loginData.success) {
      console.log('✅ Login exitoso!')
      console.log('👤 Usuario:', loginData.user.name)
      console.log('🔑 Rol:', loginData.user.role)
      console.log('🏢 Acceso a sucursales:', loginData.user.branchAccess)
      
      // 2. Probar endpoint /me
      console.log('\n2. Probando endpoint /me...')
      const meResponse = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.tokens.accessToken}`,
          'Content-Type': 'application/json',
        }
      })

      const meData = await meResponse.json()
      
      if (meResponse.ok && meData.success) {
        console.log('✅ Endpoint /me funciona correctamente!')
        console.log('👤 Usuario:', meData.user.name)
      } else {
        console.log('❌ Error en endpoint /me:', meData.error)
      }

      // 3. Probar logout
      console.log('\n3. Probando logout...')
      const logoutResponse = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const logoutData = await logoutResponse.json()
      
      if (logoutResponse.ok && logoutData.success) {
        console.log('✅ Logout exitoso!')
      } else {
        console.log('❌ Error en logout:', logoutData.error)
      }

    } else {
      console.log('❌ Error en login:', loginData.error)
    }

    // 4. Probar login con credenciales inválidas
    console.log('\n4. Probando login con credenciales inválidas...')
    const invalidLoginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correo: 'admin@aquamonitor.com',
        password: 'password_incorrecta'
      })
    })

    const invalidLoginData = await invalidLoginResponse.json()
    
    if (!invalidLoginResponse.ok) {
      console.log('✅ Login con credenciales inválidas correctamente rechazado!')
      console.log('🚫 Error:', invalidLoginData.error)
    } else {
      console.log('❌ Error: Login con credenciales inválidas fue aceptado!')
    }

    console.log('\n🎉 Pruebas de login completadas!')

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testLogin()
    .then(() => {
      console.log('✅ Pruebas completadas')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en pruebas:', error)
      process.exit(1)
    })
}

export { testLogin }
