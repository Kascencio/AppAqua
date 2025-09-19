import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parameter configuration and utilities
export const PARAMETER_CONFIG: Record<string, { name: string; color: string; unit: string }> = {
  temperature: { name: "Temperatura", color: "#ef4444", unit: "°C" },
  oxygen: { name: "Oxígeno Disuelto", color: "#3b82f6", unit: "mg/L" },
  ph: { name: "pH", color: "#10b981", unit: "" },
  salinity: { name: "Salinidad", color: "#8b5cf6", unit: "ppt" },
  turbidity: { name: "Turbidez", color: "#f59e0b", unit: "NTU" },
  ammonia: { name: "Amonio", color: "#06b6d4", unit: "mg/L" },
  nitrates: { name: "Nitratos", color: "#ec4899", unit: "mg/L" },
  nitrites: { name: "Nitritos", color: "#84cc16", unit: "mg/L" },
  phosphates: { name: "Fosfatos", color: "#f97316", unit: "mg/L" },
  alkalinity: { name: "Alcalinidad", color: "#6366f1", unit: "mg/L" },
  hardness: { name: "Dureza", color: "#14b8a6", unit: "mg/L" },
  conductivity: { name: "Conductividad", color: "#a855f7", unit: "µS/cm" },
}

export function getParameterName(parameter: string): string {
  return PARAMETER_CONFIG[parameter]?.name || parameter
}

export function getParameterColor(parameter: string): string {
  return PARAMETER_CONFIG[parameter]?.color || "#6b7280"
}

export function getParameterUnit(parameter: string): string {
  return PARAMETER_CONFIG[parameter]?.unit || ""
}

export function formatParameterValue(value: number, parameter: string): string {
  const unit = getParameterUnit(parameter)
  return `${value.toFixed(2)} ${unit}`.trim()
}

export function isParameterOutOfRange(
  value: number,
  parameter: string,
  optimalMin?: number,
  optimalMax?: number,
): boolean {
  if (!optimalMin || !optimalMax) return false
  return value < optimalMin || value > optimalMax
}

// Función para suavizar datos usando media móvil
export function smoothData<T extends { value: number }>(data: T[], windowSize = 3): T[] {
  if (data.length <= windowSize) return data

  const smoothedData = [...data]

  for (let i = Math.floor(windowSize / 2); i < data.length - Math.floor(windowSize / 2); i++) {
    const start = i - Math.floor(windowSize / 2)
    const end = i + Math.floor(windowSize / 2) + 1
    const window = data.slice(start, end)

    const sum = window.reduce((acc, item) => acc + item.value, 0)
    const average = sum / window.length

    smoothedData[i] = { ...data[i], value: average }
  }

  return smoothedData
}

// Función para calcular dominio inteligente del eje Y
export function calculateYAxisDomain(
  data: number[],
  optimalMin?: number,
  optimalMax?: number,
  rangeMin?: number,
  rangeMax?: number,
): [number, number] {
  if (data.length === 0) return [0, 100]

  const dataMin = Math.min(...data)
  const dataMax = Math.max(...data)

  // Si tenemos rangos óptimos, usarlos como referencia
  let domainMin = dataMin
  let domainMax = dataMax

  if (optimalMin !== undefined && optimalMax !== undefined) {
    // Expandir el dominio para incluir el rango óptimo con margen
    const optimalRange = optimalMax - optimalMin
    const margin = optimalRange * 0.2 // 20% de margen

    domainMin = Math.min(dataMin, optimalMin - margin)
    domainMax = Math.max(dataMax, optimalMax + margin)
  } else {
    // Sin rango óptimo, usar margen basado en los datos
    const dataRange = dataMax - dataMin
    const margin = Math.max(dataRange * 0.1, 1) // Mínimo 10% o 1 unidad

    domainMin = dataMin - margin
    domainMax = dataMax + margin
  }

  // Respetar límites absolutos si están definidos
  if (rangeMin !== undefined) domainMin = Math.max(domainMin, rangeMin)
  if (rangeMax !== undefined) domainMax = Math.min(domainMax, rangeMax)

  return [Math.round(domainMin * 100) / 100, Math.round(domainMax * 100) / 100]
}

// Función para reducir densidad de datos si es necesaria
export function reduceDataDensity<T extends { timestamp: string }>(data: T[], maxPoints = 200): T[] {
  if (data.length <= maxPoints) return data

  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, index) => index % step === 0)
}

// Función para formatear fecha y hora en español
export function formatDateTime(date: Date): { date: string; time: string } {
  const dateStr = date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const timeStr = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return {
    date: dateStr,
    time: `${timeStr} hrs`,
  }
}
