"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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

const FACILITY_SENSORS_TTL_MS = 20_000
const facilitySensorsCache = new Map<number, { expiresAt: number; data: BackendSensorInstalado[] }>()
const facilitySensorsInflight = new Map<number, Promise<BackendSensorInstalado[]>>()

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

async function getFacilitySensors(facilityNum: number): Promise<BackendSensorInstalado[]> {
  const now = Date.now()
  const cached = facilitySensorsCache.get(facilityNum)
  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  const inflight = facilitySensorsInflight.get(facilityNum)
  if (inflight) {
    return inflight
  }

  const request = (async () => {
    const sensoresResp = await backendApi.getSensoresInstalados({
      id_instalacion: facilityNum,
      page: 1,
      limit: 1000,
    })
    const sensores = normalizeListPayload<BackendSensorInstalado>(sensoresResp as any)
    facilitySensorsCache.set(facilityNum, {
      expiresAt: Date.now() + FACILITY_SENSORS_TTL_MS,
      data: sensores,
    })
    return sensores
  })()

  facilitySensorsInflight.set(facilityNum, request)
  try {
    return await request
  } finally {
    facilitySensorsInflight.delete(facilityNum)
  }
}

function areReadingsEquivalent(prev: SensorReading[], next: SensorReading[]): boolean {
  if (prev === next) return true
  if (prev.length !== next.length) return false
  if (prev.length === 0) return true

  const checkpoints = [0, Math.floor(prev.length / 2), prev.length - 1]
  for (const index of checkpoints) {
    const a = prev[index]
    const b = next[index]
    if (!a || !b) return false
    if (a.id !== b.id) return false
    if (a.sensorId !== b.sensorId) return false
    if (a.parameter !== b.parameter) return false
    if (a.value !== b.value) return false
    if (a.isOutOfRange !== b.isOutOfRange) return false
    if (a.timestamp.getTime() !== b.timestamp.getTime()) return false
  }

  return true
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
    let cancelled = false

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
        const sensores = await getFacilitySensors(facilityNum)

        const desired = normalizeParameterKey(parameter)
        const sensoresFiltrados = sensores.filter((s) => normalizeParameterKey((s as any).tipo_medida || "") === desired)

        const bucketMinutes = computeBucketMinutes(dateRange.from, dateRange.to, 200)

        const sensorIds = sensoresFiltrados.map((s) => Number(s.id_sensor_instalado)).filter((id) => Number.isFinite(id) && id > 0)
        const batch = sensorIds.length > 0
          ? await backendApi.getPromediosBatch({
              sensorInstaladoIds: sensorIds,
              bucketMinutes,
              desde: dateRange.from.toISOString(),
              hasta: dateRange.to.toISOString(),
            })
          : { sensores: [] }

        const mapped: SensorDataPoint[] = (batch as any).sensores
          .flatMap((sensor: any) => Array.isArray(sensor.puntos) ? sensor.puntos : [])
          .map((p: BackendPromedio) => promedioToPoint(p))
          .filter(Boolean) as SensorDataPoint[]

        const filtered = mapped.filter((d) => {
          const t = new Date(d.timestamp).getTime()
          return t >= dateRange.from.getTime() && t <= dateRange.to.getTime()
        })

        if (cancelled) return
        setChartData(filtered)
      } catch {
        if (cancelled) return
        setError("Error al obtener datos del parámetro")
        setChartData([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
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
  const requestSeqRef = useRef(0)

  const fetchData = useCallback(async () => {
    if (!facilityId) {
      // No hacer nada si no hay facilityId
      return
    }
    const requestId = ++requestSeqRef.current
    setLoading(true)
    setError(null)
    try {
      const facilityNum = Number(facilityId)
      const sensores = await getFacilitySensors(facilityNum)

      const desiredKeys = (parameters || []).map(normalizeParameterKey)

      const fromDate = from || new Date(Date.now() - 24 * 60 * 60 * 1000)
      const toDate = to || new Date()
      const bucketMinutes = computeBucketMinutes(fromDate, toDate, 200)

      const sensorIds = sensores.map((s) => Number(s.id_sensor_instalado)).filter((id) => Number.isFinite(id) && id > 0)
      const sensorById = new Map(sensores.map((s) => [Number(s.id_sensor_instalado), s]))
      const batch = sensorIds.length > 0
        ? await backendApi.getPromediosBatch({
            sensorInstaladoIds: sensorIds,
            bucketMinutes,
            desde: fromDate.toISOString(),
            hasta: toDate.toISOString(),
          })
        : { sensores: [] }

      const flattened = (batch as any).sensores.flatMap((sensor: any) => {
        const s = sensorById.get(Number(sensor.id_sensor_instalado))
        if (!s) return []
        return (Array.isArray(sensor.puntos) ? sensor.puntos : []).map((p: BackendPromedio) => ({ p, s }))
      })

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
          return null
        })
        .filter((r: SensorReading | null): r is SensorReading => r !== null)
        .filter((r: SensorReading) => {
          const timestamp = r.timestamp.getTime()
          if (timestamp < fromDate.getTime() || timestamp > toDate.getTime()) return false
          if (sensorId && r.sensorId !== String(sensorId)) return false
          if (desiredKeys.length > 0 && !desiredKeys.includes(r.parameter)) return false
          return true
        })

      if (requestId === requestSeqRef.current) {
        setReadings((prev) => (areReadingsEquivalent(prev, mapped) ? prev : mapped))
      }
    } catch {
      if (requestId === requestSeqRef.current) {
        setError("Error al obtener datos de sensores")
      }
    } finally {
      if (requestId === requestSeqRef.current) {
        setLoading(false)
        setLastUpdated(new Date())
      }
    }
  }, [facilityId, from, to, parameters, sensorId])

  // Solo ejecutar efectos si hay facilityId
  useEffect(() => {
    if (!facilityId) return
    fetchData()
  }, [fetchData, facilityId])

  useEffect(() => {
    if (!facilityId || !refreshInterval || refreshInterval <= 0) return
    const fetchIfVisible = () => {
      if (typeof document !== "undefined" && document.hidden) return
      if (typeof navigator !== "undefined" && navigator.onLine === false) return
      fetchData()
    }
    const interval = setInterval(fetchIfVisible, refreshInterval)
    document.addEventListener("visibilitychange", fetchIfVisible)
    window.addEventListener("online", fetchIfVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", fetchIfVisible)
      window.removeEventListener("online", fetchIfVisible)
    }
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
        const items = await getFacilitySensors(facilityNum)
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
