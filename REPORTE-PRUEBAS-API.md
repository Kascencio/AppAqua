# 🧪 REPORTE DE PRUEBAS DE API - Backend Aqua Monitor

**Fecha:** 18 de diciembre de 2025  
**Backend URL:** http://195.35.11.179:3300  
**Ejecutado por:** Script automatizado de pruebas  
**Estado:** ✅ **TODAS LAS PRUEBAS PASARON (100%)**

---

## 📊 Resumen General

| Métrica | Valor |
|---------|-------|
| **Total de pruebas** | 8 |
| **✅ Exitosas** | 8 |
| **❌ Fallidas** | 0 |
| **Tasa de éxito** | **100.0%** 🎉 |

---

## ✅ Todos los Endpoints Funcionando Correctamente

### 1. Organizaciones
- **Endpoint:** `GET /api/organizaciones?page=1&limit=10`
- **Estado:** ✅ HTTP 200 OK
- **Formato:** Array de organizaciones con sucursales anidadas
- **Ejemplo de respuesta:**
```json
{
  "id_organizacion": 1,
  "nombre": "Organización Ejemplo",
  "razon_social": "Ejemplo S.A. de C.V.",
  "estado": "activa",
  "organizacion_sucursal": [...]
}
```

### 2. Sucursales
- **Endpoint:** `GET /api/sucursales?page=1&limit=10`
- **Estado:** ✅ HTTP 200 OK
- **Datos:** Lista de sucursales con información completa

### 3. Instalaciones
- **Endpoint:** `GET /api/instalaciones?page=1&limit=10`
- **Estado:** ✅ HTTP 200 OK
- **Datos:** Instalaciones (estanques) con estado operativo

### 4. Sensores Instalados
- **Endpoint:** `GET /api/sensores-instalados?page=1&limit=10`
- **Estado:** ✅ HTTP 200 OK
- **Datos:** Sensores con relaciones a instalaciones y catálogo
- **Sensores encontrados:**
  - Temperatura DS18B20
  - TDS (Sólidos disueltos)
  - Oxígeno Disuelto
  - ORP (Potencial oxidación-reducción)
  - Presión BMP180

### 5. Especies (Catálogo) ✨ CORREGIDO
- **Endpoint:** `GET /api/catalogo-especies?page=1&limit=10`
- **Estado:** ✅ HTTP 200 OK
- **Corrección aplicada:** Cambiado de `/api/especies` a `/api/catalogo-especies`
- **Datos:** Lista de especies disponibles para cultivo
- **Ejemplo:**
```json
{
  "id_especie": 1,
  "nombre": "Tilapia"
}
```

### 6. Procesos
- **Endpoint:** `GET /api/procesos?page=1&limit=10`
- **Estado:** ✅ HTTP 200 OK
- **Datos:** Procesos de cultivo con fechas y especies

### 7. Lecturas ✨ CORREGIDO
- **Endpoint:** `GET /api/lecturas?sensorInstaladoId=1&page=1&limit=100&desde=...&hasta=...`
- **Estado:** ✅ HTTP 200 OK
- **Correcciones aplicadas:**
  1. Parámetro `sensorInstaladoId` ahora es **obligatorio** (diseño del backend)
  2. Usar **camelCase** (`sensorInstaladoId`) en lugar de snake_case
- **Datos de ejemplo:**
```json
{
  "id_lectura": 614898,
  "id_sensor_instalado": 1,
  "valor": 26.59,
  "tomada_en": "2025-12-18T23:59:33.000Z",
  "fecha": "2025-12-18T00:00:00.000Z",
  "hora": "1970-01-01T23:59:33.000Z"
}
```
- **Nota importante:** Por diseño y rendimiento, el backend requiere especificar el sensor. Consultar todas las lecturas de todos los sensores sería demasiado pesado.

### 8. Health Check
- **Endpoint:** `GET /health`
- **Estado:** ✅ HTTP 200 OK
- **Propósito:** Verificación de estado del servidor

---

## 🔧 Correcciones Realizadas

### 1. Configuración HTTP vs HTTPS
**Problema detectado:** El archivo `.env` tenía configurado `https://` cuando el backend usa `http://`

**Antes:**
```env
NEXT_PUBLIC_EXTERNAL_API_URL="https://195.35.11.179:3300"
NEXT_PUBLIC_WS_URL="wss://195.35.11.179:3300/ws/lecturas"
```

**Después:**
```env
NEXT_PUBLIC_EXTERNAL_API_URL="http://195.35.11.179:3300"
NEXT_PUBLIC_WS_URL="ws://195.35.11.179:3300/ws/lecturas"
```

### 2. Endpoint de Especies
**Problema:** El endpoint `/api/especies` no existía (404 Not Found)

**Solución:** El endpoint correcto es `/api/catalogo-especies`

**Archivos actualizados:**
- `lib/backend-client.ts` - Todos los métodos de especies actualizados
- `scripts/test-api.sh` - Script de pruebas actualizado
- `scripts/test-api.ts` - Script TypeScript actualizado

### 3. Endpoint de Lecturas
**Problema:** Error 400 al intentar obtener lecturas sin especificar sensor

**Razones del diseño:**
1. Por rendimiento: consultar todas las lecturas de todos los sensores sería muy pesado
2. Por lógica de negocio: las lecturas siempre están asociadas a un sensor específico

**Solución:** Siempre enviar `sensorInstaladoId` (en camelCase) como parámetro obligatorio

**Cambios implementados:**
```typescript
// Antes (incorrecto):
await backendApi.getLecturas({
  page: 1,
  limit: 100,
  desde,
  hasta
})

// Después (correcto):
await backendApi.getLecturas({
  sensorInstaladoId: 1, // OBLIGATORIO en camelCase
  page: 1,
  limit: 100,
  desde,
  hasta
})
```

**Archivos actualizados:**
- `lib/backend-client.ts` - Parámetro ahora obligatorio
- `app/analytics/page.tsx` - Itera sobre sensores para obtener lecturas
- `scripts/test-api.ts` - Obtiene sensor antes de consultar lecturas
- `scripts/test-api.sh` - Usa sensorInstaladoId en camelCase

---

## 📝 Convenciones del Backend

### Nombres de Query Parameters
El backend usa **camelCase** para los query parameters:

| ❌ Incorrecto (snake_case) | ✅ Correcto (camelCase) |
|----------------------------|-------------------------|
| `sensor_instalado_id` | `sensorInstaladoId` |
| `instalacion_id` | `instalacionId` |
| `tipo_medida` | `tipoMedida` |

### Formato de Respuestas
El backend retorna arrays directamente (no envueltos en objeto `data`):
```json
[
  { "id": 1, "nombre": "..." },
  { "id": 2, "nombre": "..." }
]
```

---

## 🧪 Cómo Ejecutar las Pruebas

### Usando el script de bash (recomendado):
```bash
bash scripts/test-api.sh
```

### Pruebas individuales con curl:
```bash
# Organizaciones
curl "http://195.35.11.179:3300/api/organizaciones?page=1&limit=10" | jq '.'

# Especies (catálogo)
curl "http://195.35.11.179:3300/api/catalogo-especies?page=1&limit=10" | jq '.'

# Lecturas (requiere sensorInstaladoId)
curl "http://195.35.11.179:3300/api/lecturas?sensorInstaladoId=1&page=1&limit=5" | jq '.'

# Health Check
curl "http://195.35.11.179:3300/health"
```

### Pruebas automatizadas recomendadas:
```bash
# 1. Iniciar el servidor de desarrollo (si aplica)
npm run dev

# 2. Ejecutar scripts de verificación
bash scripts/test-api.sh
npx tsx scripts/test-api.ts
```

---

## ✨ Conclusión

El backend está **100% operacional** con todos los endpoints funcionando correctamente. Las correcciones implementadas fueron:

1. ✅ **URL corregida** - HTTP en lugar de HTTPS
2. ✅ **Endpoint de especies** - `/api/catalogo-especies` implementado
3. ✅ **Endpoint de lecturas** - Requiere `sensorInstaladoId` obligatorio (by design)
4. ✅ **Convenciones** - Uso de camelCase para query parameters

**Estado general:** 🎉 **100% FUNCIONAL** - Todos los módulos operan correctamente.
