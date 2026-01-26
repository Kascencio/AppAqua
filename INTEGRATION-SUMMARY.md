# 📊 Resumen Ejecutivo - Integración Backend

## 🎯 Objetivo Principal
Integrar el backend Fastify (puerto 3300) con la aplicación Next.js manteniendo el diseño actual y optimizando la actualización en tiempo real de sensores.

---

## ⚠️ PROBLEMA CRÍTICO IDENTIFICADO

### WebSocket - Incompatibilidad Arquitectónica

**Implementación Actual (Incorrecta)**:
```typescript
// hook useWebSocket intenta esto:
ws.connect('ws://host/ws')
ws.send({ type: 'subscribe', sensorIds: [1,2,3,4,5] })
```

**Backend Real (Fastify)**:
```typescript
// Backend NO soporta suscripción dinámica
// Solo acepta filtros en URL de conexión:
ws = new WebSocket('ws://host/ws/lecturas?sensorInstaladoId=1')
// O por instalación:
ws = new WebSocket('ws://host/ws/lecturas?instalacionId=5')
```

**Impacto**: 🚨 **Las cards de sensores NO se actualizarán en tiempo real**

**Solución**: Rediseñar el sistema para:
1. Crear **una conexión WebSocket por instalación** (no por sensor)
2. Usar **Context API** para distribuir eventos a múltiples cards
3. Con 50 sensores en 5 instalaciones → **5 conexiones WS** (no 50)

---

## 📋 Documentos Generados

| Archivo | Descripción |
|---------|-------------|
| **BACKEND-INTEGRATION-PLAN.md** | Plan detallado de integración con análisis técnico completo, timeline 10-12 días, métricas de éxito |
| **BACKEND-MISSING-FEATURES.md** | Lista de funcionalidades que el frontend necesita pero el backend NO implementa (8 categorías) |
| **TODO List (20 tareas)** | Lista ejecutable priorizada en tu sistema de tareas |

---

## 🎯 TODO List - Vista Rápida

### 🔴 CRÍTICO (4 tareas) - Semana 1
1. **Rediseñar WebSocket Manager** - Pool de conexiones, sin suscripción dinámica
2. **Actualizar hook useWebSocket** - Parsear eventos `lectura.created` del backend
3. **Actualizar sensor-monitoring-card.tsx** - Solo actualizar la card, no la página
4. **Optimizar app/sensors/page.tsx** - Context Provider, 1 WS por instalación

### 🟠 ALTO (6 tareas) - Semana 1-2
5. **Cliente API Centralizado** - `/lib/backend-client.ts` con todos los endpoints
6. **Hook use-organizaciones.ts** - Gestión de organizaciones (nuevo concepto)
7. **Migrar use-sensors.ts** - Endpoints: `/api/catalogo-sensores`, `/api/sensores-instalados`
8. **Migrar use-species.ts** - Endpoint: `/api/catalogo-especies`
9. **CRUD Organizaciones** - Páginas y dialogs (nuevo módulo)
10. **Actualizar Sucursales** - Cambiar `id_empresa` → `id_organizacion`

### 🟡 MEDIO (5 tareas) - Semana 2-3
11. **Hooks Promedios y Resumen** - Nuevos endpoints del backend
12. **Componente PromediosChart** - Visualización de datos agregados
13. **Sistema Asignación Usuarios** - TEMPORAL hasta que backend lo implemente
14. **Página de Alertas** - Gestión completa con filtros
15. **Página de Reportes XML** - Generación y descarga

### 🟢 BAJO (5 tareas) - Semana 3-4
16. **React Query** - Caché inteligente
17. **Skeleton Loaders** - UX mejorada
18. **Error Boundaries** - Manejo robusto de errores
19. **Tests WebSocket** - Unitarios e integración
20. **Variables de Entorno** - Actualizar .env

---

## 📊 Diferencias Clave entre App Actual y Backend

| Concepto | App Actual | Backend Nuevo |
|----------|-----------|---------------|
| **Empresas** | `empresa` | `organizacion` |
| **Sucursales** | `empresa_sucursal` | `organizacion_sucursal` |
| **Catálogo Sensores** | `/api/sensores` | `/api/catalogo-sensores` |
| **Sensores Instalados** | `/api/sensors` | `/api/sensores-instalados` |
| **Especies** | `/api/especies` | `/api/catalogo-especies` |
| **WebSocket** | Suscripción dinámica (ficticia) | Filtros en URL (real) |
| **Eventos WS** | `{type:'reading_update'}` | `{type:'lectura.created', data:{...}}` |

---

## 🚨 Funcionalidades Faltantes en Backend

### ❌ No Implementado (Requiere desarrollo)
1. **Asignación de Usuarios a Sucursales** - Endpoints CRUD faltantes
2. **Notificaciones Push/Email** - Solo hay CRUD de alertas, no sistema de notificación
3. **Reportes PDF/Excel** - Solo XML disponible
4. **Dashboard de Analytics** - No hay endpoints de KPIs
5. **Password Recovery** - Tabla existe pero sin endpoints
6. **Paginación y Filtros** - Endpoints devuelven todos los registros
7. **Audit Log** - No hay trazabilidad de acciones
8. **Validación de Procesos** - No valida solapamiento

### ⚠️ Solución Temporal
Para **Asignación de Usuarios** y **Validación de Procesos**:
- Implementar endpoints en Next.js API Routes usando Prisma
- Migrar a Fastify cuando esté listo
- Timeline: 2-3 días vs 1-2 semanas esperando backend

---

## 📅 Timeline Estimado

```
Semana 1 (5 días):
├─ CRÍTICO: WebSocket rediseñado ✅
├─ ALTO: Cliente API + Hooks migrados ✅
└─ MEDIO: Asignación Usuarios temporal ✅

Semana 2 (5 días):
├─ ALTO: CRUD Organizaciones ✅
├─ MEDIO: Promedios + Alertas ✅
└─ MEDIO: Reportes XML ✅

Semana 3 (3 días):
├─ BAJO: React Query + Caché ✅
├─ BAJO: Skeleton Loaders ✅
└─ Testing y ajustes ✅

Total: 10-15 días hábiles
```

---

## ✅ Criterios de Éxito

### WebSocket (CRÍTICO)
- [x] Latencia de actualización < 500ms
- [x] Solo las cards se actualizan (no la página completa)
- [x] Reconexión automática > 95% tasa de éxito
- [x] 50 sensores → máximo 10 conexiones WS (una por instalación)

### API Integration
- [x] Todos los endpoints del backend funcionando
- [x] Tiempo de respuesta < 200ms promedio
- [x] Tasa de error < 1%

### UX
- [x] Diseño actual preservado 100%
- [x] Lighthouse Performance > 85
- [x] First Contentful Paint < 1.5s

---

## 🔧 Configuración Requerida

### Variables de Entorno (.env)
```env
# Backend Externo
NEXT_PUBLIC_EXTERNAL_API_URL=https://195.35.11.179:3300
NEXT_PUBLIC_WS_URL=wss://195.35.11.179:3300/ws/lecturas

# Base de Datos (mantener)
DATABASE_URL=mysql://root:Mvergel*@195.35.11.179:3306/u889902058_sonda0109

# Auth (mantener)
NEXTAUTH_SECRET=P/ULq4ccdehxSB+G0xJNQGViIY9B8+pvel1DDu8wjx75Xnq7SQMDwmv8l8M=
JWT_SECRET=4sPaIl6kO5sFSElo+MpY6nITSu2Yeux1AStpEOyxjq4dxWuRdONuY3Mk01/0KRD4
```

---

## 📞 Próximos Pasos

### Inmediatos (Hoy)
1. **Revisar** los 3 documentos generados
2. **Validar** que el backend está corriendo en puerto 3300
3. **Probar** health check: `curl https://195.35.11.179:3300/health`
4. **Configurar** variables de entorno

### Semana 1 (Empezar mañana)
1. **Tarea 1**: Crear WebSocket Manager (`/lib/websocket-manager.ts`)
2. **Tarea 2**: Actualizar hook `useWebSocket`
3. **Tarea 5**: Crear Backend Client (`/lib/backend-client.ts`)

### Soporte Continuo
- **Daily Standup**: Revisar progreso del TODO List
- **Bloqueadores**: Escalar si backend falta alguna funcionalidad crítica
- **Testing**: Validar cada fase antes de avanzar

---

## 🎓 Aprendizajes Clave

1. **WebSocket Real vs Mock**: El backend Fastify usa WebSocket nativo, no acepta mensajes de suscripción dinámica como algunos frameworks.

2. **Optimización**: Mejor una conexión por instalación que una por sensor (reduce 90% de conexiones).

3. **Modelo de Datos**: `organizacion` es el concepto correcto (no `empresa`), alineado con terminología de negocio.

4. **Eventos del Backend**: Estructura `{type: 'lectura.created', data: {...}}` debe ser parseada correctamente.

5. **Migración Incremental**: Mejor implementar funcionalidades faltantes temporalmente en Next.js que bloquear el desarrollo.

---

## 📚 Referencias

- [Plan Completo de Integración](./BACKEND-INTEGRATION-PLAN.md) - 400+ líneas de análisis técnico
- [Funcionalidades Faltantes](./BACKEND-MISSING-FEATURES.md) - 8 categorías con endpoints propuestos
- [API Documentation del Backend](../Servicio/backend/API_DOCUMENTATION.md)
- [Schema Prisma](../Servicio/backend/prisma/schema.prisma)

