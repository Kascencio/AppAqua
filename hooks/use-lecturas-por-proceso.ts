"use client"

import { useState, useEffect } from "react"
import type { LecturaPorProceso, ParametroMonitoreo } from "@/types"

export function useLecturasPorProceso(id_proceso: number | null, fechaInicio?: string, fechaFin?: string) {
  const [lecturas, setLecturas] = useState<LecturaPorProceso[]>([])
  const [parametros, setParametros] = useState<ParametroMonitoreo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchLecturas = async () => {
    if (!id_proceso) return

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        id_proceso: id_proceso.toString(),
        ...(fechaInicio && { fecha_inicio: fechaInicio }),
        ...(fechaFin && { fecha_fin: fechaFin }),
      })

      const response = await fetch(`/api/lecturas-por-proceso?${params}`)
      if (!response.ok) throw new Error("Error al cargar lecturas")

      const data = await response.json()
      setLecturas(data.lecturas || [])
      setParametros(data.parametros || [])
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLecturas()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLecturas, 30000)
    return () => clearInterval(interval)
  }, [id_proceso, fechaInicio, fechaFin])

  return {
    lecturas,
    parametros,
    loading,
    error,
    lastUpdated,
    refresh: fetchLecturas,
  }
}
