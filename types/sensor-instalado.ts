export interface SensorInstalado {
  id_sensor_instalado: number
  id_instalacion: number
  id_sensor: number
  fecha_instalada: string // YYYY-MM-DD
  descripcion: string
  id_lectura?: number | null
}

export interface SensorInstaladoCompleto extends SensorInstalado {
  nombre_instalacion?: string
  nombre_sensor?: string
  marca_sensor?: string
  modelo_sensor?: string
  unidad_medida?: string
}

// Legacy compatibility
export interface Sensor extends SensorInstalado {
  // Mapeo de campos legacy a nuevos
  id: string
  facilityId: string
  type: string
  name: string
  unit: string
  status: "active" | "inactive" | "maintenance" | "error"
  lastReading?: {
    value: number
    timestamp: Date
    status: "normal" | "warning" | "critical"
  }
  location?: string
  calibrationDate?: Date
}

// Función para convertir SensorInstalado a Sensor (legacy)
export function sensorInstaladoToSensor(sensor: SensorInstalado, catalogoSensor?: any): Sensor {
  return {
    ...sensor,
    id: `sensor-${sensor.id_instalacion}-${sensor.id_sensor}-${sensor.id_sensor_instalado}`,
    facilityId: `facility-${sensor.id_instalacion}`,
    type: sensor.descripcion,
    name: catalogoSensor?.sensor || sensor.descripcion,
    unit: catalogoSensor?.unidad_medida || "",
    status: "active",
    location: `Instalación ${sensor.id_instalacion}`,
  }
}
