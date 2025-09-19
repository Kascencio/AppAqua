export type InstalacionEstado = "activo" | "inactivo"
export type InstalacionTipoUso = "acuicultura" | "tratamiento" | "otros"

export interface Instalacion {
  id_instalacion: number
  id_empresa_sucursal: number
  nombre_instalacion: string
  fecha_instalacion: string // YYYY-MM-DD
  estado_operativo: "activo" | "inactivo"
  descripcion: string
  tipo_uso: "acuicultura" | "tratamiento" | "otros"
  id_proceso: number
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
    branchId: instalacion.id_empresa_sucursal,
    status: instalacion.estado_operativo === "activo" ? "active" : "inactive",
    type: instalacion.tipo_uso,
    description: instalacion.descripcion,
  }
}
