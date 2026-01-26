"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { backendApi, type Sucursal, type PaginatedResponse } from "@/lib/backend-client"

export interface UseSucursalesOptions {
  page?: number
  limit?: number
  id_empresa?: number
  activo?: boolean
  auto?: boolean
}

export interface UseSucursalesResult {
  sucursales: Sucursal[]
  loading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  totalPages: number
  refresh: () => Promise<void>
  create: (data: Omit<Sucursal, "id_sucursal" | "created_at" | "updated_at">) => Promise<Sucursal>
  update: (id: number, data: Partial<Sucursal>) => Promise<void>
  remove: (id: number) => Promise<void>
  setPage: (p: number) => void
  setLimit: (l: number) => void
}

export function useSucursales(options: UseSucursalesOptions = {}): UseSucursalesResult {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
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
      const res = await backendApi.getSucursales({
        page,
        limit,
        id_empresa: options.id_empresa,
        activo: options.activo,
      })
      const payload = res as any
      const items: Sucursal[] = Array.isArray(payload) ? payload : (payload.data || [])
      setSucursales(items)
      setTotal(payload?.pagination?.total ?? items.length)
      setTotalPages(payload?.pagination?.totalPages ?? 1)
    } catch (e: any) {
      console.error("[useSucursales] fetch error", e)
      setError(e?.message || "Error al cargar sucursales")
    } finally {
      setLoading(false)
    }
  }, [page, limit, options.id_empresa, options.activo])

  useEffect(() => {
    if (options.auto !== false) fetchList()
  }, [fetchList, options.auto])

  const refresh = useCallback(async () => {
    await fetchList()
  }, [fetchList])

  const create = useCallback(async (data: Omit<Sucursal, "id_sucursal" | "created_at" | "updated_at">) => {
    setLoading(true)
    setError(null)
    try {
      const res = await backendApi.createSucursal(data)
      const created = ((res as any).data ?? res) as Sucursal
      await fetchList()
      return created
    } catch (e: any) {
      setError(e?.message || "Error al crear sucursal")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  const update = useCallback(async (id: number, data: Partial<Sucursal>) => {
    setLoading(true)
    setError(null)
    try {
      await backendApi.updateSucursal(id, data)
      await fetchList()
    } catch (e: any) {
      setError(e?.message || "Error al actualizar sucursal")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  const remove = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await backendApi.deleteSucursal(id)
      await fetchList()
    } catch (e: any) {
      setError(e?.message || "Error al eliminar sucursal")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  return useMemo(() => ({
    sucursales,
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
  }), [sucursales, loading, error, page, limit, total, totalPages, refresh, create, update, remove])
}
