import { z } from 'zod'

/**
 * Validation Schemas for AppAqua
 * Centralized Zod schemas for consistent validation across API routes and forms
 */

// =========================================================
// COMMON SCHEMAS
// =========================================================

export const idSchema = z.number().int().positive('ID debe ser un número positivo')
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Página debe ser mayor a 0').default(1),
  pageSize: z.number().int().min(1).max(100, 'Tamaño de página debe estar entre 1 y 100').default(10),
})

const baseDateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const dateRangeSchema = baseDateRangeSchema.refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, 'Fecha de inicio debe ser anterior a fecha de fin')

// =========================================================
// ORGANIZACION SCHEMAS
// =========================================================

export const organizacionCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(160, 'Nombre muy largo'),
  razon_social: z.string().max(200).optional(),
  rfc: z.string().regex(/^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z\d][A-Z\d]$/, 'RFC inválido').optional(),
  regimen_fiscal: z.string().max(80).optional(),
  telefono: z.string().max(30).optional(),
  correo: z.string().email('Email inválido').max(120).optional(),
  sitio_web: z.string().url('URL inválida').max(200).optional(),
  logo_url: z.string().url('URL inválida').max(300).optional(),
  calle: z.string().max(160).optional(),
  num_ext: z.string().max(20).optional(),
  num_int: z.string().max(20).optional(),
  referencia: z.string().max(200).optional(),
  id_estado: idSchema.optional(),
  id_municipio: idSchema.optional(),
  id_colonia: idSchema.optional(),
  codigo_postal: z.string().regex(/^\d{5}$/, 'Código postal debe tener 5 dígitos').optional(),
  estado: z.enum(['activa', 'inactiva']).default('activa'),
})

export const organizacionUpdateSchema = organizacionCreateSchema.partial().extend({
  id_organizacion: idSchema,
})

export const organizacionQuerySchema = z.object({
  search: z.string().optional(),
  estado: z.enum(['activa', 'inactiva']).optional(),
  id_estado: idSchema.optional(),
  ...paginationSchema.shape,
})

// =========================================================
// LOCATION SCHEMAS (Estados, Municipios, Colonias)
// =========================================================

export const estadoCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(120, 'Nombre muy largo'),
})

export const municipioCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(160, 'Nombre muy largo'),
  id_estado: idSchema,
})

export const coloniaCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(160, 'Nombre muy largo'),
  id_cp: idSchema,
})

export const codigoPostalCreateSchema = z.object({
  codigo_postal: z.string().regex(/^\d{5}$/, 'Código postal debe tener 5 dígitos'),
  id_municipio: idSchema,
})

// =========================================================
// USER & AUTH SCHEMAS
// =========================================================

export const userCreateSchema = z.object({
  correo: z.string().email('Email inválido').max(160),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  nombre_completo: z.string().min(1, 'Nombre completo es requerido').max(160),
  id_rol: idSchema,
  activo: z.boolean().default(true),
})

export const userUpdateSchema = userCreateSchema.omit({ password: true }).partial().extend({
  id_usuario: idSchema,
})

export const loginSchema = z.object({
  correo: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña es requerida'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual es requerida'),
  newPassword: z.string().min(8, 'Nueva contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmación de contraseña es requerida'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  correo: z.string().email('Email inválido'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token es requerido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmación de contraseña es requerida'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// =========================================================
// SENSOR & TELEMETRY SCHEMAS
// =========================================================

export const sensorCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(160),
  unidad: z.string().max(40).optional(),
  tipo_medida: z.enum(['temperatura', 'ph', 'oxigeno_disuelto', 'conductividad', 'turbidez', 'salinidad', 'otro']).optional(),
  rango_min: z.number().optional(),
  rango_max: z.number().optional(),
})

export const sensorInstallSchema = z.object({
  id_instalacion: idSchema,
  id_sensor: idSchema,
  descripcion: z.string().max(255).optional(),
  fecha_instalada: z.string().date().optional(),
})

export const lecturaCreateSchema = z.object({
  id_sensor_instalado: idSchema,
  valor: z.number().min(-999999, 'Valor fuera de rango').max(999999, 'Valor fuera de rango'),
  tomada_en: z.string().datetime().optional().default(() => new Date().toISOString()),
})

export const lecturaQuerySchema = z.object({
  id_sensor_instalado: idSchema.optional(),
  id_instalacion: idSchema.optional(),
  id_organizacion: idSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ...paginationSchema.shape,
})

// =========================================================
// ALERT SCHEMAS
// =========================================================

export const alertaCreateSchema = z.object({
  id_instalacion: idSchema,
  mensaje: z.string().min(1, 'Mensaje es requerido').max(255),
  nivel: z.enum(['info', 'warning', 'critical']).default('info'),
})

export const alertaUpdateSchema = z.object({
  id_alerta: idSchema,
  atendida: z.boolean().optional(),
})

// =========================================================
// PROCESS & SPECIES SCHEMAS
// =========================================================

export const procesoCreateSchema = z.object({
  id_instalacion: idSchema,
  id_especie: idSchema.optional(),
  nombre: z.string().min(1, 'Nombre es requerido').max(160),
  descripcion: z.string().max(255).optional(),
  fecha_inicio: z.string().date().optional(),
  fecha_fin: z.string().date().optional(),
  estado: z.enum(['activo', 'pausado', 'finalizado']).default('activo'),
})

export const especieCreateSchema = z.object({
  nombre_comun: z.string().min(1, 'Nombre común es requerido').max(120),
  nombre_cientifico: z.string().max(160).optional(),
  notas: z.string().max(255).optional(),
})

// =========================================================
// EXPORT SCHEMAS
// =========================================================

export const csvExportSchema = z.object({
  tipo: z.enum(['lecturas', 'organizaciones', 'sensores', 'alertas']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  filtros: z.record(z.any()).optional(),
})

// =========================================================
// API RESPONSE SCHEMAS
// =========================================================

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  })

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        pageSize: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    }),
    error: z.string().optional(),
  })

// =========================================================
// TYPE EXPORTS
// =========================================================

export type OrganizacionCreate = z.infer<typeof organizacionCreateSchema>
export type OrganizacionUpdate = z.infer<typeof organizacionUpdateSchema>
export type OrganizacionQuery = z.infer<typeof organizacionQuerySchema>

export type UserCreate = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type LoginRequest = z.infer<typeof loginSchema>

export type SensorCreate = z.infer<typeof sensorCreateSchema>
export type SensorInstall = z.infer<typeof sensorInstallSchema>

export type LecturaCreate = z.infer<typeof lecturaCreateSchema>
export type LecturaQuery = z.infer<typeof lecturaQuerySchema>

export type PaginationParams = z.infer<typeof paginationSchema>
export type DateRangeParams = z.infer<typeof dateRangeSchema>

// =========================================================
// VALIDATION HELPERS
// =========================================================

/**
 * Parse and validate request body with proper error handling
 */
export function validateRequestBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string; details: any } {
  try {
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return {
        success: false,
        error: 'Datos de entrada inválidos',
        details
      }
    }
    return {
      success: false,
      error: 'Error de validación',
      details: error
    }
  }
}

/**
 * Parse and validate query parameters
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  schema: T,
  query: unknown
): z.infer<T> {
  return schema.parse(query)
}