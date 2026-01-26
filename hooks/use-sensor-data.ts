"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { backendApi, type Lectura as BackendLectura, type SensorInstalado as BackendSensorInstalado, type Promedio as BackendPromedio } from "@/lib/backend-client"

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

function computeBucketMinutes(from: Date, to: Date, targetPoints = 200): number {
  const totalMinutes = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 60000))
  const bucket = Math.ceil(totalMinutes / targetPoints)
  return Math.max(5, bucket)
}

function promedioToPoint(p: BackendPromedio): SensorDataPoint | null {
  const d = new Date(p.timestamp)
  if (isNaN(d.getTime())) return null
  return {
    timestamp: d.toISOString(),
    value: Number((p as any).promedio ?? 0),
    status: "normal",
  }
}

type FacilitySensorConfig = {
  parameter: string
  unit?: string
  optimal?: { min: number; max: number }
}

function normalizeParameterKey(raw: string): string {
  const n = (raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")

  if (n.includes("ph")) return "ph"
  if (n.includes("temp") || n.includes("temperatura")) return "temperature"
  if (n.includes("ox") || n.includes("oxigeno")) return "oxygen"
  if (n.includes("sal")) return "salinity"
  if (n.includes("turb")) return "turbidity"
  if (n.includes("amon")) return "ammonia"
  if (n.includes("nitrat")) return "nitrates"
  if (n.includes("nitrit")) return "nitrites"
  if (n.includes("fosf")) return "phosphates"
  if (n.includes("alcal")) return "alkalinity"
  if (n.includes("durez")) return "hardness"
  if (n.includes("conduct")) return "conductivity"
  return raw
}

function lecturaToDate(l: BackendLectura): Date {
  const raw = (l as any).tomada_en || (l as any).created_at || ((l as any).fecha && (l as any).hora ? `${(l as any).fecha}T${(l as any).hora}` : undefined)
  const d = raw ? new Date(raw) : new Date()
  return isNaN(d.getTime()) ? new Date() : d
}

function normalizeListPayload<T>(payload: any): T[] {
  return Array.isArray(payload) ? payload : (payload?.data || [])
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
    ;(async () => {
      try {
        const bucketMinutes = computeBucketMinutes(from, to, 200)
        const promedios = await backendApi
          .getPromedios({
            sensorInstaladoId: Number(sensorId),
            bucketMinutes,
            desde: from.toISOString(),
            hasta: to.toISOString(),
          })
          .catch(() => backendApi.getPromedios({ sensorInstaladoId: Number(sensorId), bucketMinutes }))
        const mapped: SensorDataPoint[] = (promedios as any[])
          .map((p) => promedioToPoint(p as BackendPromedio))
          .filter(Boolean) as SensorDataPoint[]

        const filtered = mapped.filter((d) => {
          const t = new Date(d.timestamp).getTime()
          return t >= from.getTime() && t <= to.getTime()
        })
        setData(filtered)
      } catch {
        try {
          const res = await backendApi.getLecturas({
            sensorInstaladoId: Number(sensorId),
            page: 1,
            limit: 5000,
            desde: from.toISOString(),
            hasta: to.toISOString(),
          })
          const lecturas = normalizeListPayload<BackendLectura>(res as any)
          const mapped: SensorDataPoint[] = lecturas.map((l) => ({
            timestamp: lecturaToDate(l).toISOString(),
            value: Number((l as any).valor ?? 0),
            status: "normal",
          }))
          setData(mapped)
        } catch {
          setError("Error al obtener datos del sensor")
          setData([])
        }
      } finally {
        setLoading(false)
      }
    })()
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
    ;(async () => {
      try {
        const facilityNum = Number(facilityId)
        const sensoresResp = await backendApi.getSensoresInstalados({ id_instalacion: facilityNum, page: 1, limit: 1000 })
        const sensores = normalizeListPayload<BackendSensorInstalado>(sensoresResp as any)

        const desired = normalizeParameterKey(parameter)
        const sensoresFiltrados = sensores.filter((s) => normalizeParameterKey((s as any).tipo_medida || "") === desired)

        const bucketMinutes = computeBucketMinutes(dateRange.from, dateRange.to, 200)

        const promediosArrays = await Promise.all(
          sensoresFiltrados.map(async (s) => {
            try {
              const resp = await backendApi.getPromedios({
                sensorInstaladoId: s.id_sensor_instalado,
                bucketMinutes,
                desde: dateRange.from.toISOString(),
                hasta: dateRange.to.toISOString(),
              }).catch(() => backendApi.getPromedios({ sensorInstaladoId: s.id_sensor_instalado, bucketMinutes }))
              return (resp as any[]).map((p) => ({ p, s }))
            } catch {
              const resp = await backendApi.getLecturas({
                sensorInstaladoId: s.id_sensor_instalado,
                page: 1,
                limit: 5000,
                desde: dateRange.from.toISOString(),
                hasta: dateRange.to.toISOString(),
              })
              return normalizeListPayload<BackendLectura>(resp as any).map((l) => ({ l, s }))
            }
          }),
        )

        const mapped: SensorDataPoint[] = promediosArrays
          .flat()
          .map((item: any) => {
            if (item.p) {
              const point = promedioToPoint(item.p as BackendPromedio)
              return point ? { ...point, status: "normal" } : null
            }
            if (item.l) {
              return {
                timestamp: lecturaToDate(item.l as BackendLectura).toISOString(),
                value: Number((item.l as any).valor ?? 0),
                status: "normal",
              }
            }
            return null
          })
          .filter(Boolean) as SensorDataPoint[]

        const filtered = mapped.filter((d) => {
          const t = new Date(d.timestamp).getTime()
          return t >= dateRange.from.getTime() && t <= dateRange.to.getTime()
        })

        setChartData(filtered)
      } catch {
        setError("Error al obtener datos del parámetro")
        setChartData([])
      } finally {
        setLoading(false)
      }
    })()
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
      const facilityNum = Number(facilityId)
      const sensoresResp = await backendApi.getSensoresInstalados({ id_instalacion: facilityNum, page: 1, limit: 1000 })
      const sensores = normalizeListPayload<BackendSensorInstalado>(sensoresResp as any)

      const desiredKeys = (parameters || []).map(normalizeParameterKey)

      const fromDate = from || new Date(Date.now() - 24 * 60 * 60 * 1000)
      const toDate = to || new Date()
      const bucketMinutes = computeBucketMinutes(fromDate, toDate, 200)

      const dataArrays = await Promise.all(
        sensores.map(async (s) => {
          try {
            const resp = await backendApi
              .getPromedios({
                sensorInstaladoId: s.id_sensor_instalado,
                bucketMinutes,
                desde: fromDate.toISOString(),
                hasta: toDate.toISOString(),
              })
              .catch(() => backendApi.getPromedios({ sensorInstaladoId: s.id_sensor_instalado, bucketMinutes }))
            return (resp as any[]).map((p) => ({ p, s }))
          } catch {
            const resp = await backendApi.getLecturas({
              sensorInstaladoId: s.id_sensor_instalado,
              page: 1,
              limit: 5000,
              desde: fromDate.toISOString(),
              hasta: toDate.toISOString(),
            })
            return normalizeListPayload<BackendLectura>(resp as any).map((l) => ({ l, s }))
          }
        }),
      )

      const flattened = dataArrays.flat()

      const mapped: SensorReading[] = flattened
        .map((item: any): SensorReading | null => {
          const s = item.s as BackendSensorInstalado
          if (item.p) {
            const point = promedioToPoint(item.p as BackendPromedio)
            if (!point) return null
            const parameterKey = normalizeParameterKey((s as any).tipo_medida || "")
            const timestamp = new Date(point.timestamp)
            return {
              id: `${s.id_sensor_instalado}-${point.timestamp}`,
              sensorId: String(s.id_sensor_instalado),
              parameter: parameterKey,
              value: point.value,
              unit: String((s as any).unidad_medida || ""),
              timestamp,
              isOutOfRange: false,
              location: (s as any).ubicacion || undefined,
            }
          }
          if (item.l) {
            const l = item.l as BackendLectura
            const sid = Number((l as any).id_sensor_instalado ?? (l as any).sensor_instalado_id ?? s.id_sensor_instalado)
            const parameterKey = normalizeParameterKey((l as any).tipo_medida || (s as any).tipo_medida || "")
            const timestamp = lecturaToDate(l)
            return {
              id: String((l as any).id_lectura ?? `${sid}-${timestamp.toISOString()}`),
              sensorId: String(sid),
              parameter: parameterKey,
              value: Number((l as any).valor ?? 0),
              unit: String((s as any).unidad_medida || ""),
              timestamp,
              isOutOfRange: false,
              location: (s as any).ubicacion || undefined,
            }
          }
          return null
        })
        .filter((r): r is SensorReading => r !== null)
        .filter((r) => {
          const timestamp = r.timestamp.getTime()
          if (timestamp < fromDate.getTime() || timestamp > toDate.getTime()) return false
          if (sensorId && r.sensorId !== String(sensorId)) return false
          if (desiredKeys.length > 0 && !desiredKeys.includes(r.parameter)) return false
          return true
        })

      setReadings((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev
        return mapped
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
  const [sensors, setSensors] = useState<FacilitySensorConfig[]>([])

  useEffect(() => {
    if (!facilityId) {
      setSensors([])
      return
    }

    ;(async () => {
      try {
        const facilityNum = Number(facilityId)
        const resp = await backendApi.getSensoresInstalados({ id_instalacion: facilityNum, page: 1, limit: 1000 })
        const items = normalizeListPayload<BackendSensorInstalado>(resp as any)
        const mapped = items
          .map((s) => ({
            parameter: normalizeParameterKey((s as any).tipo_medida || ""),
            unit: String((s as any).unidad_medida || ""),
          }))
          .filter((s) => Boolean(s.parameter))

        // Deduplicar por parámetro
        const uniq = Array.from(new Map(mapped.map((s) => [s.parameter, s])).values())
        setSensors(uniq)
      } catch {
        setSensors([])
      }
    })()
  }, [facilityId])

  return useMemo(() => sensors, [sensors])
}

export { useSensorDataMultiple as useMultipleSensorData }
