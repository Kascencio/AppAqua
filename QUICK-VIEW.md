# 📊 Vista Rápida - Integración Backend

## 🎯 Objetivo
Integrar backend Fastify (puerto 3300) con Next.js manteniendo diseño actual y optimizando WebSocket para sensores en tiempo real.

---

## 🚨 Problema Crítico Identificado

| Aspecto | Implementación Actual | Backend Real | Solución |
|---------|----------------------|--------------|----------|
| **WebSocket** | Suscripción dinámica con `ws.send({type:'subscribe'})` | Filtros en URL: `?instalacionId=5` | Rediseñar con WebSocketManager y conexiones por instalación |
| **Actualización** | Intent de actualizar solo cards | Recarga toda la página | Context Provider para distribuir eventos |
| **Conexiones** | 50 sensores = 50 WebSockets | Ineficiente | 50 sensores en 5 instalaciones = 5 WebSockets |

---

## 📋 Documentos Generados

| Archivo | Líneas | Contenido | Propósito |
|---------|--------|-----------|-----------|
| **INTEGRATION-SUMMARY.md** | 250 | Resumen ejecutivo con criterios de éxito | Vista rápida para stakeholders |
| **BACKEND-INTEGRATION-PLAN.md** | 400+ | Análisis técnico completo, diferencias, timeline | Referencia técnica detallada |
| **BACKEND-MISSING-FEATURES.md** | 300+ | 8 categorías de funcionalidades faltantes con endpoints propuestos | Backlog para equipo de backend |
| **IMPLEMENTATION-ROADMAP.md** | 500+ | Roadmap día a día con código de ejemplo | Guía de implementación práctica |
| **TODO List** | 20 tareas | Lista ejecutable priorizada | Tracking de progreso |

---

## 📅 Timeline Visual

```
┌─────────────────────────────────────────────────────────────┐
│ SEMANA 1: WebSocket y APIs Críticas                         │
├─────────────────────────────────────────────────────────────┤
│ Día 1-2  │ 🔴 WebSocket Manager + Hook                      │
│ Día 3    │ 🔴 Componentes de Sensores                       │
│ Día 4-5  │ 🟠 API Client + Migración de Hooks               │
├─────────────────────────────────────────────────────────────┤
│ SEMANA 2: CRUD y Funcionalidades                            │
├─────────────────────────────────────────────────────────────┤
│ Día 6-7  │ 🟠 CRUD Organizaciones                           │
│ Día 8    │ 🟠 Actualizar Sucursales                         │
│ Día 9-10 │ 🟡 Promedios, Alertas, Reportes                  │
├─────────────────────────────────────────────────────────────┤
│ SEMANA 3: Optimizaciones y Testing                          │
├─────────────────────────────────────────────────────────────┤
│ Día 11-12│ 🟢 React Query + Caché                           │
│ Día 13   │ 🟢 UX Improvements                               │
│ Día 14-15│ 🟢 Testing y Ajustes                             │
└─────────────────────────────────────────────────────────────┘

Total: 10-15 días hábiles
```

---

## 🎯 TODO List Priorizado

### 🔴 CRÍTICO (4 tareas) - Completar Semana 1
| # | Tarea | Archivo | Tiempo | Impacto |
|---|-------|---------|--------|---------|
| 1 | WebSocket Manager | `/lib/websocket-manager.ts` | 6h | ⭐⭐⭐ |
| 2 | Actualizar useWebSocket | `/hooks/use-websocket.ts` | 4h | ⭐⭐⭐ |
| 3 | Actualizar sensor-monitoring-card | `/components/sensor-monitoring-card.tsx` | 3h | ⭐⭐⭐ |
| 4 | Optimizar sensors/page | `/app/sensors/page.tsx` | 4h | ⭐⭐⭐ |

### 🟠 ALTO (6 tareas) - Completar Semana 1-2
| # | Tarea | Archivo | Tiempo | Impacto |
|---|-------|---------|--------|---------|
| 5 | API Client | `/lib/backend-client.ts` | 6h | ⭐⭐⭐ |
| 6 | Hook Organizaciones | `/hooks/use-organizaciones.ts` | 2h | ⭐⭐ |
| 7 | Migrar use-sensors | `/hooks/use-sensors.ts` | 3h | ⭐⭐⭐ |
| 8 | Migrar use-species | `/hooks/use-species.ts` | 2h | ⭐⭐ |
| 9 | CRUD Organizaciones | `/app/organizaciones/` | 6h | ⭐⭐ |
| 10 | Actualizar Sucursales | `/app/sucursales/` | 4h | ⭐⭐ |

### 🟡 MEDIO (5 tareas) - Completar Semana 2
| # | Tarea | Archivo | Tiempo | Impacto |
|---|-------|---------|--------|---------|
| 11 | Hooks Promedios | `/hooks/use-promedios.ts` | 3h | ⭐⭐ |
| 12 | Componente Promedios | `/components/promedios-chart.tsx` | 4h | ⭐⭐ |
| 13 | Asignación Usuarios | `/app/api/asignacion-usuario/` | 4h | ⭐⭐ |
| 14 | Página Alertas | `/app/alertas/page.tsx` | 4h | ⭐ |
| 15 | Página Reportes | `/app/reportes/page.tsx` | 3h | ⭐ |

### 🟢 BAJO (5 tareas) - Completar Semana 3
| # | Tarea | Archivo | Tiempo | Impacto |
|---|-------|---------|--------|---------|
| 16 | React Query | `/lib/query-client.ts` | 4h | ⭐⭐ |
| 17 | Skeleton Loaders | `/components/skeletons/` | 3h | ⭐ |
| 18 | Error Boundaries | `/components/error-boundary.tsx` | 2h | ⭐ |
| 19 | Tests WebSocket | `/tests/` | 6h | ⭐⭐ |
| 20 | Variables Entorno | `.env` | 1h | ⭐ |

---

## 🔄 Diferencias Modelo de Datos

| Concepto | App Actual | Backend Nuevo | Acción Requerida |
|----------|-----------|---------------|-------------------|
| Empresas | `empresa` | `organizacion` | Crear nuevo módulo |
| Sucursales | `empresa_sucursal` | `organizacion_sucursal` | Actualizar foreign keys |
| Catálogo Sensores | `/api/sensores` | `/api/catalogo-sensores` | Cambiar endpoint |
| Sensores Instalados | `/api/sensors` | `/api/sensores-instalados` | Cambiar endpoint |
| Especies | `/api/especies` | `/api/catalogo-especies` | Cambiar endpoint |
| WebSocket | `{type:'subscribe'}` | `?instalacionId=X` | Rediseño completo |
| Eventos WS | `reading_update` | `lectura.created` | Adaptar parsing |

---

## 🚨 Funcionalidades Faltantes en Backend

| Funcionalidad | Prioridad | Estado Backend | Solución Propuesta |
|---------------|-----------|----------------|---------------------|
| Asignación Usuarios a Sucursales | 🔴 ALTA | ❌ No implementado | Next.js API Routes (temporal) |
| WebSocket de Alertas | 🟠 MEDIA | ❌ No implementado | Pedir a equipo backend |
| Reportes PDF/Excel | 🟡 MEDIA | ⚠️ Solo XML | Pedir a equipo backend |
| Dashboard Analytics | 🟡 MEDIA | ❌ No implementado | Pedir a equipo backend |
| Validación Procesos | 🔴 ALTA | ❌ No implementado | Next.js API Routes (temporal) |
| Password Recovery | 🟠 MEDIA | ⚠️ Tabla existe, sin endpoints | Pedir a equipo backend |
| Paginación y Filtros | 🔴 ALTA | ❌ No implementado | Pedir a equipo backend |
| Audit Log | 🟢 BAJA | ❌ No implementado | Futuro |

---

## ✅ Criterios de Éxito

| Categoría | Métrica | Target | Cómo Medir |
|-----------|---------|--------|------------|
| **WebSocket** | Latencia actualización | < 500ms | Chrome DevTools Network |
| **WebSocket** | Rerenders innecesarios | 0 | React DevTools Profiler |
| **WebSocket** | Tasa reconexión | > 95% | Logs de consola |
| **WebSocket** | Conexiones simultáneas | Instalaciones / 2 | WebSocket panel |
| **API** | Tiempo respuesta | < 200ms | Chrome DevTools Network |
| **API** | Tasa de error | < 1% | Monitoring logs |
| **UX** | Lighthouse Performance | > 85 | Lighthouse audit |
| **UX** | First Contentful Paint | < 1.5s | Lighthouse audit |
| **UX** | Time to Interactive | < 3s | Lighthouse audit |
| **Visual** | Diseño preservado | 100% | Revisión manual |

---

## 📝 Configuración Requerida

### Variables de Entorno (.env)
```env
# ✅ ACTUALIZADO - Revisar archivo .env en el proyecto

# Backend Externo (Fastify) - Puerto 3300
NEXT_PUBLIC_EXTERNAL_API_URL="https://195.35.11.179:3300"
NEXT_PUBLIC_WS_URL="wss://195.35.11.179:3300/ws/lecturas"

# Base de Datos (mantener)
DATABASE_URL="mysql://root:Mvergel*@195.35.11.179:3306/u889902058_sonda0109"

# Auth (mantener)
NEXTAUTH_SECRET="P/ULq4ccdehxSB+G0xJNQGViIY9B8+pvel1DDu8wjx75Xnq7SQMDwmv8l8M="
JWT_SECRET="4sPaIl6kO5sFSElo+MpY6nITSu2Yeux1AStpEOyxjq4dxWuRdONuY3Mk01/0KRD4"
```

### Verificar Backend
```bash
# Health check
curl https://195.35.11.179:3300/health
# Esperado: {"status":"ok","timestamp":"..."}

# Listar organizaciones
curl https://195.35.11.179:3300/api/organizaciones
# Esperado: [{...}]

# Test WebSocket (desde navegador console)
const ws = new WebSocket('wss://195.35.11.179:3300/ws/lecturas?instalacionId=1')
ws.onmessage = (e) => console.log(JSON.parse(e.data))
```

---

## 🎯 Próximos Pasos Inmediatos

### HOY
1. ✅ Revisar los 5 documentos generados
2. ✅ Validar configuración de .env
3. ✅ Probar health check del backend
4. ⏳ Crear branch de desarrollo: `git checkout -b feature/backend-integration`

### MAÑANA
1. ⏳ Empezar **Tarea 1**: WebSocket Manager
2. ⏳ Documentar decisiones técnicas
3. ⏳ Commit frecuente con mensajes claros

### ESTA SEMANA
1. ⏳ Completar 4 tareas CRÍTICAS
2. ⏳ Testing manual intensivo de WebSocket
3. ⏳ Demo interna de sensores en tiempo real

---

## 📊 Progreso Actual

```
████████████████████████████████████░░░░░░░░ 80% - Análisis Completo
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0% - Implementación

Fase Actual: PLANIFICACIÓN COMPLETA ✅
Siguiente Fase: IMPLEMENTACIÓN CRÍTICA 🔄
```

### Archivos Generados
- ✅ INTEGRATION-SUMMARY.md (250 líneas)
- ✅ BACKEND-INTEGRATION-PLAN.md (400+ líneas)
- ✅ BACKEND-MISSING-FEATURES.md (300+ líneas)
- ✅ IMPLEMENTATION-ROADMAP.md (500+ líneas)
- ✅ QUICK-VIEW.md (este archivo)
- ✅ TODO List (20 tareas en sistema)
- ✅ Variables de entorno actualizadas

### Listo para Comenzar
- ✅ Análisis técnico completo
- ✅ Diferencias identificadas
- ✅ Soluciones propuestas
- ✅ Timeline definido
- ✅ Criterios de éxito claros
- ⏳ Pendiente: Empezar implementación

---

## 📞 Soporte

**Dudas Técnicas**: Revisar BACKEND-INTEGRATION-PLAN.md (sección detallada)  
**Implementación**: Seguir IMPLEMENTATION-ROADMAP.md (paso a paso)  
**Funcionalidades Faltantes**: Ver BACKEND-MISSING-FEATURES.md  
**Vista General**: Este archivo (QUICK-VIEW.md)

---

## 🎓 Lecciones Clave

1. **WebSocket Real ≠ WebSocket Mock**: El backend usa conexiones con filtros en URL, no mensajes de suscripción.

2. **Optimización**: Una conexión por instalación (no por sensor) reduce 90% de conexiones.

3. **Modelo de Datos**: `organizacion` es el concepto correcto en el negocio de acuicultura.

4. **Eventos Backend**: `{type: 'lectura.created', data: {...}}` con estructura específica.

5. **Migración Incremental**: Implementar funcionalidades faltantes temporalmente en Next.js para no bloquear desarrollo.

6. **Performance**: Context Provider + React.memo para evitar rerenders innecesarios.

7. **Testing**: Validar cada fase antes de avanzar, especialmente WebSocket.

---

**Última Actualización**: 16 de diciembre de 2025  
**Estado**: ✅ Planificación Completa - Listo para Implementación  
**Próximo Milestone**: Semana 1 - WebSocket y APIs Críticas

