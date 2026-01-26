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
  id: string | number
  name: string
  type: "estanque" | "purificacion" | string
  waterQuality?: Record<string, ParameterConfig>
  sensors?: string[]
  // Additional optional properties used in various components
  status?: "active" | "inactive" | "maintenance" | string
  branchId?: string | number
  location?: string | { lat: number; lng: number }
  coordinates?: [number, number]
  capacity?: number
  description?: string
  speciesId?: string | number
  species?: string
  parameters?: unknown[]
  [key: string]: unknown
}
