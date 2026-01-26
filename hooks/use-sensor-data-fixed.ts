"use client"

import { useState, useEffect, useCallback } from "react"
import type { Lectura } from "@/types"
import { backendApi } from "@/lib/backend-client"

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
      // Nota: el backend real requiere sensorInstaladoId (camelCase). No hay soporte confirmado para filtrar por "parametroId" numérico.
      const res = await backendApi.getLecturas({
        sensorInstaladoId: sensorId,
        page: 1,
        limit: 5000,
        desde: dateRange.from.toISOString(),
        hasta: dateRange.to.toISOString(),
      })
      const payload: any = res
      const lecturas: Lectura[] = Array.isArray(payload) ? payload : (payload.data || [])
      const formattedData = lecturas.map((lectura) => ({
        timestamp: (lectura as any).tomada_en || (lectura as any).fecha_hora_lectura?.toString() || (lectura as any).created_at || new Date().toISOString(),
        value: Number((lectura as any).valor ?? 0),
        status: "normal" as const, // TODO: Determinar status real según reglas de negocio
        parametro_id: parametroId,
        unidad: (lectura as any).unidad || (lectura as any).unidad_medida || "",
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
