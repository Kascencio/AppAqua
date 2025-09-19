import { z } from "zod"

// Esquema para validar coordenadas
export const coordinatesSchema = z.tuple([
  z
    .number()
    .min(-90)
    .max(90), // Latitud
  z
    .number()
    .min(-180)
    .max(180), // Longitud
])

// Esquema para validar parámetros de agua
export const waterParameterSchema = z.object({
  value: z.number(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  sensorId: z.string().optional(),
})

// Esquema para validar una sucursal
export const branchSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres"),
  coordinates: coordinatesSchema,
  status: z.enum(["active", "inactive"]),
})

// Esquema para validar una instalación
export const facilitySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  type: z.string().min(3, "El tipo debe tener al menos 3 caracteres"),
  branchId: z.string().min(1, "Debe seleccionar una sucursal"),
})

// Esquema para validar un sensor
export const sensorSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  type: z.enum(["ph", "temperature", "oxygen", "salinity", "turbidity", "nitrates", "ammonia", "other"]),
  facilityId: z.string().min(1, "Debe seleccionar una instalación"),
  branchId: z.string().min(1, "Debe seleccionar una sucursal"),
  parameters: z.array(z.string()).min(1, "Debe seleccionar al menos un parámetro"),
})

// Esquema para validar un usuario
export const userSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Debe ingresar un correo electrónico válido"),
  role: z.enum(["superadmin", "admin", "standard"]),
  status: z.enum(["active", "inactive", "pending"]),
  branchAccess: z.array(z.string()).min(1, "Debe seleccionar al menos una sucursal"),
})

// Esquema para validar credenciales de inicio de sesión
export const loginSchema = z.object({
  email: z.string().email("Debe ingresar un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

// Update the speciesParameterSchema to better reflect the min/max values
export const speciesParameterSchema = z.object({
  id_especie: z.number().positive("Debe seleccionar una especie"),
  id_parametro: z.number().positive("Debe seleccionar un parámetro"),
  Rmin: z.number().min(0, "El valor mínimo debe ser mayor o igual a 0"),
  Rmax: z.number().min(0, "El valor máximo debe ser mayor o igual a 0"),
})

// Add a validation to ensure max is greater than min
export const validateParameterRange = (min: number, max: number): boolean => {
  return max > min
}
