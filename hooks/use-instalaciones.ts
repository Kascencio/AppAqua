"use client"

import { useState, useEffect } from "react"
import type { Instalacion, InstalacionCompleta } from "@/types"

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
      const response = await fetch("/api/instalaciones")
      if (!response.ok) throw new Error("Error al cargar instalaciones")
      const data = await response.json()
      setInstalaciones(data)
      setInstalacionesRaw(data)
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
      const response = await fetch("/api/instalaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instalacionData),
      })
      if (!response.ok) throw new Error("Error al crear instalación")
      await refreshInstalaciones()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear instalación")
    } finally {
      setLoading(false)
    }
  }

  const updateInstalacion = async (id: number, updates: Partial<Instalacion>) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/instalaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error("Error al actualizar instalación")
      await refreshInstalaciones()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar instalación")
    } finally {
      setLoading(false)
    }
  }

  const deleteInstalacion = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/instalaciones/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Error al eliminar instalación")
      await refreshInstalaciones()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar instalación")
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
