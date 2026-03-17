"use client"

import { useState, useEffect, useCallback } from "react"
import type { LecturaPorProceso, ParametroMonitoreo } from "@/types/lectura"
import { api } from "@/lib/api"

type LecturasProcesoPayload = {
  lecturas: LecturaPorProceso[]
  parametros: ParametroMonitoreo[]
}

const PROCESS_READINGS_CACHE_TTL_MS = 10_000
const processReadingsCache = new Map<string, { expiresAt: number; data: LecturasProcesoPayload }>()
const processReadingsInflight = new Map<string, Promise<LecturasProcesoPayload>>()

function buildProcessReadingsCacheKey(idProceso: number, fechaInicio?: string, fechaFin?: string): string {
  return `${idProceso}|from:${fechaInicio || ""}|to:${fechaFin || ""}`
}

export function useLecturasPorProceso(id_proceso: number | null, fechaInicio?: string, fechaFin?: string) {
  const [lecturas, setLecturas] = useState<LecturaPorProceso[]>([])
  const [parametros, setParametros] = useState<ParametroMonitoreo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchLecturas = useCallback(async (options?: { force?: boolean; signal?: AbortSignal }) => {
    if (!id_proceso) return

    const cacheKey = buildProcessReadingsCacheKey(id_proceso, fechaInicio, fechaFin)
    const shouldForce = Boolean(options?.force)
    if (!shouldForce) {
      const cached = processReadingsCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        setLecturas(cached.data.lecturas)
        setParametros(cached.data.parametros)
        setLastUpdated(new Date())
        return
      }

      const inflight = processReadingsInflight.get(cacheKey)
      if (inflight) {
        const shared = await inflight
        setLecturas(shared.lecturas)
        setParametros(shared.parametros)
        setLastUpdated(new Date())
        return
      }
    }

    const forceRefresh = Boolean(options?.force)
    if (!forceRefresh) {
      setLoading(true)
    }
    setError(null)
    try {
      const params = new URLSearchParams({
        id_proceso: id_proceso.toString(),
        include_lecturas: "0",
        ...(fechaInicio && { fecha_inicio: fechaInicio }),
        ...(fechaFin && { fecha_fin: fechaFin }),
      })

      const requestPromise = api
        .get<any>(`/lecturas-por-proceso?${params.toString()}`, { signal: options?.signal })
        .then((response) => ({
          lecturas: Array.isArray(response?.lecturas) ? response.lecturas : [],
          parametros: Array.isArray(response?.parametros) ? response.parametros : [],
        }))

      processReadingsInflight.set(cacheKey, requestPromise)
      const data = await requestPromise

      processReadingsCache.set(cacheKey, {
        expiresAt: Date.now() + PROCESS_READINGS_CACHE_TTL_MS,
        data,
      })

      setLecturas(data.lecturas)
      setParametros(data.parametros)
      setLastUpdated(new Date())
    } catch (err) {
      const isAbortError = err instanceof DOMException && err.name === "AbortError"
      if (isAbortError) return
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      processReadingsInflight.delete(cacheKey)
      if (!forceRefresh) {
        setLoading(false)
      }
    }
  }, [fechaFin, fechaInicio, id_proceso])

  useEffect(() => {
    const controller = new AbortController()
    void fetchLecturas({ signal: controller.signal })

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return
      void fetchLecturas({ force: true })
    }, 30000)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchLecturas])

  return {
    lecturas,
    parametros,
    loading,
    error,
    lastUpdated,
    refresh: () => fetchLecturas({ force: true }),
  }
}
