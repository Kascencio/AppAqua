# ANÁLISIS DE IMPORTS DE TIPOS

## Archivos que importan de /types/

### 1. HOOKS QUE IMPORTAN TIPOS

#### hooks/use-alerts.ts
\`\`\`typescript
import type { AlertStatus } from "@/types"
\`\`\`

#### hooks/use-app-data.ts
\`\`\`typescript
// No importa tipos directamente
\`\`\`

#### hooks/use-branches.ts
\`\`\`typescript
import type { Branch } from "@/types/branch"
\`\`\`

#### hooks/use-facilities.ts
\`\`\`typescript
import type { Facility } from "@/types/facility"
\`\`\`

#### hooks/use-sensors.ts
\`\`\`typescript
// No importa tipos explícitamente, pero usa interfaces definidas internamente
\`\`\`

#### hooks/use-species.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### hooks/use-users.ts
\`\`\`typescript
import type { User } from "@/types/user"
\`\`\`

#### hooks/use-sucursales.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### hooks/use-instalaciones.ts
\`\`\`typescript
import type { Instalacion } from "@/types/instalacion"
\`\`\`

#### hooks/use-especies.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### hooks/use-processes.ts
\`\`\`typescript
// ARCHIVO NO EXISTE - referenciado pero faltante
\`\`\`

#### hooks/queries/use-sensors-query.ts
\`\`\`typescript
import type { Sensor } from "@/types/sensor"
\`\`\`

#### hooks/queries/use-branches-query.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### hooks/queries/use-processes-query.ts
\`\`\`typescript
import type { Proceso } from "@/types/proceso"
\`\`\`

### 2. COMPONENTES QUE IMPORTAN TIPOS

#### components/edit-species-dialog.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### components/add-species-dialog.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### components/edit-parameter-dialog.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### components/edit-sensor-dialog.tsx
\`\`\`typescript
import type { Branch } from "@/types/branch"
import type { Sensor } from "@/hooks/use-sensors"
\`\`\`

#### components/edit-facility-dialog.tsx
\`\`\`typescript
import type { Facility } from "@/types/facility"
import type { Branch } from "@/types/branch"
\`\`\`

#### components/edit-branch-dialog.tsx
\`\`\`typescript
import type { Branch } from "@/types/branch"
\`\`\`

#### components/add-branch-dialog.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### components/add-especie-dialog.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### components/add-instalacion-dialog.tsx
\`\`\`typescript
import type { Instalacion } from "@/types/instalacion"
\`\`\`

#### components/add-sensor-dialog.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### components/add-facility-dialog.tsx
\`\`\`typescript
import type { Facility } from "@/types/facility"
\`\`\`

#### components/delete-confirmation-dialog.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### components/facility-details.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### components/recent-alerts.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### components/page-header.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

### 3. PÁGINAS QUE IMPORTAN TIPOS

#### app/branches/page.tsx
\`\`\`typescript
import type { Branch } from "@/types/branch"
\`\`\`

#### app/notifications/page.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/users/page.tsx
\`\`\`typescript
import type { User } from "@/types/user"
import type { Branch } from "@/types/branch"
import type { Facility } from "@/types/facility"
\`\`\`

#### app/sensors/page.tsx
\`\`\`typescript
import type { Sensor } from "@/hooks/use-sensors"
\`\`\`

#### app/facilities/page.tsx
\`\`\`typescript
import type { Facility } from "@/types/facility"
\`\`\`

#### app/instalaciones/page.tsx
\`\`\`typescript
import type { Instalacion } from "@/types/instalacion"
\`\`\`

#### app/especies/page.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/procesos/page.tsx
\`\`\`typescript
import type { ProcesoDetallado, Proceso } from "@/types/proceso"
\`\`\`

#### app/procesos/[id]/page.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

### 4. API ROUTES QUE IMPORTAN TIPOS

#### app/api/facilities/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/api/sucursales/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/api/usuarios/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/api/instalaciones/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/api/instalaciones/[id]/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/api/procesos/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/api/procesos/[id]/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/api/especies/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/api/especies/[id]/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/api/sensores/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

#### app/api/sensores/[id]/route.ts
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

### 5. CONTEXTOS QUE IMPORTAN TIPOS

#### context/app-context.tsx
\`\`\`typescript
// No importa tipos explícitamente, pero define interfaces internas
\`\`\`

#### context/auth-context.tsx
\`\`\`typescript
// No importa tipos explícitamente
\`\`\`

### 6. ARCHIVOS DE TIPOS QUE SE IMPORTAN ENTRE SÍ

#### types/index.ts
\`\`\`typescript
// Exporta todos los tipos
\`\`\`

#### types/alert.ts
\`\`\`typescript
// No importa otros tipos
\`\`\`

#### types/branch.ts
\`\`\`typescript
// No importa otros tipos
\`\`\`

#### types/facility.ts
\`\`\`typescript
// No importa otros tipos
\`\`\`

#### types/user.ts
\`\`\`typescript
// No importa otros tipos
\`\`\`

#### types/sensor.ts
\`\`\`typescript
// No importa otros tipos
\`\`\`

#### types/instalacion.ts
\`\`\`typescript
// No importa otros tipos
\`\`\`

#### types/proceso.ts
\`\`\`typescript
// No importa otros tipos
\`\`\`

## RESUMEN DE IMPORTS PROBLEMÁTICOS

### TIPOS QUE NO EXISTEN EN LA NUEVA ESTRUCTURA:
1. `@/types/branch` - debería ser `@/types/empresa-sucursal`
2. `@/types/facility` - debería ser `@/types/instalacion`
3. `@/types/sensor` - debería ser `@/types/sensor-instalado` o `@/types/catalogo-sensor`
4. `@/types/user` - no existe en BD, es tipo legacy
5. `@/types/alert` - debería ser `@/types/alerta`

### TIPOS QUE EXISTEN PERO CON NOMBRES DIFERENTES:
1. `AlertStatus` - no existe, debería definirse
2. `Branch` - debería ser `EmpresaSucursal`
3. `Facility` - debería ser `Instalacion`
4. `Sensor` - debería ser `SensorInstalado` o `CatalogoSensor`

### ARCHIVOS QUE NECESITAN ACTUALIZACIÓN:
- hooks/use-alerts.ts
- hooks/use-branches.ts
- hooks/use-facilities.ts
- hooks/queries/use-sensors-query.ts
- hooks/queries/use-processes-query.ts
- components/edit-sensor-dialog.tsx
- components/edit-facility-dialog.tsx
- components/edit-branch-dialog.tsx
- components/add-instalacion-dialog.tsx
- components/add-facility-dialog.tsx
- app/branches/page.tsx
- app/users/page.tsx
- app/sensors/page.tsx
- app/facilities/page.tsx
- app/instalaciones/page.tsx
- app/procesos/page.tsx
