export interface Sensor {
  id_sensor: number
  nombre_sensor: string
  tipo_sensor: string // "temperatura", "ph", "oxigeno", "salinidad", etc.
  descripcion?: string
  modelo?: string
  id_instalacion?: number
  estado?: "activo" | "inactivo" | "mantenimiento"
  ubicacion?: string
  fecha_instalacion?: string
  // Campos adicionales para compatibilidad
  id?: string
  name?: string
  type?: string
  status?: string
  facilityId?: string
  branchId?: string
  parameters?: string[]
  currentParameter?: string
  unit?: string
  lastReading?: number
  lastReadingTime?: Date
  batteryLevel?: number
  signalStrength?: number
  firmwareVersion?: string
  installationDate?: Date
  maintenanceDate?: Date
  notes?: string
}

export type SensorParameter =
  | "ph"
  | "temperature"
  | "oxygen"
  | "salinity"
  | "turbidity"
  | "nitrates"
  | "ammonia"
  | "barometric"

export type SensorType =
  | "ph"
  | "temperature"
  | "oxygen"
  | "salinity"
  | "turbidity"
  | "nitrates"
  | "ammonia"
  | "barometric"
  | "other"

export type SensorStatus = "active" | "alert" | "offline" | "maintenance" | "inactive"

export interface SensorReading {
  id: string
  sensorId: string
  parameter: string
  value: number
  timestamp: Date
  isOutOfRange: boolean
}

export interface SensorWithLocation extends Sensor {
  facilityName?: string
  branchName?: string
  branchLocation?: string
  instalacion_nombre?: string
}
