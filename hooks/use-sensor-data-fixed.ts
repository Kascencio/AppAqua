"use client"

import { useState, useEffect, useCallback } from "react"
import type { Lectura } from "@/types"

interface SensorDataPoint {
  timestamp: string
  value: number
  status: "normal" | "warning" | "critical"
  parametro_id: number
  unidad: string
}

export function useSensorDataMigrationReady(
  sensorId: number | null,
  parametroId: number | null,
  dateRange: { from: Date; to: Date },
) {
  const [data, setData] = useState<SensorDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!sensorId || !parametroId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/lecturas?sensor=${sensorId}&parametro=${parametroId}&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`,
      )
      if (!response.ok) throw new Error("Error al obtener lecturas")
      const lecturas: Lectura[] = await response.json()
      const formattedData = lecturas.map((lectura) => ({
        timestamp: lectura.fecha_hora_lectura.toString(),
        value: lectura.valor,
        status: "normal", // TODO: Determinar status real según reglas de negocio
        parametro_id: lectura.id_parametro,
        unidad: lectura.unidad || "",
      }))
      setData(formattedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }, [sensorId, parametroId, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}
