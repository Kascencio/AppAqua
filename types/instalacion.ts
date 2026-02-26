export type InstalacionEstado = "activo" | "inactivo"
export type InstalacionTipoUso = "acuicultura" | "tratamiento" | "otros"

export interface Instalacion {
  id_instalacion: number
  id_empresa_sucursal?: number
  id_organizacion?: number
  nombre_instalacion: string
  codigo_instalacion?: string
  fecha_instalacion: string // YYYY-MM-DD
  estado_operativo: "activo" | "inactivo"
  descripcion: string
  tipo_uso: "acuicultura" | "tratamiento" | "otros"
  ubicacion?: string
  latitud?: number
  longitud?: number
  capacidad_maxima?: number
  capacidad_actual?: number
  volumen_agua_m3?: number
  profundidad_m?: number
  fecha_ultima_inspeccion?: string
  responsable_operativo?: string
  contacto_emergencia?: string
  id_proceso: number
  // Extended fields for API compatibility
  nombre_empresa?: string
  nombre_organizacion?: string
  nombre_proceso?: string
  nombre_especie?: string
  sucursal_nombre?: string
  [key: string]: unknown
}

export interface InstalacionCompleta extends Instalacion {
  nombre_empresa?: string
  nombre_proceso?: string
  nombre_especie?: string
}

// Legacy compatibility
export interface Facility extends Instalacion {
  // Mapeo de campos legacy a nuevos
  id: number
  name: string
  branchId: number
  status: "active" | "inactive" | "maintenance"
  type: string
  description: string
  location?: string
  coordinates?: { lat: number; lng: number }
}

// Función para convertir Instalacion a Facility (legacy)
export function instalacionToFacility(instalacion: Instalacion): Facility {
  return {
    ...instalacion,
    id: instalacion.id_instalacion,
    name: instalacion.nombre_instalacion,
    branchId: instalacion.id_empresa_sucursal ?? 0,
    status: instalacion.estado_operativo === "activo" ? "active" : "inactive",
    type: instalacion.tipo_uso,
    description: instalacion.descripcion,
  }
}
