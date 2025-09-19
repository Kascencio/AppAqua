export interface Parametro {
  id_parametro: number
  nombre_parametro: string
  unidad_medida: string
  descripcion?: string
  tipo_dato?: "decimal" | "entero" | "texto"
  valor_minimo?: number
  valor_maximo?: number
  estado?: "activo" | "inactivo"
}

export interface ParametroCreate {
  nombre_parametro: string
  unidad_medida: string
  descripcion?: string
  tipo_dato?: "decimal" | "entero" | "texto"
  valor_minimo?: number
  valor_maximo?: number
}
