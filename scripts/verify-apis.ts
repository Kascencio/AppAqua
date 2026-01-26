
import { spawn } from 'child_process';

const API_BASE = 'http://localhost:3000/api';

async function main() {
    console.log('🚀 Starting API Verification...');

    // 1. Authenticate
    console.log('\n🔑 Authenticating...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'admin@aquamonitor.com', password: 'admin123' })
    });

    if (!loginRes.ok) {
        console.error('❌ Login failed:', loginRes.status, await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    const token = loginData.tokens?.accessToken;

    if (!token) {
        console.error('❌ Login succeeded but no token returned');
        return;
    }
    console.log('✅ Authenticated successfully');

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Define endpoints to test (GET only for safety)
    const endpoints = [
        { name: 'Me', url: '/auth/me' },
        { name: 'Organizaciones', url: '/organizaciones' },
        { name: 'Sucursales', url: '/sucursales' },
        { name: 'Usuarios', url: '/usuarios' },
        { name: 'Instalaciones', url: '/instalaciones' },
        { name: 'Catálogo Especies', url: '/catalogo-especies' },
        { name: 'Parámetros', url: '/parametros' },
        { name: 'Especie-Parámetros', url: '/especie-parametros' },
        { name: 'Catálogo Sensores', url: '/catalogo-sensores' },
        { name: 'Sensores Instalados', url: '/sensores-instalados' },
        { name: 'Procesos', url: '/procesos' }
    ];

    // 3. Test loop
    console.log('\n📡 Verifying Endpoints...');
    let passed = 0;
    let failed = 0;

    for (const ep of endpoints) {
        process.stdout.write(`Testing ${ep.name} (${ep.url})... `);
        try {
            const res = await fetch(`${API_BASE}${ep.url}`, { headers });
            if (res.ok) {
                const data = await res.json();
                const itemCount = Array.isArray(data) ? data.length : (data.data ? data.data.length : 'N/A');
                console.log(`✅ OK (${res.status}) - Items: ${itemCount}`);
                passed++;
            } else {
                console.log(`❌ FAILED (${res.status}) - ${res.statusText}`);
                failed++;
            }
        } catch (err: any) {
            console.log(`❌ ERROR: ${err.message}`);
            failed++;
        }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total: ${endpoints.length}`);
}

main().catch(console.error);
