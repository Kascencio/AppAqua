# Frontend - Documentacion Operativa Ampliada

## 1) Objetivo del proyecto
Frontend de gestion y monitoreo acuicola sobre `Next.js` (App Router), con:
- autenticacion y sesion por JWT,
- CRUD de entidades operativas,
- analitica historica,
- lecturas y notificaciones en tiempo real por WebSocket.

Este documento concentra lo necesario para desarrollo, soporte y despliegue.

## 2) Alcance funcional actual
- Login, logout, recuperacion de password.
- Gestion de usuarios y roles (con control por permisos).
- Gestion de organizaciones, sucursales e instalaciones.
- Gestion de catalogo de especies, parametros, procesos y sensores.
- Dashboard, mapa, analitica y monitoreo.
- Integracion de alertas y notificaciones.

## 3) Stack tecnico
- `Next.js 16` + `React 19` + `TypeScript`
- `shadcn/ui` para componentes base
- `Recharts` para visualizacion (envuelto con `components/ui/chart.tsx`)
- Cliente HTTP propio (`lib/api.ts` y `lib/backend-client.ts`)

## 4) Arquitectura de integracion
### 4.1 Fuentes de datos
- `Route Handler proxy interno` (`/api/*`):
  - reenvia requests al backend Fastify.
- `Backend externo`:
  - unico origen de datos y reglas de negocio.

### 4.2 Capa de estado
- `context/auth-context.tsx`: usuario autenticado, token, cookie de acceso.
- `context/app-context.tsx`: cache de datos globales, carga inicial, refresh controlado.
- hooks de dominio (`hooks/use-*`) para consumo por pantalla.

### 4.3 Tiempo real
- Endpoint WS de lecturas:
  - `/ws/lecturas?instalacionId=<id>`
  - `/ws/lecturas?sensorInstaladoId=<id>`
- Endpoint WS de notificaciones:
  - `/ws/notificaciones`
- Regla importante: el filtro va en la URL; no hay suscripcion dinamica por mensaje.

## 5) Estructura de carpetas clave
- `app/`: pantallas y route handlers.
- `components/`: UI de dominio y componentes compartidos.
- `components/ui/`: base `shadcn/ui`.
- `context/`: estado global (auth/app).
- `hooks/`: acceso a datos y logica de negocio de UI.
- `lib/`: clientes API, utilidades auth/ws/notificaciones.
- `types/`: contratos TS de entidades y payloads.

## 6) Variables de entorno
Crear `.env.local` con minimos:

```env
NEXTAUTH_SECRET=REPLACE_WITH_SECURE_VALUE
JWT_SECRET=REPLACE_WITH_SECURE_VALUE

NEXT_PUBLIC_EXTERNAL_API_URL=https://BACKEND_HOST:3300
EXTERNAL_API_URL=https://BACKEND_HOST:3300
NEXT_PUBLIC_WS_URL=wss://BACKEND_HOST:3300/ws/lecturas

NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Opcionales:
- SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)
- Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID_ADMIN`)
- Sentry/Redis/S3 si se usan en tu entorno.

Notas:
- Evitar comillas sobrantes o espacios al inicio/fin en secretos.

## 7) Instalacion, ejecucion y build
Instalacion:
```bash
pnpm install
```

Desarrollo:
```bash
pnpm typecheck
pnpm dev
```

Produccion:
```bash
pnpm build
pnpm start
```

## 8) Scripts utiles
- `pnpm dev`: servidor local.
- `pnpm typecheck`: validacion TS.
- `pnpm build`: build de produccion.
- `pnpm test:login`: prueba rapida del flujo de login contra backend.

## 9) Flujos importantes
### 9.1 Autenticacion
1. Login recibe `token` y `usuario`.
2. Token se guarda en `localStorage` y cookie `access_token`.
3. Si el backend responde `401`, se dispara logout global y redireccion a login.

### 9.2 Creacion de usuarios (regla actual)
- `superadmin` puede definir password manual al crear.
- Si no define password, se usa flujo de recuperacion (email/telegram).
- `admin` crea usuarios dentro de su alcance permitido.

### 9.3 Eliminacion de usuarios
- La UI solo confirma exito si el backend devuelve exito real.
- Se evita falso positivo visual de eliminacion.

## 10) Roles y permisos (resumen funcional)
- `superadmin`:
  - acceso total de plataforma,
  - crea/edita usuarios de cualquier nivel,
  - gestiona configuracion global.
- `admin`:
  - gestiona usuarios y recursos dentro de empresas/sucursales asignadas.
- `standard` / `operator` / `viewer` / `manager`:
  - acceso restringido por asignaciones (sucursal/instalacion).

## 11) Analitica y graficas
- Las graficas principales usan wrapper `shadcn/ui`:
  - archivo: `components/ui/chart.tsx`.
- Componentes migrados:
  - `components/sensor-averages-chart.tsx`
  - `components/parameter-trend-chart.tsx`
  - `components/analytics-content.tsx`
- Beneficio: consistencia visual y tooltips/legends controlados.

## 12) Performance aplicada
- Cache de requests GET y deduplicacion de in-flight requests.
- Reduccion de sobrecarga en `app-context` y hooks de sensores.
- Evita refetch agresivo al navegar.
- En analitica se bajo la cantidad de requests por ciclo de resumen.

## 13) Checklist de QA antes de release
1. Login con `superadmin` y `admin`.
2. CRUD usuario:
   - crear con password manual (superadmin),
   - crear sin password (flujo recovery),
   - eliminar usuario.
3. CRUD instalaciones/sensores/procesos/especies.
4. Analitica:
   - cambio de rango de fechas,
   - filtros de sensor/instalacion,
   - exportacion.
5. WS:
   - recepcion de lecturas en pantalla de monitoreo/analitica.

## 14) Troubleshooting detallado
### Error `401` o `Token invalido`
- limpiar almacenamiento del navegador:
  - `localStorage.removeItem("token")`
  - `localStorage.removeItem("user_data")`
- volver a autenticar.
- validar `JWT_SECRET` y que frontend apunte al backend correcto.

### Build falla por Google Fonts (`Inter`)
- causa: entorno sin salida a internet.
- opciones:
  - habilitar salida a `fonts.googleapis.com`,
  - o migrar a fuente local.

### Pantallas lentas
- validar latencia de `/api/*`.
- revisar logs de llamadas repetidas.
- confirmar que no haya loops de refresh por efecto.

### WS se desconecta frecuentemente
- validar URL ws/wss correcta.
- revisar proxy/reverse proxy si corta upgrade.
- comprobar token y filtros de instalacion/sensor.

## 15) Runbook de operacion diaria
1. Confirmar backend y DB arriba.
2. Validar `.env.local`.
3. Ejecutar `pnpm typecheck`.
4. Arrancar `pnpm dev` o `pnpm start`.
5. Verificar salud funcional en:
   - login,
   - usuarios,
   - instalaciones/sensores,
   - analitica.
6. Revisar consola para 401, WS errors y tiempos de respuesta.
