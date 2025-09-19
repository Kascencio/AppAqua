// Tipos alineados con la estructura real de la base de datos
export interface Especie {
  id_especie: number
  nombre: string
  fecha_creacion?: string
  estado?: "activa" | "inactiva"
}

// Para operaciones de creación (sin ID)
export interface EspecieCreate {
  nombre: string
  estado?: "activa" | "inactiva"
}

// Para operaciones de actualización
export interface EspecieUpdate {
  nombre?: string
  estado?: "activa" | "inactiva"
}

// Especie con sus parámetros asociados (para vistas completas)
export interface EspecieConParametros extends Especie {
  parametros: EspecieParametroDetalle[]
}

// Detalle de parámetro con información completa
export interface EspecieParametroDetalle {
  id_especie_parametro: number
  id_parametro: number
  nombre_parametro: string
  unidad_medida: string
  Rmin: number
  Rmax: number
}

// Para validaciones de rangos
export interface ValidacionRango {
  parametro: string
  Rmin: number
  Rmax: number
  valido: boolean
  error?: string
}

// Request para crear parámetros de especie
export interface EspecieParametroRequest {
  id_especie: number
  id_parametro: number
  Rmin: number
  Rmax: number
}
