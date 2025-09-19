// Archivo para definir interfaces faltantes en el sistema
// Agrega aquí las interfaces que detectes como necesarias para la integración real

// 1. LecturaPorProceso - Usada en hooks pero no definida
export interface LecturaPorProceso {
  id_lectura: number
  id_sensor_instalado: number
  id_parametro: number
  valor: number
  fecha_hora_lectura: Date | string
  calidad_lectura?: "excelente" | "buena" | "regular" | "mala"
  notas?: string
  // Campos calculados para el proceso
  nombre_sensor?: string
  nombre_parametro?: string
  unidad_medida?: string
  nombre_instalacion?: string
  rango_optimo_min?: number
  rango_optimo_max?: number
}

// 2. ParametroMonitoreo - Usada en hooks pero no definida
export interface ParametroMonitoreo {
  id_parametro: number
  nombre_parametro: string
  unidad_medida: string
  rango_min?: number
  rango_max?: number
  valor_actual?: number
  estado?: "normal" | "advertencia" | "critico"
  ultima_lectura?: Date | string
}

// 3. ProcesoDetallado - Usada en hooks pero no definida
type Proceso = {}
export interface ProcesoDetallado extends Proceso {
  nombre_especie?: string
  nombre_instalacion?: string
  nombre_empresa?: string
  sensores_count?: number
  lecturas_count?: number
  alertas_activas?: number
  progreso_estimado?: number
}

// 4. SensorDataPoint - Usada en simulación pero no oficial
export interface SensorDataPoint {
  timestamp: string
  value: number
  status: "normal" | "warning" | "critical"
  parametro?: string
  unidad?: string
}

// 5. AlertaDetallada - Para sistema de alertas
type Alerta = {}
export interface AlertaDetallada extends Alerta {
  nombre_sensor?: string
  nombre_parametro?: string
  nombre_instalacion?: string
  tiempo_transcurrido?: string
  acciones_sugeridas?: string[]
}
