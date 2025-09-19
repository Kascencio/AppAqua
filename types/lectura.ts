export interface Lectura {
  id_lectura: number
  id_sensor_instalado: number
  valor: number
  fecha: string // YYYY-MM-DD
  hora: string // HH:MM:SS
}

export interface LecturaPorProceso {
  id_lectura: number
  valor: number
  fecha: string
  hora: string
  id_instalacion: number
  nombre_instalacion: string
  nombre_sensor: string
  tipo_sensor: string
}

export interface ParametroMonitoreo {
  id_parametro: number
  nombre_parametro: string
  unidad_medida: string
  valor_actual?: number
  estado?: "normal" | "advertencia" | "critico"
  ultima_lectura?: string
}

// Legacy compatibility
export interface SensorReading extends Lectura {
  // Mapeo de campos legacy a nuevos
  id: string
  sensorId: string
  value: number
  timestamp: Date
  unit: string
  status: "normal" | "warning" | "critical"
  location?: string
}

// Función para convertir Lectura a SensorReading (legacy)
export function lecturaToSensorReading(lectura: Lectura, sensor?: any): SensorReading {
  const timestamp = new Date(`${lectura.fecha}T${lectura.hora}`)

  return {
    ...lectura,
    id: `reading-${lectura.id_lectura}`,
    sensorId: `sensor-${lectura.id_sensor_instalado}`,
    value: lectura.valor,
    timestamp,
    unit: sensor?.unidad_medida || "",
    status: "normal", // Se calculará basado en rangos
  }
}

// Ejemplo de extensión con JOINs:
export interface LecturaDetallada extends Lectura {
  nombre_instalacion?: string
  nombre_sensor?: string
  tipo_sensor?: string
}
