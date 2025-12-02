"use client"

import { useState, useEffect } from "react"
import type { Instalacion, InstalacionCompleta } from "@/types"
import { api } from "@/lib/api"

interface UseInstalacionesReturn {
  instalaciones: InstalacionCompleta[]
  instalacionesRaw: Instalacion[]
  loading: boolean
  error: string | null
  refreshInstalaciones: () => Promise<void>
  createInstalacion: (instalacion: Omit<Instalacion, "id_instalacion">) => Promise<void>
  updateInstalacion: (id: number, instalacion: Partial<Instalacion>) => Promise<void>
  deleteInstalacion: (id: number) => Promise<void>
  getInstalacionById: (id: number) => InstalacionCompleta | undefined
  getInstalacionesBySucursal: (sucursalId: number) => InstalacionCompleta[]
}

export function useInstalaciones(): UseInstalacionesReturn {
  const [instalaciones, setInstalaciones] = useState<InstalacionCompleta[]>([])
  const [instalacionesRaw, setInstalacionesRaw] = useState<Instalacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshInstalaciones = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<any[]>("/instalaciones")

      // Map if necessary, similar to AppContext
      const mapped: InstalacionCompleta[] = data.map((inst: any) => ({
        id_instalacion: inst.id_instalacion,
        id_empresa_sucursal: inst.id_empresa_sucursal || inst.id_organizacion_sucursal || 0,
        nombre_instalacion: inst.nombre_instalacion,
        fecha_instalacion: inst.fecha_instalacion,
        estado_operativo: inst.estado_operativo === "activo" ? "activo" : "inactivo",
        descripcion: inst.descripcion,
        tipo_uso: inst.tipo_uso,
        id_proceso: inst.id_proceso,
        // We can't easily get helper fields here without fetching orgs/species/processes
        // For now, leave them undefined or fetch them if needed
      }))

      setInstalaciones(mapped)
      setInstalacionesRaw(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar instalaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshInstalaciones()
  }, [])

  const createInstalacion = async (instalacionData: Omit<Instalacion, "id_instalacion">) => {
    setLoading(true)
    setError(null)
    try {
      await api.post("/instalaciones", instalacionData)
      await refreshInstalaciones()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear instalación")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateInstalacion = async (id: number, updates: Partial<Instalacion>) => {
    setLoading(true)
    setError(null)
    try {
      await api.put(`/instalaciones/${id}`, updates)
      await refreshInstalaciones()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar instalación")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteInstalacion = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await api.delete(`/instalaciones/${id}`)
      await refreshInstalaciones()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar instalación")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getInstalacionById = (id: number): InstalacionCompleta | undefined => {
    return instalaciones.find((i) => i.id_instalacion === id)
  }

  const getInstalacionesBySucursal = (sucursalId: number): InstalacionCompleta[] => {
    return instalaciones.filter((i) => i.id_empresa_sucursal === sucursalId)
  }

  return {
    instalaciones,
    instalacionesRaw,
    loading,
    error,
    refreshInstalaciones,
    createInstalacion,
    updateInstalacion,
    deleteInstalacion,
    getInstalacionById,
    getInstalacionesBySucursal,
  }
}
