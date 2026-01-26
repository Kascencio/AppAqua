"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { backendApi, type Instalacion, type PaginatedResponse } from "@/lib/backend-client"

export interface UseInstalacionesOptions {
  page?: number
  limit?: number
  id_sucursal?: number
  activo?: boolean
  auto?: boolean
}

export interface UseInstalacionesResult {
  instalaciones: Instalacion[]
  loading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  totalPages: number
  refresh: () => Promise<void>
  create: (data: Omit<Instalacion, "id_instalacion" | "created_at" | "updated_at">) => Promise<Instalacion>
  update: (id: number, data: Partial<Instalacion>) => Promise<void>
  remove: (id: number) => Promise<void>
  // Aliases para compatibilidad con UI legacy
  createInstalacion: (data: Omit<Instalacion, "id_instalacion" | "created_at" | "updated_at">) => Promise<Instalacion>
  updateInstalacion: (id: number, data: Partial<Instalacion>) => Promise<void>
  deleteInstalacion: (id: number) => Promise<void>
  getById: (id: number) => Instalacion | undefined
  getBySucursal: (sucursalId: number) => Instalacion[]
  setPage: (p: number) => void
  setLimit: (l: number) => void
}

export function useInstalaciones(options: UseInstalacionesOptions = {}): UseInstalacionesResult {
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([])
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
      const res = await backendApi.getInstalaciones({
        page,
        limit,
        id_sucursal: options.id_sucursal,
        activo: options.activo,
      })
      const payload = res as any
      const items: Instalacion[] = Array.isArray(payload) ? payload : (payload.data || [])
      setInstalaciones(items)
      setTotal(payload?.pagination?.total ?? items.length)
      setTotalPages(payload?.pagination?.totalPages ?? 1)
    } catch (e: any) {
      console.error("[useInstalaciones] fetch error", e)
      setError(e?.message || "Error al cargar instalaciones")
    } finally {
      setLoading(false)
    }
  }, [page, limit, options.id_sucursal, options.activo])

  useEffect(() => {
    if (options.auto !== false) fetchList()
  }, [fetchList, options.auto])

  const refresh = useCallback(async () => {
    await fetchList()
  }, [fetchList])

  const create = useCallback(async (data: Omit<Instalacion, "id_instalacion" | "created_at" | "updated_at">) => {
    setLoading(true)
    setError(null)
    try {
      const res = await backendApi.createInstalacion(data)
      const created = ((res as any).data ?? res) as Instalacion
      await fetchList()
      return created
    } catch (e: any) {
      setError(e?.message || "Error al crear instalación")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  const update = useCallback(async (id: number, data: Partial<Instalacion>) => {
    setLoading(true)
    setError(null)
    try {
      await backendApi.updateInstalacion(id, data)
      await fetchList()
    } catch (e: any) {
      setError(e?.message || "Error al actualizar instalación")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  const remove = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await backendApi.deleteInstalacion(id)
      await fetchList()
    } catch (e: any) {
      setError(e?.message || "Error al eliminar instalación")
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  const getById = useCallback((id: number) => {
    return instalaciones.find(inst => inst.id_instalacion === id)
  }, [instalaciones])

  const getBySucursal = useCallback((sucursalId: number) => {
    return instalaciones.filter(inst => inst.id_sucursal === sucursalId)
  }, [instalaciones])

  return useMemo(() => ({
    instalaciones,
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
    createInstalacion: create,
    updateInstalacion: update,
    deleteInstalacion: remove,
    getById,
    getBySucursal,
    setPage,
    setLimit,
  }), [instalaciones, loading, error, page, limit, total, totalPages, refresh, create, update, remove, getById, getBySucursal])
}
