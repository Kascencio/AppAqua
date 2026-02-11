# 🔄 Plan de Integración del Backend Externo

## 📋 Resumen Ejecutivo

**Objetivo**: Integrar el backend Fastify (puerto 3300) con la aplicación Next.js existente manteniendo el diseño actual.

**Backend URL**: `https://195.35.11.179:3300`

**Cambios Críticos Identificados**:
1. **Modelo de Datos Diferente**: El backend usa `organizacion` y `organizacion_sucursal` en lugar de `empresa` y `empresa_sucursal`
2. **WebSocket Real**: El backend implementa WebSocket nativo en `/ws/lecturas` con filtros por `sensorInstaladoId` o `instalacionId`
3. **Estructura de Lecturas**: El backend usa eventos `lectura.created` con estructura diferente
4. **API Endpoints**: Nuevos endpoints con nomenclatura diferente (catalogo-sensores, sensores-instalados, etc.)

---

## 🎯 Prioridades de Integración

### ⚠️ CRÍTICO - Actualización en Tiempo Real (WebSocket)
**Problema Actual**: El hook `useWebSocket` intenta suscribirse con `{type: 'subscribe', sensorIds: [...]}` pero el backend Fastify NO SOPORTA suscripciones dinámicas. Solo acepta filtros en la URL de conexión.

**Impacto**: Las cards de sensores NO se actualizarán en tiempo real como espera el usuario.

**Solución Requerida**: Rediseñar el sistema WebSocket para conectar una instancia por instalación/sensor usando query params.

---

## 📊 Análisis de Diferencias

### Modelo de Datos Actual vs Backend Nuevo

| Concepto | App Actual | Backend Nuevo |
|----------|-----------|---------------|
| Empresa | `empresa` | `organizacion` |
| Sucursal | `empresa_sucursal` | `organizacion_sucursal` |
| Estado | `estado` enum | `estado` (activa/inactiva) |
| Sensores | `sensor_instalado` | `sensor_instalado` (igual) |
| Catálogo | `catalogo_sensores` | `catalogo_sensores` (igual) |
| Lecturas | `lectura` | `lectura` (estructura diferente) |
| Usuario | `usuario` (estado: activo/inactivo) | `usuario` (mismo schema) |

### WebSocket - Diferencias Críticas

**App Actual (implementación ficticia)**:
```typescript
// Conexión única con suscripción dinámica
ws.connect('ws://host/ws')
ws.send({ type: 'subscribe', sensorIds: [1,2,3] })
```

**Backend Real (Fastify)**:
```typescript
// Conexión con filtros en URL, sin suscripción dinámica
ws = new WebSocket('ws://host/ws/lecturas?sensorInstaladoId=1')
// O filtrar por instalación:
ws = new WebSocket('ws://host/ws/lecturas?instalacionId=5')
```

**Eventos Recibidos**:
```json
{
  "type": "lectura.created",
  "data": {
    "id_lectura": 12345,
    "sensor_instalado_id": 1,
    "instalacion_id": 5,
    "tipo_medida": "temperatura",
    "tomada_en": "2025-11-05T11:00:00.000Z",
    "valor": 23.5
  }
}
```

### API Endpoints - Comparación

| Recurso | App Actual | Backend Nuevo |
|---------|-----------|---------------|
| Organizaciones | `/api/empresas` | `/api/organizaciones` |
| Sucursales | `/api/sucursales` | `/api/sucursales` |
| Instalaciones | `/api/instalaciones` | `/api/instalaciones` |
| Catálogo Sensores | `/api/sensores` | `/api/catalogo-sensores` |
| Sensores Instalados | `/api/sensors` | `/api/sensores-instalados` |
| Lecturas | `/api/lecturas` | `/api/lecturas` |
| Promedios | No existe | `/api/promedios?granularity=15min\|hour` |
| Resumen Horario | No existe | `/api/resumen-horario` |
| Especies | `/api/especies` | `/api/catalogo-especies` |
| Procesos | `/api/procesos` | `/api/procesos` |
| Usuarios | `/api/usuarios` | `/api/usuarios` |
| Login | `/api/login` | `/api/login` |

---

## 🚨 Funcionalidades Faltantes en Backend

### 1. Asignación de Usuarios a Sucursales
**Estado**: ❌ No implementado en backend
**Tabla DB**: `asignacion_usuario` existe en schema pero sin endpoints
**Impacto**: No se puede gestionar qué usuarios tienen acceso a qué sucursales
**Solución**: Generar endpoints en backend o implementar lógica en Next.js API routes

### 2. Alertas con Notificaciones
**Estado**: ⚠️ Parcialmente implementado
**Endpoints Disponibles**: 
- `GET/POST/PUT/DELETE /api/alertas`
**Faltante**: 
- Sistema de notificaciones push/email
- Webhook para alertas en tiempo real
- Configuración de umbrales personalizados por instalación

### 3. Reportes Avanzados
**Estado**: ⚠️ Solo XML
**Disponible**: `GET /api/reportes/xml`
**Faltante**:
- Reportes PDF
- Reportes Excel/CSV
- Reportes personalizados por período
- Comparativas entre instalaciones

### 4. Dashboard de Analytics
**Estado**: ❌ No implementado
**Necesario**:
- Agregados por organización
- Métricas de rendimiento
- Estadísticas de alertas
- Tendencias históricas

---

## 🔧 Cambios Técnicos Requeridos

### A. Variables de Entorno (.env)
```env
# Backend Externo (Fastify)
NEXT_PUBLIC_EXTERNAL_API_URL=https://195.35.11.179:3300
NEXT_PUBLIC_WS_URL=wss://195.35.11.179:3300/ws/lecturas

# Backend Interno (Next.js API Routes) - Mantener para funcionalidades no migradas
DATABASE_URL=mysql://root:Mvergel*@195.35.11.179:3306/u889902058_sonda0109

# Auth (compartido)
NEXTAUTH_SECRET=P/ULq4ccdehxSB+G0xJNQGViIY9B8+pvel1DDu8wjx75Xnq7SQMDwmv8l8M=
JWT_SECRET=4sPaIl6kO5sFSElo+MpY6nITSu2Yeux1AStpEOyxjq4dxWuRdONuY3Mk01/0KRD4
```

### B. Cliente API Centralizado
**Archivo**: `/lib/backend-client.ts`

Necesita:
- Manejo de autenticación (JWT en headers)
- Interceptores para errores
- Caché de respuestas frecuentes
- Retry automático en fallos
- Transformación de datos entre modelos

### C. Hook WebSocket Rediseñado
**Archivo**: `/hooks/use-websocket.ts`

**Cambios Críticos**:
1. **Eliminar sistema de suscripción**: El backend NO soporta `{type: 'subscribe', sensorIds: []}`
2. **Implementar conexiones por filtro**: Una conexión WebSocket por instalación o sensor
3. **Pool de conexiones**: Gestionar múltiples WebSockets activos
4. **Reconexión inteligente**: Backoff exponencial
5. **Compartir conexiones**: Múltiples componentes pueden usar la misma conexión WS si filtran por la misma instalación

**Arquitectura Propuesta**:
```typescript
// Manager global de conexiones WebSocket
class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map()
  
  // Obtener o crear conexión para una instalación
  getOrCreateConnection(instalacionId: number): WebSocket {
    const key = `instalacion-${instalacionId}`
    if (!this.connections.has(key)) {
      const ws = new WebSocket(`${WS_URL}?instalacionId=${instalacionId}`)
      this.connections.set(key, ws)
      this.setupEventHandlers(ws, key)
    }
    return this.connections.get(key)!
  }
  
  // Obtener o crear conexión para un sensor específico
  getOrCreateConnectionForSensor(sensorId: number): WebSocket {
    const key = `sensor-${sensorId}`
    if (!this.connections.has(key)) {
      const ws = new WebSocket(`${WS_URL}?sensorInstaladoId=${sensorId}`)
      this.connections.set(key, ws)
      this.setupEventHandlers(ws, key)
    }
    return this.connections.get(key)!
  }
}
```

### D. Componentes a Actualizar

#### 1. `sensor-monitoring-card.tsx`
**Cambios**:
- Adaptar `useWebSocket` para usar conexión por instalación
- Parsear eventos `lectura.created` del backend
- Mapear `sensor_instalado_id` a `sensorId` local
- Manejar `tomada_en` timestamp del backend

#### 2. `app/sensors/page.tsx`
**Cambios**:
- Conectar UN WebSocket por instalación (no uno por sensor)
- Distribuir eventos del WS a las cards correspondientes usando Context API o Zustand
- Optimizar: No crear 50 WebSockets para 50 sensores, crear 5 para 5 instalaciones

#### 3. Hooks de Datos
- `use-sensors.ts`: Cambiar endpoints a `/api/catalogo-sensores` y `/api/sensores-instalados`
- `use-species.ts`: Cambiar a `/api/catalogo-especies`
- `use-instalaciones.ts`: Mantener `/api/instalaciones`
- `use-organizaciones.ts`: **NUEVO** - Crear para `/api/organizaciones`

---

## 📝 TODO List Detallado

### 🔴 FASE 1: CRÍTICO - WebSocket en Tiempo Real (2-3 días)

#### Task 1.1: Rediseñar WebSocket Manager
- [ ] Crear `/lib/websocket-manager.ts` con pool de conexiones
- [ ] Implementar `getOrCreateConnection(instalacionId)` y `getOrCreateConnectionForSensor(sensorId)`
- [ ] Añadir lógica de reconexión exponencial
- [ ] Implementar sistema de suscriptores (múltiples componentes pueden escuchar la misma conexión)
- [ ] Añadir logging y métricas de conexión

#### Task 1.2: Actualizar Hook useWebSocket
- [ ] Eliminar lógica de suscripción dinámica (`ws.send({type: 'subscribe'})`)
- [ ] Cambiar a usar WebSocketManager global
- [ ] Adaptar parsing de mensajes a formato `lectura.created` del backend
- [ ] Mapear campos: `sensor_instalado_id` → `sensorId`, `tomada_en` → `timestamp`, `valor` → `value`
- [ ] Añadir fallback a polling si WebSocket falla
- [ ] Tests unitarios para el hook

#### Task 1.3: Actualizar Componentes de Sensores
- [ ] **sensor-monitoring-card.tsx**:
  - Cambiar `useWebSocket({ sensorId })` a usar instalación si es más eficiente
  - Adaptar parsing de eventos del WS
  - Actualizar solo la card específica (sin recargar página completa)
- [ ] **app/sensors/page.tsx**:
  - Implementar Context Provider para compartir conexiones WS entre cards
  - Crear una conexión por instalación, no por sensor
  - Distribuir eventos a las cards correspondientes
  - Optimizar renderizado (React.memo, useMemo)

#### Task 1.4: Testing de WebSocket
- [ ] Pruebas manuales en ambiente de desarrollo
- [ ] Validar que SOLO las cards se actualicen (no toda la página)
- [ ] Medir latencia de actualización (debe ser < 1 segundo)
- [ ] Probar con múltiples sensores simultáneos (10-50)
- [ ] Validar reconexión automática tras pérdida de conexión

---

### 🟠 FASE 2: ALTO - API Client y Endpoints (2 días)

#### Task 2.1: Cliente API Centralizado
- [ ] Crear `/lib/backend-client.ts` con clase `BackendApiClient`
- [ ] Implementar métodos para todos los endpoints del backend:
  ```typescript
  class BackendApiClient {
    // Organizaciones
    getOrganizaciones(): Promise<Organizacion[]>
    getOrganizacion(id: number): Promise<Organizacion>
    createOrganizacion(data: CreateOrganizacionDto): Promise<Organizacion>
    updateOrganizacion(id: number, data: UpdateOrganizacionDto): Promise<Organizacion>
    deleteOrganizacion(id: number): Promise<void>
    
    // Sucursales
    getSucursales(orgId?: number): Promise<Sucursal[]>
    // ... similar para otros recursos
    
    // Lecturas
    getLecturas(params: {
      sensorInstaladoId?: number
      instalacionId?: number
      from?: string
      to?: string
      limit?: number
    }): Promise<Lectura[]>
    
    getPromedios(params: {
      granularity: '15min' | 'hour'
      sensorInstaladoId: number
      from?: string
      to?: string
    }): Promise<Promedio[]>
    
    getResumenHorario(params: {
      sensorInstaladoId: number
      from?: string
      to?: string
    }): Promise<ResumenHorario[]>
  }
  ```
- [ ] Añadir interceptores:
  - Request: Inyectar JWT token
  - Response: Transformar errores, caché
- [ ] Implementar retry automático con backoff

#### Task 2.2: Migrar Hooks de Datos
- [ ] **use-organizaciones.ts** (NUEVO):
  ```typescript
  export function useOrganizaciones() {
    const [organizaciones, setOrganizaciones] = useState([])
    const [loading, setLoading] = useState(true)
    
    const fetchOrganizaciones = async () => {
      const data = await backendClient.getOrganizaciones()
      setOrganizaciones(data)
    }
    
    const createOrganizacion = async (data) => {
      const newOrg = await backendClient.createOrganizacion(data)
      setOrganizaciones(prev => [...prev, newOrg])
    }
    
    // ... similar para update, delete
    return { organizaciones, loading, createOrganizacion, ... }
  }
  ```
- [ ] **use-sensors.ts**: Migrar a endpoints nuevos
  - Cambiar `/api/sensores` → `/api/catalogo-sensores`
  - Cambiar `/api/sensors` → `/api/sensores-instalados`
  - Adaptar estructura de respuesta
- [ ] **use-species.ts**: Migrar a `/api/catalogo-especies`
- [ ] **use-lecturas.ts**: Usar endpoints de lecturas del backend
- [ ] **use-promedios.ts** (NUEVO): Para `/api/promedios`
- [ ] **use-resumen-horario.ts** (NUEVO): Para `/api/resumen-horario`

#### Task 2.3: Actualizar Páginas CRUD
- [ ] **Organizaciones**: Crear páginas CRUD (actualmente no existen)
  - `/app/organizaciones/page.tsx`: Listado
  - `/components/add-organizacion-dialog.tsx`
  - `/components/edit-organizacion-dialog.tsx`
- [ ] **Sucursales**: Adaptar a nuevo modelo `organizacion_sucursal`
  - Cambiar `id_empresa` → `id_organizacion`
  - Actualizar formularios
- [ ] **Instalaciones**: Validar compatibilidad (parece compatible)
- [ ] **Sensores**: Actualizar a `/api/sensores-instalados`
- [ ] **Especies**: Migrar a `/api/catalogo-especies`
- [ ] **Usuarios**: Validar compatibilidad (schema parece igual)

---

### 🟡 FASE 3: MEDIO - Funcionalidades Avanzadas (3 días)

#### Task 3.1: Promedios y Resúmenes
- [ ] Crear componente `PromediosChart` para visualizar datos agregados
- [ ] Añadir selector de granularidad (15min / hora)
- [ ] Integrar en dashboard de monitoreo
- [ ] Optimizar queries para rangos grandes (usar promedios en vez de lecturas crudas)

#### Task 3.2: Alertas Mejoradas
- [ ] Crear página `/app/alertas/page.tsx` para gestión completa
- [ ] Implementar filtros por:
  - Instalación
  - Sensor
  - Nivel de severidad
  - Estado (activa/resuelta)
- [ ] Añadir notificaciones en UI (toast) al recibir alertas
- [ ] Badge de contador de alertas no leídas en navbar

#### Task 3.3: Reportes XML
- [ ] Crear página `/app/reportes/page.tsx`
- [ ] Formulario de generación de reportes:
  - Selector de sensor/instalación
  - Rango de fechas
  - Formato: XML (único disponible en backend)
- [ ] Descarga directa del archivo XML
- [ ] Previsualización del contenido

#### Task 3.4: Sistema de Asignación de Usuarios
- [ ] **CREAR ENDPOINTS EN BACKEND** (ver BACKEND-MISSING.md):
  ```
  POST /api/asignacion-usuario
  GET /api/asignacion-usuario?userId=X
  DELETE /api/asignacion-usuario/:id
  ```
- [ ] Hook `use-asignaciones.ts`
- [ ] Componente de gestión en perfil de usuario
- [ ] Filtrado de sucursales/instalaciones según asignaciones del usuario

---

### 🟢 FASE 4: BAJO - Optimizaciones y UX (2 días)

#### Task 4.1: Caché y Performance
- [ ] Implementar React Query para caché de datos
- [ ] Invalidación inteligente de caché al recibir WebSocket events
- [ ] Lazy loading de componentes pesados
- [ ] Virtualización de listas largas (react-window)

#### Task 4.2: Estados de Carga y Errores
- [ ] Skeleton loaders consistentes en toda la app
- [ ] Error boundaries personalizados
- [ ] Página 404 personalizada
- [ ] Página de error de red

#### Task 4.3: Documentación
- [ ] README actualizado con nueva arquitectura
- [ ] Guía de configuración de variables de entorno
- [ ] Diagramas de flujo de datos
- [ ] Documentación de hooks y componentes principales

#### Task 4.4: Testing
- [ ] Tests unitarios para hooks críticos
- [ ] Tests de integración para flujos principales
- [ ] Tests E2E con Playwright para WebSocket

---

## 🔧 Migraciones de Base de Datos

### Cambios NO Necesarios en DB
El schema del backend ya está alineado con la base de datos actual. Los cambios son solo en la capa de aplicación.

### Validar Compatibilidad
- [ ] Verificar que `organizacion.estado` usa enum correcto ('activa', 'inactiva')
- [ ] Validar foreign keys entre `organizacion` → `organizacion_sucursal` → `instalacion`
- [ ] Confirmar índices en tablas grandes (lectura, promedio)

---

## 📋 Checklist de Validación

### Pre-Integración
- [ ] Backend Fastify corriendo en puerto 3300
- [ ] Base de datos accesible desde backend
- [ ] Health check del backend responde: `GET https://195.35.11.179:3300/health`
- [ ] Variables de entorno configuradas correctamente

### Post-Integración - WebSocket
- [ ] ✅ Conexión WebSocket establecida exitosamente
- [ ] ✅ Cards de sensores se actualizan en tiempo real
- [ ] ✅ Solo las cards afectadas se rerrenderizan (no toda la página)
- [ ] ✅ Reconexión automática funciona tras pérdida de conexión
- [ ] ✅ Múltiples sensores actualizan simultáneamente sin conflictos
- [ ] ✅ Latencia de actualización < 1 segundo

### Post-Integración - API
- [ ] ✅ CRUD de organizaciones funciona completamente
- [ ] ✅ CRUD de sucursales funciona completamente
- [ ] ✅ CRUD de instalaciones funciona completamente
- [ ] ✅ CRUD de sensores funciona completamente
- [ ] ✅ CRUD de especies funciona completamente
- [ ] ✅ Lecturas históricas se cargan correctamente
- [ ] ✅ Promedios se calculan y visualizan
- [ ] ✅ Resúmenes horarios disponibles

### Post-Integración - UX
- [ ] ✅ Diseño actual se mantiene sin cambios visuales
- [ ] ✅ Performance no degradada (medir con Lighthouse)
- [ ] ✅ Errores de red manejados gracefully
- [ ] ✅ Estados de carga consistentes

---

## ⚠️ Riesgos y Mitigaciones

### Riesgo 1: WebSocket Inestable en Producción
**Probabilidad**: Media  
**Impacto**: Alto  
**Mitigación**:
- Implementar fallback a polling cada 5 segundos
- Retry con backoff exponencial
- Alertas a DevOps si conexión falla > 3 veces

### Riesgo 2: Latencia en Red
**Probabilidad**: Baja  
**Impacto**: Medio  
**Mitigación**:
- Caché agresivo de datos estáticos (organizaciones, catálogos)
- Optimistic updates en mutaciones
- Indicadores visuales de "guardando..."

### Riesgo 3: Incompatibilidad de Autenticación
**Probabilidad**: Media  
**Impacto**: Alto  
**Mitigación**:
- Validar formato JWT entre Next.js y Fastify
- Sincronizar secretos JWT
- Implementar refresh token si es necesario

### Riesgo 4: Pérdida de Funcionalidad Durante Migración
**Probabilidad**: Alta  
**Impacto**: Crítico  
**Mitigación**:
- Migración incremental (coexistencia de APIs)
- Feature flags para activar/desactivar backend nuevo
- Rollback plan documentado

---

## 📅 Timeline Estimado

| Fase | Duración | Días Acumulados |
|------|----------|-----------------|
| FASE 1: WebSocket Crítico | 2-3 días | 3 |
| FASE 2: API Client | 2 días | 5 |
| FASE 3: Funcionalidades | 3 días | 8 |
| FASE 4: Optimizaciones | 2 días | 10 |
| Testing y Ajustes | 2 días | 12 |

**Total Estimado**: 10-12 días hábiles

---

## 🎯 Métricas de Éxito

1. **WebSocket**:
   - Latencia promedio < 500ms
   - Tasa de reconexión exitosa > 95%
   - 0 renderizados de página completa al actualizar sensores

2. **API**:
   - Tiempo de respuesta promedio < 200ms
   - Tasa de error < 1%
   - Caché hit rate > 80% para datos estáticos

3. **UX**:
   - Lighthouse Performance Score > 85
   - First Contentful Paint < 1.5s
   - Time to Interactive < 3s

4. **Negocio**:
   - 100% de funcionalidades críticas migradas
   - 0 downtime durante migración
   - Diseño visual 100% preservado

---

## 📞 Soporte y Escalamiento

### Contactos Clave
- **Backend Owner**: [Definir responsable del backend Fastify]
- **Frontend Lead**: [Definir responsable de integración]
- **DevOps**: [Contacto para issues de infraestructura]

### Proceso de Escalamiento
1. Issue en GitHub con label `backend-integration`
2. Si crítico (WebSocket caído), notificar en Slack/Discord
3. Rollback plan: Revertir a commit pre-integración

---

## 🔗 Referencias

- [API Documentation del Backend](../Servicio/backend/API_DOCUMENTATION.md)
- [Schema Prisma del Backend](../Servicio/backend/prisma/schema.prisma)
- [Quick Start del Backend](../Servicio/backend/QUICKSTART.md)
- [WebSocket RFC del Proyecto](./BACKEND-INTEGRATION-REQUIREMENTS.md)
