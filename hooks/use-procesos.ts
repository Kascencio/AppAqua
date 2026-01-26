"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { backendApi, type Proceso } from "@/lib/backend-client"

export interface UseProcesosOptions {
  page?: number
  limit?: number
  id_instalacion?: number
  id_especie?: number
  estado?: string
  auto?: boolean
}

export interface UseProcesosResult {
  procesos: Proceso[]
  loading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  totalPages: number
  refresh: () => Promise<void>
  create: (data: Omit<Proceso, "id_proceso" | "created_at" | "updated_at">) => Promise<Proceso>
  update: (id: number, data: Partial<Proceso>) => Promise<void>
  remove: (id: number) => Promise<void>
  setPage: (p: number) => void
  setLimit: (l: number) => void
}

export function useProcesos(options: UseProcesosOptions = {}): UseProcesosResult {
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState<number>(options.page ?? 1)
  const [limit, setLimit] = useState<number>(options.limit ?? 20)
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(0)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await backendApi.getProcesos({
        page,
        limit,
        id_instalacion: options.id_instalacion,
        id_especie: options.id_especie,
        estado: options.estado,
      })
      const payload = res as any
      const items: Proceso[] = Array.isArray(payload) ? payload : (payload.data || [])
      setProcesos(items)
      setTotal(payload?.pagination?.total ?? items.length)
      setTotalPages(payload?.pagination?.totalPages ?? 1)
    } catch (e: any) {
      console.error("[useProcesos] fetch error", e)
      setError(e?.message || "Error al cargar procesos")
    } finally {
      setLoading(false)
    }
  }, [page, limit, options.id_instalacion, options.id_especie, options.estado])

  useEffect(() => {
    if (options.auto !== false) fetchList()
  }, [fetchList, options.auto])

  const refresh = useCallback(async () => {
    await fetchList()
  }, [fetchList])

  const create = useCallback(async (data: Omit<Proceso, "id_proceso" | "created_at" | "updated_at">) => {
    setLoading(true)
    setError(null)
    try {
      const res = await backendApi.createProceso(data)
      const created = ((res as any).data ?? res) as Proceso
      await fetchList()
      return created
    } catch (e: any) {
      setError(e?.message || "Error al crear proceso")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  const update = useCallback(async (id: number, data: Partial<Proceso>) => {
    setLoading(true)
    setError(null)
    try {
      await backendApi.updateProceso(id, data)
      await fetchList()
    } catch (e: any) {
      setError(e?.message || "Error al actualizar proceso")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  const remove = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await backendApi.deleteProceso(id)
      await fetchList()
    } catch (e: any) {
      setError(e?.message || "Error al eliminar proceso")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  return useMemo(() => ({
    procesos,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    refresh,
    create,
    update,
    remove,
    setPage,
    setLimit,
  }), [procesos, loading, error, page, limit, total, totalPages, refresh, create, update, remove])
}
