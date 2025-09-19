export interface Proceso {
  id_proceso: number
  id_especie: number
  fecha_inicio: string
  fecha_final: string
}

export interface ProcesoDetallado extends Proceso {
  codigo_proceso: string
  estado: "activo" | "completado" | "pausado" | "extendido"
  progreso: number
  descripcion: string
  nombre_especie?: string
  nombre_instalacion?: string
  nombre_sucursal?: string
  dias_originales: number
  dias_extension?: number
  dias_totales: number
  motivo_extension?: string
  fecha_fin_real?: string
}

export interface ProcesoFormData {
  id_especie: number
  id_instalacion: number
  fecha_inicio: string
  fecha_final: string
  descripcion: string
}

export interface ExtensionProceso {
  id_proceso: number
  dias_extension: number
  motivo_extension: string
  fecha_fin_nueva: string
}

// Utility functions for process management
export const generarCodigoProceso = (fecha_inicio: string, especie: string): string => {
  const fecha = new Date(fecha_inicio)
  const año = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, "0")
  const especieCode = especie.substring(0, 3).toUpperCase()
  const suffix = "A" // Could be incremented for multiple processes

  return `${año}${mes}${especieCode}${suffix}`
}

export const calculateProcessDuration = (fecha_inicio: string, fecha_final: string): number => {
  const inicio = new Date(fecha_inicio)
  const final = new Date(fecha_final)
  const diffTime = Math.abs(final.getTime() - inicio.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export const calcularExtension = (fecha_original: string, dias_extension: number): string => {
  const fecha = new Date(fecha_original)
  fecha.setDate(fecha.getDate() + dias_extension)
  return fecha.toISOString().split("T")[0]
}

export const calcularEstadoProceso = (
  fecha_inicio: string,
  fecha_final: string,
  dias_extension?: number,
): "activo" | "completado" | "extendido" => {
  const hoy = new Date()
  const inicio = new Date(fecha_inicio)
  const final = new Date(fecha_final)

  if (dias_extension && dias_extension > 0) {
    return "extendido"
  }

  if (hoy < inicio) {
    return "activo"
  }

  if (hoy > final) {
    return "completado"
  }

  return "activo"
}

export const calcularProgresoProceso = (fecha_inicio: string, fecha_final: string): number => {
  const hoy = new Date()
  const inicio = new Date(fecha_inicio)
  const final = new Date(fecha_final)

  if (hoy < inicio) return 0
  if (hoy > final) return 100

  const totalDias = (final.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
  const diasTranscurridos = (hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)

  return Math.round((diasTranscurridos / totalDias) * 100)
}

export const calcularDiasProceso = (fecha_inicio: string, fecha_final: string, dias_extension?: number) => {
  const inicio = new Date(fecha_inicio)
  const final = new Date(fecha_final)
  const hoy = new Date()

  const diasOriginales = Math.ceil((final.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  const diasTotales = diasOriginales + (dias_extension || 0)
  const diasTranscurridos = Math.ceil((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  const diasRestantes = Math.max(0, diasTotales - diasTranscurridos)

  return {
    diasOriginales,
    diasTotales,
    diasTranscurridos: Math.max(0, diasTranscurridos),
    diasRestantes,
  }
}

export const validarFechasProceso = (
  fecha_inicio: string,
  fecha_final: string,
): { valido: boolean; error?: string } => {
  const inicio = new Date(fecha_inicio)
  const final = new Date(fecha_final)
  const hoy = new Date()

  if (inicio >= final) {
    return { valido: false, error: "La fecha de inicio debe ser anterior a la fecha final" }
  }

  if (inicio < hoy) {
    return { valido: false, error: "La fecha de inicio no puede ser en el pasado" }
  }

  const diasDiferencia = (final.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
  if (diasDiferencia < 30) {
    return { valido: false, error: "El proceso debe durar al menos 30 días" }
  }

  if (diasDiferencia > 730) {
    return { valido: false, error: "El proceso no puede durar más de 2 años" }
  }

  return { valido: true }
}

export const puedeExtenderProceso = (estado: string, fecha_final: string): boolean => {
  const hoy = new Date()
  const final = new Date(fecha_final)

  return estado === "completado" && hoy > final
}

export const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export const formatearDuracion = (dias: number): string => {
  if (dias < 30) {
    return `${dias} días`
  } else if (dias < 365) {
    const meses = Math.floor(dias / 30)
    const diasRestantes = dias % 30
    return diasRestantes > 0 ? `${meses} meses y ${diasRestantes} días` : `${meses} meses`
  } else {
    const años = Math.floor(dias / 365)
    const diasRestantes = dias % 365
    const meses = Math.floor(diasRestantes / 30)
    return meses > 0 ? `${años} años y ${meses} meses` : `${años} años`
  }
}

export const obtenerEstadoColor = (estado: string): string => {
  switch (estado) {
    case "activo":
      return "bg-green-100 text-green-800"
    case "completado":
      return "bg-blue-100 text-blue-800"
    case "pausado":
      return "bg-yellow-100 text-yellow-800"
    case "extendido":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const obtenerProgresoColor = (progreso: number): string => {
  if (progreso < 25) return "bg-red-500"
  if (progreso < 50) return "bg-yellow-500"
  if (progreso < 75) return "bg-blue-500"
  return "bg-green-500"
}
