# 🚨 Funcionalidades Faltantes en el Backend

Este documento lista las funcionalidades que el frontend requiere pero que NO están implementadas en el backend Fastify actual.

---

## ❌ 1. Sistema de Asignación de Usuarios a Sucursales

### Estado Actual
- **Tabla DB**: ✅ Existe `asignacion_usuario` en el schema
- **Endpoints Backend**: ❌ NO implementados
- **Uso Frontend**: ❌ No se puede gestionar permisos por sucursal

### Schema de la Tabla
```prisma
model asignacion_usuario {
  id_asignacion                Int                   @id @default(autoincrement())
  id_usuario                   Int
  id_organizacion_sucursal     Int
  organizacion_sucursal        organizacion_sucursal @relation(fields: [id_organizacion_sucursal], references: [id_organizacion_sucursal])
  usuario                      usuario               @relation(fields: [id_usuario], references: [id_usuario])
  instalacion                  instalacion[]
  
  @@index([id_usuario])
  @@index([id_organizacion_sucursal])
  @@map("asignacion_usuario")
}
```

### Endpoints Necesarios

#### POST `/api/asignacion-usuario`
Asignar un usuario a una sucursal.

**Request Body**:
```json
{
  "id_usuario": 5,
  "id_organizacion_sucursal": 3
}
```

**Response**:
```json
{
  "id_asignacion": 12,
  "id_usuario": 5,
  "id_organizacion_sucursal": 3
}
```

#### GET `/api/asignacion-usuario`
Obtener asignaciones con filtros opcionales.

**Query Params**:
- `userId` (opcional): Filtrar por usuario
- `sucursalId` (opcional): Filtrar por sucursal

**Ejemplo**: `GET /api/asignacion-usuario?userId=5`

**Response**:
```json
[
  {
    "id_asignacion": 12,
    "id_usuario": 5,
    "id_organizacion_sucursal": 3,
    "usuario": {
      "nombre_completo": "Juan Pérez",
      "correo": "juan@example.com"
    },
    "organizacion_sucursal": {
      "nombre_sucursal": "Granja Norte",
      "id_organizacion": 1
    }
  }
]
```

#### GET `/api/asignacion-usuario/:id`
Obtener una asignación específica.

#### DELETE `/api/asignacion-usuario/:id`
Eliminar asignación.

### Lógica de Negocio Requerida
1. **Validar duplicados**: Un usuario no puede ser asignado dos veces a la misma sucursal
2. **Cascada**: Al eliminar un usuario, eliminar sus asignaciones
3. **Permisos**: Solo Admin/SuperAdmin pueden gestionar asignaciones

---

## ⚠️ 2. Sistema de Notificaciones y Alertas Proactivas

### Estado Actual
- **Endpoints de Alertas**: ✅ CRUD básico implementado
  - `GET/POST/PUT/DELETE /api/alertas`
- **Funcionalidad Faltante**: 
  - ❌ Webhook o WebSocket para alertas en tiempo real
  - ❌ Configuración de umbrales personalizados
  - ❌ Notificaciones push/email

### Tabla Actual
```prisma
model alertas {
  id_alerta           Int              @id @default(autoincrement())
  id_sensor_instalado Int
  id_instalacion      Int
  nivel_alerta        String           @db.VarChar(50)
  mensaje             String           @db.Text
  fecha_alerta        DateTime         @db.DateTime(0)
  instalacion         instalacion      @relation(fields: [id_instalacion], references: [id_instalacion])
  sensor_instalado    sensor_instalado @relation(fields: [id_sensor_instalado], references: [id_sensor_instalado])
  
  @@index([id_instalacion])
  @@index([id_sensor_instalado])
  @@map("alertas")
}
```

### Funcionalidades Necesarias

#### WebSocket para Alertas en Tiempo Real
**URL Propuesta**: `ws://host/ws/alertas?userId=5`

Emitir evento cuando se crea una alerta nueva:
```json
{
  "type": "alerta.created",
  "data": {
    "id_alerta": 234,
    "nivel_alerta": "critico",
    "mensaje": "Temperatura fuera de rango: 32°C (max: 28°C)",
    "instalacion": {
      "id_instalacion": 10,
      "nombre_instalacion": "Estanque A1"
    },
    "sensor": {
      "id_sensor_instalado": 45,
      "tipo": "temperatura"
    }
  }
}
```

#### Configuración de Umbrales Personalizados
**Endpoint Propuesto**: `POST /api/alertas/configuracion`

Permitir definir umbrales específicos por instalación/especie:
```json
{
  "id_instalacion": 10,
  "id_especie": 2,
  "parametro": "temperatura",
  "min_critico": 18,
  "min_warning": 20,
  "max_warning": 28,
  "max_critico": 32,
  "notificar_email": true,
  "emails": ["admin@aqua.com", "tecnico@aqua.com"]
}
```

#### Sistema de Notificaciones
- **Email**: Integración con servicio SMTP o SendGrid
- **Push Notifications**: Firebase Cloud Messaging o similar
- **Webhook**: POST a URL externa cuando se genera alerta

---

## ❌ 3. Reportes Avanzados (PDF, Excel)

### Estado Actual
- **Disponible**: ✅ Reporte XML (`GET /api/reportes/xml`)
- **Faltante**: 
  - ❌ Reporte PDF
  - ❌ Reporte Excel/CSV
  - ❌ Reporte personalizado con gráficos

### Endpoints Necesarios

#### GET `/api/reportes/pdf`
Generar reporte en PDF con gráficos.

**Query Params**:
- `sensorInstaladoId` o `instalacionId` (requerido)
- `from` (opcional): Fecha inicio ISO 8601
- `to` (opcional): Fecha fin ISO 8601
- `includeGraphs` (opcional): true/false (default: true)

**Response**: Stream de archivo PDF

**Contenido del PDF**:
- Header con logo y datos de la organización
- Tabla de lecturas en el período
- Gráficos de tendencias (línea temporal)
- Estadísticas: promedio, min, max, desviación estándar
- Alertas generadas en el período
- Footer con fecha de generación

#### GET `/api/reportes/excel`
Generar reporte en formato Excel (.xlsx).

**Query Params**: Igual que PDF

**Response**: Stream de archivo Excel

**Hojas del Excel**:
1. **Resumen**: Estadísticas generales
2. **Lecturas**: Tabla completa de lecturas
3. **Alertas**: Listado de alertas del período
4. **Gráficos**: Gráficos de tendencias (embebidos)

#### GET `/api/reportes/csv`
Exportar datos crudos en CSV.

**Response**: Stream de archivo CSV

---

## ❌ 4. Dashboard de Analytics y KPIs

### Estado Actual
- **Funcionalidad**: ❌ NO implementado

### Endpoints Necesarios

#### GET `/api/analytics/organizacion/:id`
Obtener KPIs generales de una organización.

**Response**:
```json
{
  "id_organizacion": 1,
  "nombre": "Acuícola del Norte",
  "periodo": {
    "desde": "2024-01-01",
    "hasta": "2024-12-31"
  },
  "kpis": {
    "total_instalaciones": 25,
    "total_sensores": 150,
    "total_lecturas": 1234567,
    "sensores_activos": 145,
    "sensores_inactivos": 5,
    "alertas_generadas": 45,
    "alertas_criticas": 3,
    "tasa_uptime": 99.2
  },
  "tendencias": {
    "temperatura_promedio": 25.3,
    "ph_promedio": 7.2,
    "oxigeno_promedio": 7.8
  },
  "instalaciones_con_alertas": [
    {
      "id_instalacion": 10,
      "nombre": "Estanque A1",
      "alertas_count": 12
    }
  ]
}
```

#### GET `/api/analytics/comparativa`
Comparar métricas entre instalaciones o períodos.

**Query Params**:
- `instalacionIds` (requerido): IDs separados por coma
- `from` (requerido): Fecha inicio
- `to` (requerido): Fecha fin
- `parametro` (opcional): temperatura, ph, oxigeno, etc.

**Response**:
```json
{
  "instalaciones": [
    {
      "id_instalacion": 10,
      "nombre": "Estanque A1",
      "promedios": {
        "temperatura": 25.5,
        "ph": 7.3,
        "oxigeno": 7.9
      },
      "alertas_count": 8
    },
    {
      "id_instalacion": 11,
      "nombre": "Estanque A2",
      "promedios": {
        "temperatura": 24.8,
        "ph": 7.1,
        "oxigeno": 8.2
      },
      "alertas_count": 3
    }
  ]
}
```

#### GET `/api/analytics/tendencias`
Obtener tendencias históricas agregadas.

**Response**:
```json
{
  "parametro": "temperatura",
  "granularidad": "diaria",
  "datos": [
    { "fecha": "2024-01-01", "promedio": 25.3, "min": 22.1, "max": 28.5 },
    { "fecha": "2024-01-02", "promedio": 25.7, "min": 23.2, "max": 29.1 }
  ]
}
```

---

## ❌ 5. Gestión de Procesos Mejorada

### Estado Actual
- **Endpoints**: ✅ CRUD básico implementado (`/api/procesos`)
- **Funcionalidad Faltante**:
  - ❌ Validación de solapamiento de procesos en misma instalación
  - ❌ Historial de cambios en procesos
  - ❌ Cálculo automático de métricas de crecimiento
  - ❌ Alertas de finalización de proceso

### Endpoints Necesarios

#### POST `/api/procesos/validar-overlap`
Validar si un nuevo proceso se solapa con otros existentes.

**Request Body**:
```json
{
  "id_instalacion": 10,
  "fecha_inicio": "2024-06-01",
  "fecha_final": "2024-08-15"
}
```

**Response**:
```json
{
  "hay_overlap": true,
  "procesos_conflictivos": [
    {
      "id_proceso": 123,
      "id_especie": 2,
      "fecha_inicio": "2024-05-01",
      "fecha_final": "2024-07-15"
    }
  ]
}
```

#### GET `/api/procesos/:id/metricas`
Obtener métricas calculadas de un proceso.

**Response**:
```json
{
  "id_proceso": 123,
  "dias_transcurridos": 45,
  "dias_restantes": 30,
  "porcentaje_completado": 60,
  "lecturas_totales": 5432,
  "promedios": {
    "temperatura": 25.3,
    "ph": 7.2,
    "oxigeno": 7.9
  },
  "alertas_generadas": 8,
  "estado_salud": "bueno"
}
```

---

## ❌ 6. Gestión de Especies con Parámetros Óptimos

### Estado Actual
- **Endpoints**: ✅ CRUD de especies (`/api/catalogo-especies`)
- **Endpoints**: ✅ CRUD de parámetros (`/api/especies-parametros`)
- **Funcionalidad Faltante**:
  - ❌ Sistema de recomendaciones basado en especie
  - ❌ Validación automática de parámetros vs especie del proceso

### Endpoints Necesarios

#### GET `/api/especies/:id/recomendaciones`
Obtener parámetros óptimos para una especie.

**Response**:
```json
{
  "id_especie": 2,
  "nombre_comun": "Tilapia",
  "parametros_optimos": [
    {
      "parametro": "temperatura",
      "min": 25,
      "max": 30,
      "optimo": 27,
      "unidad": "°C",
      "nivel_critico_min": 20,
      "nivel_critico_max": 35
    },
    {
      "parametro": "ph",
      "min": 6.5,
      "max": 8.5,
      "optimo": 7.5,
      "unidad": "pH"
    }
  ]
}
```

#### POST `/api/procesos/:id/validar-parametros`
Validar si los sensores de la instalación miden los parámetros necesarios para la especie.

**Response**:
```json
{
  "valido": false,
  "parametros_faltantes": [
    {
      "parametro": "salinidad",
      "requerido_por_especie": true,
      "instalacion_tiene_sensor": false
    }
  ],
  "recomendaciones": [
    "Instalar sensor de salinidad en la instalación"
  ]
}
```

---

## ❌ 7. Autenticación y Autorización Avanzada

### Estado Actual
- **Login**: ✅ Implementado (`POST /api/login`)
- **Faltante**:
  - ❌ Refresh Token
  - ❌ Password Recovery (existe tabla `token_recuperacion` pero sin endpoints)
  - ❌ Middleware de autorización por roles
  - ❌ Audit log de acciones críticas

### Endpoints Necesarios

#### POST `/api/auth/refresh`
Renovar token expirado.

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "access_token": "nuevo_token_jwt",
  "expires_in": 3600
}
```

#### POST `/api/auth/forgot-password`
Solicitar recuperación de contraseña.

**Request Body**:
```json
{
  "correo": "usuario@example.com"
}
```

**Response**:
```json
{
  "mensaje": "Se ha enviado un email con instrucciones para recuperar tu contraseña"
}
```

**Lógica**:
1. Generar token único en tabla `token_recuperacion`
2. Enviar email con link: `https://app.com/reset-password?token=ABC123`
3. Token válido por 1 hora

#### POST `/api/auth/reset-password`
Restablecer contraseña con token.

**Request Body**:
```json
{
  "token": "ABC123",
  "new_password": "NuevaContraseña123!"
}
```

**Response**:
```json
{
  "success": true,
  "mensaje": "Contraseña actualizada exitosamente"
}
```

#### GET `/api/audit-log`
Obtener historial de acciones críticas.

**Query Params**:
- `userId` (opcional): Filtrar por usuario
- `action` (opcional): create, update, delete
- `resource` (opcional): usuario, instalacion, sensor, etc.
- `from` (opcional): Fecha inicio
- `to` (opcional): Fecha fin

**Response**:
```json
[
  {
    "id": 1,
    "usuario_id": 5,
    "usuario_nombre": "Juan Pérez",
    "accion": "delete",
    "recurso": "sensor",
    "recurso_id": 123,
    "detalles": "Eliminó sensor 'Temperatura A1'",
    "fecha": "2024-06-15T10:30:00Z",
    "ip": "192.168.1.100"
  }
]
```

---

## ❌ 8. Búsqueda y Filtrado Avanzado

### Estado Actual
- **Endpoints GET**: ✅ Devuelven todos los registros
- **Faltante**:
  - ❌ Paginación
  - ❌ Ordenamiento
  - ❌ Búsqueda por texto
  - ❌ Filtros complejos

### Funcionalidad Necesaria

#### Paginación
Todos los endpoints GET deben soportar:
- `page` (default: 1)
- `limit` (default: 50, max: 1000)

**Ejemplo**: `GET /api/instalaciones?page=2&limit=20`

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

#### Ordenamiento
Soportar query param `sort`:
- `sort=nombre` (ascendente)
- `sort=-fecha_creacion` (descendente con `-`)

**Ejemplo**: `GET /api/usuarios?sort=-fecha_creacion`

#### Búsqueda por Texto
Soportar query param `search`:

**Ejemplo**: `GET /api/instalaciones?search=estanque`

Debe buscar en campos relevantes (nombre, descripción, etc.)

#### Filtros Complejos
Soportar filtros específicos por recurso:

**Ejemplo**: `GET /api/sensores-instalados?estado=activo&tipo=temperatura&instalacionId=10`

---

## 📊 Resumen de Prioridades

| Funcionalidad | Prioridad | Impacto en Frontend | Complejidad Backend |
|---------------|-----------|---------------------|---------------------|
| Asignación de Usuarios | 🔴 ALTA | Bloquea gestión de permisos | Media |
| WebSocket de Alertas | 🟠 MEDIA | Mejora UX notificaciones | Baja |
| Reportes PDF/Excel | 🟡 MEDIA | Feature valuable pero no bloqueante | Alta |
| Analytics Dashboard | 🟡 MEDIA | Feature nice-to-have | Media |
| Validación de Procesos | 🔴 ALTA | Previene errores de negocio | Media |
| Sistema de Recuperación de Contraseña | 🟠 MEDIA | Feature estándar esperada | Baja |
| Paginación y Filtros | 🔴 ALTA | Performance con datasets grandes | Baja |
| Audit Log | 🟢 BAJA | Compliance y seguridad | Media |

---

## 🛠️ Plan de Acción Recomendado

### Opción 1: Implementar en Backend Fastify (Recomendado)
**Pros**:
- Arquitectura limpia y centralizada
- Mejor performance
- Fácil de escalar

**Cons**:
- Requiere trabajo adicional en backend
- Depende del equipo de backend

**Timeline**: 1-2 semanas adicionales

### Opción 2: Implementar en Next.js API Routes (Temporal)
**Pros**:
- No depende del equipo de backend
- Rápido de implementar
- Frontend puede avanzar sin bloqueos

**Cons**:
- Duplicación de lógica
- Más difícil de mantener
- Eventualmente hay que migrar

**Timeline**: 2-3 días

### Recomendación Final
1. **Implementar en Next.js** las funcionalidades **CRÍTICAS** para desbloquear desarrollo:
   - Asignación de usuarios (CRUD básico)
   - Validación de solapamiento de procesos
   - Paginación básica
2. **Pedir al equipo de backend** que implemente el resto en Fastify
3. **Migrar** las funcionalidades temporales cuando el backend esté listo

