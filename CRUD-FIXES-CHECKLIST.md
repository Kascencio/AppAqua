# 🚨 ARCHIVOS CON ERRORES CRUD - LISTA DE CORRECCIONES

## ❌ CRÍTICO - DEBE CORREGIRSE INMEDIATAMENTE

### 1. ESPECIES - CRUD ROTO
**Archivos afectados:**
- `app/especies/page.tsx` - ❌ Botones editar/eliminar no funcionan
- `hooks/use-species.ts` - ❌ Funciones updateSpecies/deleteSpecies no implementadas
- `components/species-table.tsx` - ❌ Handlers no conectados
- `components/edit-species-dialog.tsx` - ❌ Existe pero no se usa

### 2. USUARIOS - SEGURIDAD COMPROMETIDA  
**Archivos afectados:**
- `app/users/page.tsx` - ❌ Puede eliminar último admin
- `hooks/use-users.ts` - ❌ Sin validaciones de seguridad
- `components/delete-confirmation-dialog.tsx` - ❌ Muy genérico

## ⚠️ ALTO - DEBE CORREGIRSE PRONTO

### 3. INSTALACIONES - INTEGRIDAD DE DATOS
**Archivos afectados:**
- `app/instalaciones/page.tsx` - ⚠️ Eliminación sin validar dependencias
- `hooks/use-instalaciones.ts` - ⚠️ deleteInstalacion muy permisivo

### 4. PROCESOS - CONFLICTOS DE RECURSOS
**Archivos afectados:**
- `app/procesos/page.tsx` - ⚠️ Sin validar solapamiento
- `hooks/use-processes.ts` - ⚠️ createProcess sin validaciones
- `components/process-form.tsx` - ⚠️ Validaciones débiles

### 5. SENSORES - PÉRDIDA DE DATOS
**Archivos afectados:**
- `app/sensors/page.tsx` - ⚠️ Eliminación sin validar lecturas
- `hooks/use-sensors.ts` - ⚠️ deleteSensor muy permisivo

## 📊 MEDIO - MEJORAS RECOMENDADAS

### 6. SUCURSALES - VALIDACIONES MENORES
**Archivos afectados:**
- `app/sucursales/page.tsx` - 📊 Falta validar instalaciones asociadas
- `hooks/use-branches.ts` - 📊 Validaciones básicas

---

## 🔧 PLAN DE CORRECCIÓN POR PRIORIDAD

### FASE 1 - CRÍTICO (24-48 horas)
1. Arreglar ESPECIES completamente
2. Corregir seguridad USUARIOS

### FASE 2 - ALTO (3-5 días)  
3. Validaciones INSTALACIONES
4. Validaciones PROCESOS
5. Validaciones SENSORES

### FASE 3 - MEDIO (1-2 semanas)
6. Mejoras SUCURSALES
7. Optimizaciones generales
