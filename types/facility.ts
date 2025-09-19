export interface WaterQuality {
  ph: number
  temperature: number
  oxygen: number
  salinity?: number
  turbidity?: number
  nitrates?: number
  ammonia?: number
  [key: string]: number | undefined
}

export interface ParameterConfig {
  value: number
  minValue?: number
  maxValue?: number
  sensorId?: string
}

export interface Facility {
  id: string
  name: string
  type: "estanque" | "purificacion" | string
  waterQuality: Record<string, ParameterConfig>
  sensors: string[]
}
