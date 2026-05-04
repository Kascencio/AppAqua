"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { backendApi } from "@/lib/backend-client"
import type { SensorInstalado } from "@/types"

export interface SensorCompleto extends SensorInstalado {
  id?: string | number
  name: string
  type: string
  tipoMedida?: string
  unit: string
  modelo?: string
  marca?: string
  rango_medicion?: string
  branchId: string | number
  branchName: string
  facilityId?: string | number
  facilityName: string
  status: "active" | "inactive" | "alert" | "offline" | "maintenance"
  currentParameter?: string
  lastReading?: number
  lastUpdated?: Date
  notes?: string
  parameters?: string[]
  location?: string
}

const SENSORS_CACHE_TTL_MS = 20_000
const SENSORS_REFRESH_INTERVAL_MS = 30_000

let sharedSensorsCache: SensorCompleto[] | null = null
let sharedSensorsFetchedAt = 0
let sharedSensorsLastUpdated: Date | null = null
let sharedInflightFetch: Promise<SensorCompleto[]> | null = null
let sharedSensorsSignature = ""

function cloneData<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

function buildSensorsSignature(sensors: SensorCompleto[]): string {
  return sensors
    .map((s) => {
      const rawType = s.tipoMedida || s.type || ""
      return `${s.id_sensor_instalado}|${s.id_instalacion}|${rawType}|${s.unit}|${s.status}|${s.branchId}|${s.facilityName}`
    })
    .join(";")
}

function detectType(name: string, rawType?: string, unit?: string): string {
  const t = String(rawType || "").toLowerCase()
  const u = String(unit || "").toLowerCase()
  if (t.includes("ph") || t.includes("potencial") || t.includes("hidrogeno") || t.includes("hidrógeno")) return "ph"
  if (t.includes("temp") || t.includes("temperatura")) return "temperature"
  if (t.includes("ox") || t.includes("oxígeno") || t.includes("oxigeno") || t.includes("oxygen") || t.includes("o2")) return "oxygen"
  if (t.includes("sal") || t.includes("salinidad")) return "salinity"
  if (t.includes("turb") || t.includes("turbidez")) return "turbidity"
  if (t.includes("nitrat") || t.includes("nitrato")) return "nitrates"
  if (t.includes("amon") || t.includes("ammo") || t.includes("amoniaco") || t.includes("amoníaco")) return "ammonia"
  if (t.includes("baro") || t.includes("presión") || t.includes("presion")) return "barometric"
  if (u.includes("ph")) return "ph"
  if (u.includes("°c") || u.includes("c")) return "temperature"
  if (u.includes("mg/l") && (name || "").toLowerCase().includes("ox")) return "oxygen"
  if (u.includes("ppt")) return "salinity"
  if (u.includes("ntu")) return "turbidity"
  if (u.includes("hpa")) return "barometric"
  const n = (name || "").toLowerCase()
  if (n.includes("ph") || n.includes("potencial") || n.includes("hidrogeno") || n.includes("hidrógeno")) return "ph"
  if (n.includes("temp") || n.includes("temperatura")) return "temperature"
  if (n.includes("ox") || n.includes("oxígeno") || n.includes("oxigeno") || n.includes("oxygen") || n.includes("o2")) return "oxygen"
  if (n.includes("sal") || n.includes("salinidad")) return "salinity"
  if (n.includes("turb") || n.includes("turbidez")) return "turbidity"
  if (n.includes("nitrat") || n.includes("nitrato")) return "nitrates"
  if (n.includes("amon") || n.includes("ammo") || n.includes("amoniaco") || n.includes("amoníaco")) return "ammonia"
  if (n.includes("baro") || n.includes("presión") || n.includes("presion")) return "barometric"
  return "other"
}

function parseBackendStatus(rawStatus: unknown, activoFlag: unknown): SensorCompleto["status"] {
  const normalized = String(rawStatus ?? "").toLowerCase()
  if (normalized === "maintenance" || normalized === "mantenimiento") return "maintenance"
  if (normalized === "inactive" || normalized === "inactivo") return "inactive"
  if (normalized === "alert" || normalized === "alerta") return "alert"
  if (normalized === "offline" || normalized === "desconectado") return "offline"
  if (activoFlag === false) return "inactive"
  return "active"
}

function mapSensorsFast(sensores: any[], instalaciones: any[]): SensorCompleto[] {
  const instalacionById = new Map<number, any>(
    instalaciones
      .map((inst) => [Number(inst.id_instalacion ?? 0), inst] as [number, any])
      .filter(([id]) => Number(id) > 0),
  )

  const sucursalNombreById = new Map<number, string>(
    instalaciones
      .map((inst) => [
        Number(inst.id_organizacion_sucursal ?? inst.id_empresa_sucursal ?? inst.id_sucursal ?? 0),
        String(inst.sucursal_nombre ?? inst.nombre_empresa ?? inst.nombre_organizacion ?? ""),
      ] as [number, string])
      .filter(([id, name]) => Number(id) > 0 && !!name),
  )

  return sensores.map((s) => {
    const inst = (s as any).instalacion
    const catalogo = (s as any).catalogo_sensores
    const latestReading = Array.isArray((s as any).lectura) ? (s as any).lectura[0] : undefined
    const latestReadingValue = Number((s as any).valor_actual ?? latestReading?.valor)
    const rawInstalacionId = s.id_instalacion ?? inst?.id_instalacion ?? null
    const instalacionId = rawInstalacionId == null ? 0 : Number(rawInstalacionId)
    const instalacionDetalle = instalacionById.get(instalacionId)
    const branchIdNum = Number(
      inst?.id_sucursal ??
        inst?.id_organizacion_sucursal ??
        instalacionDetalle?.id_organizacion_sucursal ??
        (s as any).id_sucursal ??
        0,
    )
    const rawType = String((s as any).tipo_medida ?? (s as any).tipo ?? catalogo?.tipo_medida ?? catalogo?.tipo ?? "")
    const unit = String(catalogo?.unidad_medida ?? s.unidad_medida ?? "")
    const sensorName = String(catalogo?.nombre ?? s.descripcion ?? `Sensor ${s.id_sensor_instalado}`)
    const status = parseBackendStatus((s as any).status ?? (s as any).estado_visual ?? (s as any).estado_operativo, (s as any).activo)
    const hasInstallation = instalacionId > 0

    return {
      id_sensor_instalado: s.id_sensor_instalado,
      id_instalacion: instalacionId,
      id_sensor: Number((s as any).id_sensor ?? catalogo?.id_sensor ?? 0),
      fecha_instalada: String((s as any).fecha_instalada ?? (s as any).created_at ?? ""),
      descripcion: String((s as any).descripcion ?? catalogo?.descripcion ?? ""),
      name: sensorName,
      type: detectType(sensorName, rawType, unit),
      tipoMedida: rawType || undefined,
      unit,
      modelo: catalogo?.modelo ?? undefined,
      marca: catalogo?.marca ?? undefined,
      rango_medicion: catalogo?.rango_medicion ?? undefined,
      branchId: hasInstallation ? String(branchIdNum || "") : "",
      branchName: hasInstallation
        ? (String(instalacionDetalle?.sucursal_nombre ?? "") || sucursalNombreById.get(branchIdNum) || `Sucursal ${branchIdNum || ""}`)
        : "Sin sucursal",
      facilityId: hasInstallation ? String(instalacionId) : "",
      facilityName: hasInstallation
        ? String(
            (s as any).instalacion_nombre ??
              inst?.nombre_instalacion ??
              instalacionDetalle?.nombre_instalacion ??
              inst?.nombre ??
              instalacionDetalle?.nombre ??
              `Instalación ${instalacionId}`,
          )
        : "Sin instalación",
      status,
      currentParameter: rawType || undefined,
      lastReading: Number.isFinite(latestReadingValue) ? latestReadingValue : undefined,
      lastUpdated: (s as any).ultima_lectura_at ? new Date((s as any).ultima_lectura_at) : undefined,
    }
  })
}

async function fetchSensorsFromApi(): Promise<SensorCompleto[]> {
  const [sensoresResp, instalacionesResp] = await Promise.all([
    backendApi.getSensoresInstalados({ page: 1, limit: 1000 }).catch(() => [] as any),
    backendApi.getInstalaciones({ page: 1, limit: 1000 }).catch(() => [] as any),
  ])

  const sensoresPayload: any = sensoresResp
  const sensores: any[] = Array.isArray(sensoresPayload) ? sensoresPayload : sensoresPayload?.data || []

  const instalacionesPayload: any = instalacionesResp
  const instalaciones: any[] = Array.isArray(instalacionesPayload) ? instalacionesPayload : instalacionesPayload?.data || []

  return mapSensorsFast(sensores, instalaciones)
}

export function useSensors() {
  const [sensors, setSensors] = useState<SensorCompleto[]>(() => cloneData(sharedSensorsCache || []))
  const [loading, setLoading] = useState(() => sharedSensorsCache === null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(sharedSensorsLastUpdated)
  const localSignatureRef = useRef(
    Array.isArray(sharedSensorsCache) && sharedSensorsCache.length > 0
      ? buildSensorsSignature(sharedSensorsCache)
      : "",
  )

  const fetchSensors = useCallback(async (force = false) => {
    if (sharedSensorsCache && !sharedSensorsSignature) {
      sharedSensorsSignature = buildSensorsSignature(sharedSensorsCache)
    }

    const now = Date.now()
    const hasFreshCache =
      !force &&
      Array.isArray(sharedSensorsCache) &&
      sharedSensorsCache.length >= 0 &&
      now - sharedSensorsFetchedAt < SENSORS_CACHE_TTL_MS

    if (hasFreshCache && sharedSensorsCache) {
      if (localSignatureRef.current !== sharedSensorsSignature) {
        setSensors(cloneData(sharedSensorsCache))
        localSignatureRef.current = sharedSensorsSignature
      }
      setLastUpdated(sharedSensorsLastUpdated)
      setLoading(false)
      setError(null)
      return
    }

    if (sharedInflightFetch) {
      try {
        const next = await sharedInflightFetch
        const signature = buildSensorsSignature(next)
        if (localSignatureRef.current !== signature) {
          setSensors(cloneData(next))
          localSignatureRef.current = signature
        }
        setLastUpdated(sharedSensorsLastUpdated)
        setError(null)
      } catch {
        setError("Error al cargar sensores")
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(sharedSensorsCache === null)
    setError(null)

    sharedInflightFetch = fetchSensorsFromApi()

    try {
      const mapped = await sharedInflightFetch
      const signature = buildSensorsSignature(mapped)
      sharedSensorsCache = cloneData(mapped)
      sharedSensorsSignature = signature
      sharedSensorsFetchedAt = Date.now()
      sharedSensorsLastUpdated = new Date()

      if (localSignatureRef.current !== signature) {
        setSensors(cloneData(mapped))
        localSignatureRef.current = signature
      }
      setLastUpdated(sharedSensorsLastUpdated)
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Error al cargar sensores")
      if (sharedSensorsCache) {
        if (localSignatureRef.current !== sharedSensorsSignature) {
          setSensors(cloneData(sharedSensorsCache))
          localSignatureRef.current = sharedSensorsSignature
        }
      }
    } finally {
      sharedInflightFetch = null
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSensors()
    const refreshIfVisible = () => {
      if (typeof document !== "undefined" && document.hidden) return
      if (typeof navigator !== "undefined" && navigator.onLine === false) return
      fetchSensors()
    }
    const id = setInterval(() => {
      refreshIfVisible()
    }, SENSORS_REFRESH_INTERVAL_MS)
    document.addEventListener("visibilitychange", refreshIfVisible)
    window.addEventListener("online", refreshIfVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", refreshIfVisible)
      window.removeEventListener("online", refreshIfVisible)
    }
  }, [fetchSensors])

  const createSensor = useCallback(
    async (sensorData: Omit<SensorCompleto, "id_sensor_instalado" | "fecha_instalada">) => {
      setLoading(true)
      setError(null)
      try {
        const idInstalacion = Number(sensorData.id_instalacion)
        const payload = {
          id_instalacion: Number.isFinite(idInstalacion) && idInstalacion > 0 ? idInstalacion : null,
          tipo_medida: sensorData.type || sensorData.descripcion,
          unidad_medida: sensorData.unit || "",
          ubicacion: sensorData.location,
          activo: true,
        }
        const res = await backendApi.createSensorInstalado(payload as any)
        sharedSensorsFetchedAt = 0
        await fetchSensors(true)
        return (res as any).data
      } catch (err) {
        setError("Error al crear sensor")
        throw err
      } finally {
        setLoading(false)
      }
    },
    [fetchSensors],
  )

  const updateSensor = useCallback(
    async (updatedSensor: Partial<SensorCompleto> & { id_sensor_instalado: number }) => {
      setLoading(true)
      setError(null)
      try {
        const payload: any = {}
        if (updatedSensor.type) payload.tipo_medida = updatedSensor.type
        if (updatedSensor.unit) payload.unidad_medida = updatedSensor.unit
        if (updatedSensor.status) {
          if (updatedSensor.status === "maintenance") payload.status = "maintenance"
          else payload.activo = updatedSensor.status !== "inactive" && updatedSensor.status !== "offline"
        }
        if (updatedSensor.facilityId !== undefined) {
          const facilityId = Number(updatedSensor.facilityId)
          payload.id_instalacion = Number.isFinite(facilityId) && facilityId > 0 ? facilityId : null
        }
        await backendApi.updateSensorInstalado(updatedSensor.id_sensor_instalado, payload)
        sharedSensorsFetchedAt = 0
        await fetchSensors(true)
      } catch (err) {
        setError("Error al actualizar sensor")
        throw err
      } finally {
        setLoading(false)
      }
    },
    [fetchSensors],
  )

  const deleteSensor = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await backendApi.deleteSensorInstalado(id)
      setSensors((prev) => {
        const next = prev.filter((s) => s.id_sensor_instalado !== id)
        localSignatureRef.current = buildSensorsSignature(next)
        return next
      })
      if (sharedSensorsCache) {
        sharedSensorsCache = sharedSensorsCache.filter((s) => s.id_sensor_instalado !== id)
        sharedSensorsSignature = buildSensorsSignature(sharedSensorsCache)
      }
      sharedSensorsFetchedAt = Date.now()
    } catch (err) {
      setError("Error al eliminar sensor")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getSensorById = useCallback(
    (id: number) => {
      return sensors.find((sensor) => sensor.id_sensor_instalado === id)
    },
    [sensors],
  )

  const getSensorsByInstallation = useCallback(
    (instalacionId: number) => {
      return sensors.filter((sensor) => sensor.id_instalacion === instalacionId)
    },
    [sensors],
  )

  return {
    sensors,
    loading,
    error,
    lastUpdated,
    createSensor,
    updateSensor,
    deleteSensor,
    getSensorById,
    getSensorsByInstallation,
    refetch: () => fetchSensors(true),
  }
}

export type Sensor = SensorCompleto
