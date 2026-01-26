# 📊 Análisis de Compatibilidad Frontend-Backend

## Resumen de Problemas Encontrados y Corregidos

### 🔴 Problema 1: Formato de Fechas DateTime
**Error:** `Invalid value for argument 'fecha_instalacion': premature end of input. Expected ISO-8601 DateTime`

**Causa:** Prisma con `@db.Date` espera objetos `Date` válidos. Las cadenas `YYYY-MM-DD` enviadas desde inputs HTML no se parsean correctamente debido a problemas de timezone.

**Solución:** Creado `/lib/date-utils.ts` con función `parseDateForPrisma()` que convierte "2026-01-08" → "2026-01-08T00:00:00.000Z" (UTC). En backend se agregó `date.utils.ts` con utilidades equivalentes.

**Archivos corregidos:**
- [app/api/instalaciones/route.ts](app/api/instalaciones/route.ts)
- [app/api/instalaciones/[id]/route.ts](app/api/instalaciones/[id]/route.ts)
- [app/api/procesos/route.ts](app/api/procesos/route.ts)
- [app/api/procesos/[id]/route.ts](app/api/procesos/[id]/route.ts)
- [app/api/sensores-instalados/route.ts](app/api/sensores-instalados/route.ts)
- [app/api/facilities/route.ts](app/api/facilities/route.ts)
- [app/api/lecturas/route.ts](app/api/lecturas/route.ts)
- [app/api/lecturas-por-proceso/route.ts](app/api/lecturas-por-proceso/route.ts)
- [app/api/lecturas/proceso/route.ts](app/api/lecturas/proceso/route.ts)

---

### 🔴 Problema 2: Campo `id_empresa_sucursal` vs `id_organizacion_sucursal`
**Error:** `Unknown argument 'id_empresa_sucursal'`

**Causa:** El frontend usa `id_empresa_sucursal` pero el schema Prisma define `id_organizacion_sucursal`.

**Solución:** Las rutas API ahora aceptan ambos campos y normalizan al nombre correcto del schema. En backend se agregó `normalize.utils.ts` para aplicar la misma regla.

**Archivos corregidos:**
- [app/api/instalaciones/route.ts](app/api/instalaciones/route.ts)
- [app/api/instalaciones/[id]/route.ts](app/api/instalaciones/[id]/route.ts)
- [app/api/facilities/route.ts](app/api/facilities/route.ts)

---

### 🔴 Problema 3: Offset de IDs (Sucursales vs Organizaciones)
**Causa:** El frontend usa un offset de +10000 para diferenciar sucursales de organizaciones.

**Solución:** Función `normalizeOrganizacionSucursalId()` que resta 10000 cuando `id >= 10000`.

**Archivos corregidos:**
- [app/api/instalaciones/route.ts](app/api/instalaciones/route.ts)
- [app/api/instalaciones/[id]/route.ts](app/api/instalaciones/[id]/route.ts)
- [app/api/facilities/route.ts](app/api/facilities/route.ts)

---

### 🔴 Problema 4: PATCH pasando body directo a Prisma
**Error:** Campos no válidos pasados directamente a Prisma.update()

**Causa:** En `procesos/[id]/route.ts` el body se pasaba directo sin sanitizar.

**Solución:** Función `buildProcesoUpdateData()` que solo incluye campos válidos.

**Archivo corregido:**
- [app/api/procesos/[id]/route.ts](app/api/procesos/[id]/route.ts)

---

## 📝 Mapeo de Campos Frontend → Backend (Prisma)

| Frontend | Backend (Prisma) | Notas |
|----------|-----------------|-------|
| `id_empresa_sucursal` | `id_organizacion_sucursal` | Nombre legacy, normalizar |
| `fecha_instalacion: "YYYY-MM-DD"` | `fecha_instalacion: DateTime` | Usar `parseDateForPrisma()` |
| `fecha_inicio: "YYYY-MM-DD"` | `fecha_inicio: DateTime` | Usar `parseDateForPrisma()` |
| `fecha_final: "YYYY-MM-DD"` | `fecha_final: DateTime` | Usar `parseDateForPrisma()` |
| `fecha_instalada: "YYYY-MM-DD"` | `fecha_instalada: DateTime` | Usar `parseDateForPrisma()` |
| `fecha: "YYYY-MM-DD"` | `fecha: DateTime` | Para lecturas |
| `hora: "HH:MM:SS"` | `hora: DateTime` | Convertir a `1970-01-01T{hora}` |

---

## 🔧 Utilidad Creada: `/lib/date-utils.ts`

```typescript
// Uso en API routes:
import { parseDateForPrisma } from "@/lib/date-utils"

// Ejemplos:
parseDateForPrisma("2026-01-08")           // → Date("2026-01-08T00:00:00.000Z")
parseDateForPrisma("2026-01-08T15:30:00")  // → Date("2026-01-08T15:30:00.000Z")
parseDateForPrisma(new Date())             // → Date (sin cambios)
parseDateForPrisma(null)                   // → undefined
```

---

## ⚠️ Campos Opcionales vs Requeridos en Schema

### instalacion
| Campo | Tipo | Requerido |
|-------|------|-----------|
| `nombre_instalacion` | String | ✅ Sí |
| `fecha_instalacion` | DateTime | ✅ Sí |
| `estado_operativo` | Enum (activo/inactivo) | ✅ Sí |
| `descripcion` | String | ✅ Sí |
| `tipo_uso` | Enum (acuicultura/tratamiento/otros) | ✅ Sí |
| `id_organizacion_sucursal` | Int (FK) | ✅ Sí |
| `id_proceso` | Int (FK) | ❌ No (nullable) |

### procesos
| Campo | Tipo | Requerido |
|-------|------|-----------|
| `id_especie` | Int (FK) | ✅ Sí |
| `fecha_inicio` | DateTime | ✅ Sí |
| `fecha_final` | DateTime | ✅ Sí |

### sensor_instalado
| Campo | Tipo | Requerido |
|-------|------|-----------|
| `id_sensor` | Int (FK) | ✅ Sí |
| `id_instalacion` | Int (FK) | ✅ Sí |
| `fecha_instalada` | DateTime | ✅ Sí |
| `descripcion` | String | ✅ Sí |
| `id_lectura` | Int (FK) | ❌ No (nullable) |

---

## ✅ Validaciones de Negocio Implementadas

1. **Procesos - Fechas:**
   - `fecha_final` debe ser posterior a `fecha_inicio`
   - Validación de solapamiento en la misma instalación

2. **Sensores Instalados:**
   - No permitir sensor duplicado en la misma instalación (409 Conflict)

3. **Especies:**
   - No permitir nombres duplicados (409 Conflict)

---

## ✅ Actualizaciones de Validación en Backend

Según los cambios ya aplicados en backend:

- `date.utils.ts`: parseo de fechas `YYYY-MM-DD` a `Date` compatible con Prisma.
- `normalize.utils.ts`: normalización del offset +10000 para `id_organizacion_sucursal`/`id_empresa_sucursal`.
- `validators.ts`:
  - acepta `id_empresa_sucursal` como alias y lo convierte a `id_organizacion_sucursal`.
  - convierte strings de fecha a `Date`.
  - valida `fecha_final > fecha_inicio` en procesos.
- Aplicado en:
  - `instalacion.controller.ts` (instalaciones, sensores instalados, catálogo sensores)
  - `organizacion.controller.ts` (sucursales)
  - `especies.controller.ts` (procesos)

---

## 🚀 Próximos Pasos Recomendados

1. **Revisar diálogos de formularios** para asegurar que envían las fechas en formato `YYYY-MM-DD`
2. **Actualizar componentes** para usar `id_organizacion_sucursal` en lugar de `id_empresa_sucursal`
3. **Agregar validación frontend** de formato de fechas antes de enviar al backend
4. **Considerar migración** de nombres de campos en tipos TypeScript del frontend

---

*Generado automáticamente - 24 de enero de 2026*# 📊 Análisis de Compatibilidad Frontend-Backend

## Resumen de Problemas Encontrados y Corregidos

### 🔴 Problema 1: Formato de Fechas DateTime
**Error:** `Invalid value for argument 'fecha_instalacion': premature end of input. Expected ISO-8601 DateTime`

**Causa:** Prisma con `@db.Date` espera objetos `Date` válidos. Las cadenas `YYYY-MM-DD` enviadas desde inputs HTML no se parsean correctamente debido a problemas de timezone.

**Solución:** Creado `/lib/date-utils.ts` con función `parseDateForPrisma()` que convierte `"2026-01-08"` → `"2026-01-08T00:00:00.000Z"` (UTC).

**Archivos corregidos:**
- [app/api/instalaciones/route.ts](app/api/instalaciones/route.ts)
- [app/api/instalaciones/[id]/route.ts](app/api/instalaciones/[id]/route.ts)
- [app/api/procesos/route.ts](app/api/procesos/route.ts)
- [app/api/procesos/[id]/route.ts](app/api/procesos/[id]/route.ts)
- [app/api/sensores-instalados/route.ts](app/api/sensores-instalados/route.ts)
- [app/api/facilities/route.ts](app/api/facilities/route.ts)
- [app/api/lecturas/route.ts](app/api/lecturas/route.ts)
- [app/api/lecturas-por-proceso/route.ts](app/api/lecturas-por-proceso/route.ts)
- [app/api/lecturas/proceso/route.ts](app/api/lecturas/proceso/route.ts)

---

### 🔴 Problema 2: Campo `id_empresa_sucursal` vs `id_organizacion_sucursal`
**Error:** `Unknown argument 'id_empresa_sucursal'`

**Causa:** El frontend usa `id_empresa_sucursal` pero el schema Prisma define `id_organizacion_sucursal`.

**Solución:** Las rutas API ahora aceptan ambos campos y normalizan al nombre correcto del schema.

**Archivos corregidos:**
- [app/api/instalaciones/route.ts](app/api/instalaciones/route.ts)
- [app/api/instalaciones/[id]/route.ts](app/api/instalaciones/[id]/route.ts)
- [app/api/facilities/route.ts](app/api/facilities/route.ts)

---

### 🔴 Problema 3: Offset de IDs (Sucursales vs Organizaciones)
**Causa:** El frontend usa un offset de +10000 para diferenciar sucursales de organizaciones.

**Solución:** Función `normalizeOrganizacionSucursalId()` que resta 10000 cuando `id >= 10000`.

**Archivos corregidos:**
- [app/api/instalaciones/route.ts](app/api/instalaciones/route.ts)
- [app/api/instalaciones/[id]/route.ts](app/api/instalaciones/[id]/route.ts)
- [app/api/facilities/route.ts](app/api/facilities/route.ts)

---

### 🔴 Problema 4: PATCH pasando body directo a Prisma
**Error:** Campos no válidos pasados directamente a Prisma.update()

**Causa:** En `procesos/[id]/route.ts` el body se pasaba directo sin sanitizar.

**Solución:** Función `buildProcesoUpdateData()` que solo incluye campos válidos.

**Archivo corregido:**
- [app/api/procesos/[id]/route.ts](app/api/procesos/[id]/route.ts)

---

## 📝 Mapeo de Campos Frontend → Backend (Prisma)

| Frontend | Backend (Prisma) | Notas |
|----------|-----------------|-------|
| `id_empresa_sucursal` | `id_organizacion_sucursal` | Nombre legacy, normalizar |
| `fecha_instalacion: "YYYY-MM-DD"` | `fecha_instalacion: DateTime` | Usar `parseDateForPrisma()` |
| `fecha_inicio: "YYYY-MM-DD"` | `fecha_inicio: DateTime` | Usar `parseDateForPrisma()` |
| `fecha_final: "YYYY-MM-DD"` | `fecha_final: DateTime` | Usar `parseDateForPrisma()` |
| `fecha_instalada: "YYYY-MM-DD"` | `fecha_instalada: DateTime` | Usar `parseDateForPrisma()` |
| `fecha: "YYYY-MM-DD"` | `fecha: DateTime` | Para lecturas |
| `hora: "HH:MM:SS"` | `hora: DateTime` | Convertir a `1970-01-01T{hora}` |

---

## 🔧 Utilidad Creada: `/lib/date-utils.ts`

```typescript
// Uso en API routes:
import { parseDateForPrisma } from "@/lib/date-utils"

// Ejemplos:
parseDateForPrisma("2026-01-08")           // → Date("2026-01-08T00:00:00.000Z")
parseDateForPrisma("2026-01-08T15:30:00")  // → Date("2026-01-08T15:30:00.000Z")
parseDateForPrisma(new Date())             // → Date (sin cambios)
parseDateForPrisma(null)                   // → undefined
```

---

## ⚠️ Campos Opcionales vs Requeridos en Schema

### instalacion
| Campo | Tipo | Requerido |
|-------|------|-----------|
| `nombre_instalacion` | String | ✅ Sí |
| `fecha_instalacion` | DateTime | ✅ Sí |
| `estado_operativo` | Enum (activo/inactivo) | ✅ Sí |
| `descripcion` | String | ✅ Sí |
| `tipo_uso` | Enum (acuicultura/tratamiento/otros) | ✅ Sí |
| `id_organizacion_sucursal` | Int (FK) | ✅ Sí |
| `id_proceso` | Int (FK) | ❌ No (nullable) |

### procesos
| Campo | Tipo | Requerido |
|-------|------|-----------|
| `id_especie` | Int (FK) | ✅ Sí |
| `fecha_inicio` | DateTime | ✅ Sí |
| `fecha_final` | DateTime | ✅ Sí |

### sensor_instalado
| Campo | Tipo | Requerido |
|-------|------|-----------|
| `id_sensor` | Int (FK) | ✅ Sí |
| `id_instalacion` | Int (FK) | ✅ Sí |
| `fecha_instalada` | DateTime | ✅ Sí |
| `descripcion` | String | ✅ Sí |
| `id_lectura` | Int (FK) | ❌ No (nullable) |

---

## ✅ Validaciones de Negocio Implementadas

1. **Procesos - Fechas:**
   - `fecha_final` debe ser posterior a `fecha_inicio`
   - Validación de solapamiento en la misma instalación

2. **Sensores Instalados:**
   - No permitir sensor duplicado en la misma instalación (409 Conflict)

3. **Especies:**
   - No permitir nombres duplicados (409 Conflict)

---

## 🚀 Próximos Pasos Recomendados

1. **Revisar diálogos de formularios** para asegurar que envían las fechas en formato `YYYY-MM-DD`
2. **Actualizar componentes** para usar `id_organizacion_sucursal` en lugar de `id_empresa_sucursal`
3. **Agregar validación frontend** de formato de fechas antes de enviar al backend
4. **Considerar migración** de nombres de campos en tipos TypeScript del frontend

---

*Generado automáticamente - $(date)*
