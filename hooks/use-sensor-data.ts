"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

interface SensorDataPoint {
  timestamp: string
  value: number
  status: "normal" | "warning" | "critical"
}

interface SensorReading {
  id: string
  sensorId: string
  parameter: string
  value: number
  unit: string
  timestamp: Date
  isOutOfRange: boolean
  location?: string
}

interface UseSensorDataOptions {
  from?: Date
  to?: Date
  parameters?: string[]
  refreshInterval?: number
  sensorId?: string
}

// Hook para datos de un sensor
export function useSensorData(sensorId: string, from: Date, to: Date) {
  const [data, setData] = useState<SensorDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/lecturas?sensor=${sensorId}&from=${from.toISOString()}&to=${to.toISOString()}`)
      .then(res => {
        if (!res.ok) throw new Error("Error al obtener datos del sensor")
        return res.json()
      })
      .then(setData)
      .catch(() => setError("Error al obtener datos del sensor"))
      .finally(() => setLoading(false))
  }, [sensorId, from, to])

  return { data, loading, error }
}

// Hook para obtener datos de un parámetro específico
export function useSensorParameterData(facilityId: string, parameter: string, dateRange: { from: Date; to: Date }) {
  const [chartData, setChartData] = useState<SensorDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!facilityId || !parameter || !dateRange.from || !dateRange.to) {
      setChartData([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    fetch(`/api/lecturas?instalacion=${facilityId}&parametro=${parameter}&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`)
      .then(res => {
        if (!res.ok) throw new Error("Error al obtener datos del parámetro")
        return res.json()
      })
      .then(setChartData)
      .catch(() => setError("Error al obtener datos del parámetro"))
      .finally(() => setLoading(false))
  }, [facilityId, parameter, dateRange.from, dateRange.to])

  return { chartData, loading, error }
}

// Hook para múltiples sensores
export function useSensorDataMultiple(facilityId: string | null, options: UseSensorDataOptions = {}) {
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { from, to, parameters, refreshInterval = 30000, sensorId } = options

  const fetchData = useCallback(async () => {
    if (!facilityId) {
      // No hacer nada si no hay facilityId
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/lecturas?instalacion=${facilityId}&from=${from?.toISOString()}&to=${to?.toISOString()}`)
      if (!res.ok) throw new Error("Error al obtener datos de sensores")
      const data = await res.json()
      setReadings((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev
        return data
      })
    } catch {
      setError("Error al obtener datos de sensores")
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
    }
  }, [facilityId, from, to, parameters, sensorId])

  // Solo ejecutar efectos si hay facilityId
  useEffect(() => {
    if (!facilityId) return
    fetchData()
  }, [fetchData, facilityId])

  useEffect(() => {
    if (!facilityId || !refreshInterval || refreshInterval <= 0) return
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchData, refreshInterval, facilityId])

  const chartData = useMemo(() => {
    return readings.map((reading) => ({
      timestamp: reading.timestamp.toISOString(),
      value: reading.value,
      status: reading.isOutOfRange ? "critical" : ("normal" as "normal" | "warning" | "critical"),
    }))
  }, [readings])

  return {
    readings,
    chartData,
    loading,
    error,
    lastUpdated,
    refresh: fetchData,
  }
}

// Hook para obtener configuración de sensores de una instalación
export function useFacilitySensors(facilityId: string) {
  return useMemo(() => {
    // TODO: Llamar a la API real para obtener configuración de sensores
    // fetch(`/api/instalaciones/${facilityId}/sensores`)
    //   .then(res => res.json())
    //   .then(...)
    return []
  }, [facilityId])
}

export { useSensorDataMultiple as useMultipleSensorData }
