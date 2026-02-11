"use client"

import { useState, useEffect, useCallback } from "react"
import { backendApi } from "@/lib/backend-client"
import type { SensorInstalado } from "@/types"

export interface SensorCompleto extends SensorInstalado {
  id?: string | number // Alias for id_sensor_instalado
  name: string
  type: string
  /** Tipo de medida tal como viene desde la BD/API (source-of-truth). */
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

export function useSensors() {
  const [sensors, setSensors] = useState<SensorCompleto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Listar sensores
  const fetchSensors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // El backend externo devuelve LISTAS como arrays (no paginadas).
      // Además, /sensores-instalados incluye `instalacion` y `catalogo_sensores` embebidos.
      const [sensoresResp, sucursalesResp] = await Promise.all([
        backendApi.getSensoresInstalados({ page: 1, limit: 1000 }).catch(() => [] as any),
        backendApi.getSucursales({ page: 1, limit: 1000 }).catch(() => [] as any),
      ])

      const sensoresPayload: any = sensoresResp
      const sensores: any[] = Array.isArray(sensoresPayload) ? sensoresPayload : (sensoresPayload?.data || [])

      const sucursalesPayload: any = sucursalesResp
      const sucursales: any[] = Array.isArray(sucursalesPayload) ? sucursalesPayload : (sucursalesPayload?.data || [])

      const sucursalNombreById = new Map<number, string>(
        sucursales
          .map((s) => [
            Number(s.id_sucursal ?? s.id_organizacion_sucursal ?? 0),
            String(s.nombre ?? s.nombre_sucursal ?? ""),
          ] as [number, string])
          .filter(([id, name]) => Number(id) > 0 && !!name),
      )

      const lecturaTimestamp = (l: any): string | null => {
        const ts = l?.tomada_en || (l?.fecha && l?.hora ? `${l.fecha}T${l.hora}` : l?.created_at) || l?.fecha
        if (!ts) return null
        const d = new Date(ts)
        return Number.isNaN(d.getTime()) ? null : d.toISOString()
      }

      // Traer SOLO la última lectura de cada sensor (limit=1, ordenado desc) para acelerar
      const now = new Date()
      const desde = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const hasta = now.toISOString()

      const lecturasBySensorId = new Map<number, any>()

      // Usar concurrencia limitada para no saturar
      const sensorsChunks: any[][] = []
      for (let i = 0; i < sensores.length; i += 5) {
        sensorsChunks.push(sensores.slice(i, i + 5))
      }

      for (const chunk of sensorsChunks) {
        await Promise.all(
          chunk.map(async (s) => {
            const sensorInstaladoId = Number(s.id_sensor_instalado)
            if (!sensorInstaladoId) return
            try {
              // Solo pedir 1 lectura (la más reciente) para acelerar
              const resp = await backendApi.getLecturas({
                sensorInstaladoId,
                page: 1,
                limit: 1,
                desde,
                hasta,
              })
              const payload: any = resp
              const rows: any[] = Array.isArray(payload) ? payload : payload?.data || []
              if (!rows.length) return

              const lastRow = rows[0]
              const ts = lecturaTimestamp(lastRow)
              if (lastRow && ts) {
                lecturasBySensorId.set(sensorInstaladoId, { ...lastRow, __ts: ts })
              }
            } catch {
              // Si falla, dejamos sin lectura para ese sensor
            }
          }),
        )
      }
      // Note: We might need a better way to get readings in bulk or per sensor from the new API
      // For now, let's skip the readings fetch or assume we can get them differently
      // The original code fetched from /api/lecturas which was a local route.
      // We need to check if there is an endpoint for readings in the new API.
      // Based on previous context, there is no explicit bulk readings endpoint mentioned, 
      // but let's assume we can fetch them or leave them empty for now to avoid breaking.

      const detectType = (name: string, rawType?: string, unit?: string): string => {
        const t = String(rawType || '').toLowerCase()
        const u = String(unit || '').toLowerCase()
        if (t.includes('ph') || t.includes('potencial') || t.includes('hidrogeno') || t.includes('hidrógeno')) return 'ph'
        if (t.includes('temp') || t.includes('temperatura')) return 'temperature'
        if (t.includes('ox') || t.includes('oxígeno') || t.includes('oxigeno') || t.includes('oxygen') || t.includes('o2')) return 'oxygen'
        if (t.includes('sal') || t.includes('salinidad')) return 'salinity'
        if (t.includes('turb') || t.includes('turbidez')) return 'turbidity'
        if (t.includes('nitrat') || t.includes('nitrato')) return 'nitrates'
        if (t.includes('amon') || t.includes('ammo') || t.includes('amoniaco') || t.includes('amoníaco')) return 'ammonia'
        if (t.includes('baro') || t.includes('presión') || t.includes('presion')) return 'barometric'
        if (t.includes('sal')) return 'salinity'
        if (t.includes('turb')) return 'turbidity'
        if (t.includes('nitrat')) return 'nitrates'
        if (t.includes('amon') || t.includes('ammo')) return 'ammonia'
        if (t.includes('baro') || t.includes('presión')) return 'barometric'
        if (u.includes('ph')) return 'ph'
        if (u.includes('°c') || u.includes('c')) return 'temperature'
        if (u.includes('mg/l') && (name || '').toLowerCase().includes('ox')) return 'oxygen'
        if (u.includes('ppt')) return 'salinity'
        if (u.includes('ntu')) return 'turbidity'
        if (u.includes('hpa')) return 'barometric'
        const n = (name || '').toLowerCase()
        if (n.includes('ph') || n.includes('potencial') || n.includes('hidrogeno') || n.includes('hidrógeno')) return 'ph'
        if (n.includes('temp') || n.includes('temperatura')) return 'temperature'
        if (n.includes('ox') || n.includes('oxígeno') || n.includes('oxigeno') || n.includes('oxygen') || n.includes('o2')) return 'oxygen'
        if (n.includes('sal') || n.includes('salinidad')) return 'salinity'
        if (n.includes('turb') || n.includes('turbidez')) return 'turbidity'
        if (n.includes('nitrat') || n.includes('nitrato')) return 'nitrates'
        if (n.includes('amon') || n.includes('ammo') || n.includes('amoniaco') || n.includes('amoníaco')) return 'ammonia'
        if (n.includes('baro') || n.includes('presión') || n.includes('presion')) return 'barometric'
        return 'other'
      }

      const mapped: SensorCompleto[] = sensores.map((s) => {
        const inst = (s as any).instalacion
        const instalacionId = Number(s.id_instalacion ?? inst?.id_instalacion ?? 0)
        const lastRow = lecturasBySensorId.get(Number(s.id_sensor_instalado))

        // última lectura
        let last: number | undefined = undefined
        let lastDate: Date | undefined = undefined
        if (lastRow) {
          last = Number(lastRow.valor)
          const ts = (lastRow as any).__ts || lecturaTimestamp(lastRow)
          if (ts) lastDate = new Date(ts)
        }

        // determinar estado por activo del backend y recencia
        const nowTs = Date.now()
        const isRecent = lastDate ? (nowTs - lastDate.getTime()) <= 24 * 60 * 60 * 1000 : false
        const backendActive = (s as any).activo
        const status: SensorCompleto['status'] = backendActive === false ? 'inactive' : (isRecent ? 'active' : 'offline')

        const catalogo = (s as any).catalogo_sensores
        const sensorName = String(catalogo?.nombre ?? s.descripcion ?? `Sensor ${s.id_sensor_instalado}`)
        const rawType = String((s as any).tipo_medida ?? (s as any).tipo ?? catalogo?.tipo_medida ?? catalogo?.tipo ?? '')
        const unit = String(catalogo?.unidad_medida ?? s.unidad_medida ?? '')
        const branchIdNum = Number(inst?.id_sucursal ?? inst?.id_organizacion_sucursal ?? (s as any).id_sucursal ?? 0)

        return {
          // Keep legacy shape expected by the UI
          id_sensor_instalado: s.id_sensor_instalado,
          id_instalacion: instalacionId,
          id_sensor: Number((s as any).id_sensor ?? catalogo?.id_sensor ?? 0),
          fecha_instalada: String((s as any).fecha_instalada ?? (s as any).created_at ?? ''),
          descripcion: String((s as any).descripcion ?? catalogo?.descripcion ?? ''),
          name: sensorName,
          type: detectType(sensorName, rawType, unit),
          tipoMedida: rawType || undefined,
          unit,
          modelo: catalogo?.modelo ?? undefined,
          marca: catalogo?.marca ?? undefined,
          rango_medicion: catalogo?.rango_medicion ?? undefined,
          branchId: String(branchIdNum || ''),
          branchName: sucursalNombreById.get(branchIdNum) || `Sucursal ${branchIdNum || ''}`,
          facilityName: String(inst?.nombre_instalacion ?? inst?.nombre ?? `Instalación ${instalacionId}`),
          status,
          lastReading: last,
          lastUpdated: lastDate || undefined,
        }
      })

      setSensors(mapped)
      setLastUpdated(new Date())
    } catch (err) {
      console.error(err)
      setError("Error al cargar sensores")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSensors()
    // Actualización cada 30s
    const id = setInterval(fetchSensors, 30000)
    return () => clearInterval(id)
  }, [fetchSensors])

  // Crear sensor
  const createSensor = useCallback(async (sensorData: Omit<SensorCompleto, "id_sensor_instalado" | "fecha_instalada">) => {
    setLoading(true)
    setError(null)
    try {
      // Map to backend shape
      const payload = {
        id_instalacion: Number(sensorData.id_instalacion),
        tipo_medida: sensorData.type || sensorData.descripcion,
        unidad_medida: sensorData.unit || '',
        ubicacion: sensorData.location,
        activo: true,
      }
      const res = await backendApi.createSensorInstalado(payload as any)
      await fetchSensors()
      return res.data
    } catch (err) {
      setError("Error al crear sensor")
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchSensors])

  // Actualizar sensor
  const updateSensor = useCallback(async (updatedSensor: Partial<SensorCompleto> & { id_sensor_instalado: number }) => {
    setLoading(true)
    setError(null)
    try {
      const payload: any = {}
      if (updatedSensor.type) payload.tipo_medida = updatedSensor.type
      if (updatedSensor.unit) payload.unidad_medida = updatedSensor.unit
      if (updatedSensor.status) payload.activo = updatedSensor.status !== 'inactive'
      await backendApi.updateSensorInstalado(updatedSensor.id_sensor_instalado, payload)
      await fetchSensors()
    } catch (err) {
      setError("Error al actualizar sensor")
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchSensors])

  // Eliminar sensor
  const deleteSensor = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await backendApi.deleteSensorInstalado(id)
      setSensors((prev) => prev.filter((s) => s.id_sensor_instalado !== id))
    } catch (err) {
      setError("Error al eliminar sensor")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener sensor por ID
  const getSensorById = useCallback((id: number) => {
    return sensors.find((sensor) => sensor.id_sensor_instalado === id)
  }, [sensors])

  // Obtener sensores por instalación
  const getSensorsByInstallation = useCallback((instalacionId: number) => {
    return sensors.filter((sensor) => sensor.id_instalacion === instalacionId)
  }, [sensors])

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
    refetch: fetchSensors,
  }
}

export type Sensor = SensorCompleto
