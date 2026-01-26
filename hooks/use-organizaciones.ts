"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { backendApi, type Organizacion, type PaginatedResponse } from "@/lib/backend-client"

export interface UseOrganizacionesOptions {
  page?: number
  limit?: number
  activo?: boolean
  auto?: boolean // auto fetch on mount
}

export interface UseOrganizacionesResult {
  organizaciones: Organizacion[]
  loading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  totalPages: number
  refresh: () => Promise<void>
  create: (data: Omit<Organizacion, "id_organizacion" | "created_at" | "updated_at">) => Promise<Organizacion>
  update: (id: number, data: Partial<Organizacion>) => Promise<void>
  remove: (id: number) => Promise<void>
  setPage: (p: number) => void
  setLimit: (l: number) => void
}

export function useOrganizaciones(options: UseOrganizacionesOptions = {}): UseOrganizacionesResult {
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState<number>(options.page ?? 1)
  const [limit, setLimit] = useState<number>(options.limit ?? 10)
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(0)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await backendApi.getOrganizaciones({ page, limit, activo: options.activo })
      const payload = res as any
      const items: Organizacion[] = Array.isArray(payload) ? payload : (payload.data || [])
      setOrganizaciones(items)
      setTotal(payload?.pagination?.total ?? items.length)
      setTotalPages(payload?.pagination?.totalPages ?? 1)
    } catch (e: any) {
      console.error("[useOrganizaciones] fetch error", e)
      setError(e?.message || "Error al cargar organizaciones")
    } finally {
      setLoading(false)
    }
  }, [page, limit, options.activo])

  useEffect(() => {
    if (options.auto !== false) fetchList()
  }, [fetchList, options.auto])

  const refresh = useCallback(async () => {
    await fetchList()
  }, [fetchList])

  const create = useCallback(async (data: Omit<Organizacion, "id_organizacion" | "created_at" | "updated_at">) => {
    setLoading(true)
    setError(null)
    try {
      const res = await backendApi.createOrganizacion(data)
      const created = ((res as any).data ?? res) as Organizacion
      // Simple refresh to keep consistent with pagination
      await fetchList()
      return created
    } catch (e: any) {
      setError(e?.message || "Error al crear organización")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  const update = useCallback(async (id: number, data: Partial<Organizacion>) => {
    setLoading(true)
    setError(null)
    try {
      await backendApi.updateOrganizacion(id, data)
      await fetchList()
    } catch (e: any) {
      setError(e?.message || "Error al actualizar organización")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  const remove = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await backendApi.deleteOrganizacion(id)
      await fetchList()
    } catch (e: any) {
      setError(e?.message || "Error al eliminar organización")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  return useMemo(() => ({
    organizaciones,
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
  }), [organizaciones, loading, error, page, limit, total, totalPages, refresh, create, update, remove])
}
