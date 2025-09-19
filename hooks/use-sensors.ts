"use client"

import { useState, useEffect, useCallback } from "react"
import type { SensorInstalado } from "@/types/sensor-instalado"

export interface SensorCompleto extends SensorInstalado {
  name: string
  type: string
  unit: string
  modelo?: string
  marca?: string
  rango_medicion?: string
  branchId: string
  branchName: string
  facilityName: string
  status: "active" | "inactive" | "alert" | "offline" | "maintenance"
  currentParameter?: string
  lastReading?: number
  lastUpdated?: Date
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
      // Obtener sensores instalados
      const [sensoresRes, catalogoRes, instalacionesRes, sucursalesRes] = await Promise.all([
        fetch("/api/sensores"),
        fetch("/api/catalogo-sensores"),
        fetch("/api/instalaciones"),
        fetch("/api/sucursales"),
      ])
      if (!sensoresRes.ok) throw new Error("Error al obtener sensores")
      if (!catalogoRes.ok) throw new Error("Error al obtener catálogo de sensores")
      if (!instalacionesRes.ok) throw new Error("Error al obtener instalaciones")
      const sensores: SensorInstalado[] = await sensoresRes.json()
      const catalogo: any[] = await catalogoRes.json()
      const instalaciones: any[] = await instalacionesRes.json()
      const sucursalesJson: any = await sucursalesRes.json()
      const sucursales: any[] = Array.isArray(sucursalesJson) ? sucursalesJson : []

      // Crear mapas auxiliares
      const catalogoById = new Map<number, any>(catalogo.map((c) => [c.id_sensor, c]))
      const instalacionesById = new Map<number, any>(instalaciones.map((i) => [i.id_instalacion, i]))
      const sucursalNombreById = new Map<number, string>(
        sucursales.map((s: any) => [s.id_empresa_sucursal, s.nombre])
      )

      // Para cada sensor, obtener su última lectura de resumen_lectura_horaria o lectura directa
      // Nota: simplificamos usando /api/lecturas?instalacion=... en rango de las últimas 6 horas
      const now = new Date()
      const from = new Date(now.getTime() - 6 * 60 * 60 * 1000)

      // Agrupar por instalación para minimizar requests
      const sensoresPorInstalacion = new Map<number, SensorInstalado[]>()
      for (const s of sensores) {
        const arr = sensoresPorInstalacion.get(s.id_instalacion) || []
        arr.push(s)
        sensoresPorInstalacion.set(s.id_instalacion, arr)
      }

      const lecturasPorInstalacion = new Map<number, any[]>()
      await Promise.all(
        Array.from(sensoresPorInstalacion.keys()).map(async (instId) => {
          const r = await fetch(`/api/lecturas?instalacion=${instId}&from=${from.toISOString()}&to=${now.toISOString()}`)
          if (r.ok) {
            lecturasPorInstalacion.set(instId, await r.json())
          } else {
            lecturasPorInstalacion.set(instId, [])
          }
        })
      )

      const detectType = (name: string): string => {
        const n = (name || '').toLowerCase()
        if (n.includes('ph')) return 'ph'
        if (n.includes('temp')) return 'temperature'
        if (n.includes('ox') || n.includes('oxígeno') || n.includes('oxygen')) return 'oxygen'
        if (n.includes('sal')) return 'salinity'
        if (n.includes('turb')) return 'turbidity'
        if (n.includes('nitrat')) return 'nitrates'
        if (n.includes('amon') || n.includes('ammo')) return 'ammonia'
        if (n.includes('baro') || n.includes('presión')) return 'barometric'
        return 'other'
      }

      const mapped: SensorCompleto[] = sensores.map((s) => {
        const cat = catalogoById.get(s.id_sensor)
        const inst = instalacionesById.get(s.id_instalacion)
        const lecturas = lecturasPorInstalacion.get(s.id_instalacion) || []
        const lecturasSensor = lecturas.filter((l) => l.id_sensor_instalado === s.id_sensor_instalado)
        // última lectura
        let last: number | undefined = undefined
        let lastDate: Date | undefined = undefined
        if (lecturasSensor.length > 0) {
          const lastRow = lecturasSensor.reduce((a, b) => (new Date(a.fecha) > new Date(b.fecha) ? a : b))
          last = Number(lastRow.valor)
          lastDate = new Date(lastRow.fecha)
        }

        // determinar estado por recencia
        const nowTs = Date.now()
        const isRecent = lastDate ? (nowTs - lastDate.getTime()) <= 10 * 60 * 1000 : false
        const status: SensorCompleto['status'] = isRecent ? 'active' : 'offline'

        return {
          ...s,
          name: cat?.sensor || s.descripcion,
          type: detectType(cat?.sensor || s.descripcion || ''),
          unit: cat?.unidad_medida || '',
          modelo: cat?.modelo,
          marca: cat?.marca,
          rango_medicion: cat?.rango_medicion,
          branchId: String(inst?.id_empresa_sucursal || ''),
          branchName: sucursalNombreById.get(inst?.id_empresa_sucursal) || `Sucursal ${inst?.id_empresa_sucursal || ''}`,
          facilityName: inst?.nombre_instalacion || `Instalación ${s.id_instalacion}`,
          status,
          lastReading: last,
          lastUpdated: lastDate || undefined,
        }
      })

      setSensors(mapped)
      setLastUpdated(new Date())
    } catch (err) {
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
      const res = await fetch("/api/sensores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sensorData),
      })
      if (!res.ok) throw new Error("Error al crear sensor")
      const newSensor = await res.json()
      setSensors((prev) => [...prev, newSensor])
      return newSensor
    } catch (err) {
      setError("Error al crear sensor")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar sensor
  const updateSensor = useCallback(async (updatedSensor: Partial<SensorCompleto> & { id_sensor_instalado: number }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/sensores/${updatedSensor.id_sensor_instalado}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSensor),
      })
      if (!res.ok) throw new Error("Error al actualizar sensor")
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
      const res = await fetch(`/api/sensores/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar sensor")
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
