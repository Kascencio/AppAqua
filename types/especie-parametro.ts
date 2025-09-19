export interface EspecieParametro {
  id_especie_parametro: number
  id_especie: number
  id_parametro: number
  Rmin: number
  Rmax: number
  fecha_creacion?: string
  estado?: "activo" | "inactivo"
}

export interface EspecieParametroCreate {
  id_especie: number
  id_parametro: number
  Rmin: number
  Rmax: number
}

export interface EspecieParametroUpdate {
  Rmin?: number
  Rmax?: number
  estado?: "activo" | "inactivo"
}
