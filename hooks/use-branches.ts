"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import type { EmpresaSucursal } from "@/types/empresa-sucursal"
import { empresaSucursalToBranch, Branch } from "@/types/empresa-sucursal"
import { api } from "@/lib/api"
import { canReadOrganizationDirectory, deriveDirectoryFromInstalaciones } from "@/lib/organization-directory"
import { toast } from "sonner"

function mapOrganizacionesYSucursales(orgs: any[], sucursales: any[]): Branch[] {
  const mappedOrgs = orgs.map((org: any) => ({
    id_empresa_sucursal: org.id_organizacion,
    nombre: org.nombre,
    tipo: "empresa" as const,
    estado_operativo: (org.estado === "activa" ? "activa" : "inactiva") as "activa" | "inactiva",
    fecha_registro: org.fecha_creacion,
    id_estado: org.id_estado || 0,
    id_cp: 0,
    id_colonia: 0,
    calle: org.direccion || "",
    telefono: org.telefono,
    email: org.correo,
    latitud: org.latitud != null ? Number(org.latitud) : null,
    longitud: org.longitud != null ? Number(org.longitud) : null,
  }))

  const mappedSucursales = sucursales.map((suc: any) => ({
    id_empresa_sucursal: 10000 + suc.id_organizacion_sucursal,
    id_padre: suc.id_organizacion,
    nombre: suc.nombre_sucursal,
    tipo: "sucursal" as const,
    estado_operativo: (suc.estado === "activa" ? "activa" : "inactiva") as "activa" | "inactiva",
    fecha_registro: suc.fecha_creacion,
    id_estado: suc.id_estado || 0,
    id_cp: suc.id_cp || 0,
    id_colonia: suc.id_colonia || 0,
    calle: suc.direccion_sucursal || "",
    numero_int_ext: suc.numero_int_ext || null,
    referencia: suc.referencia || null,
    telefono: suc.telefono_sucursal,
    email: suc.correo_sucursal,
    latitud: suc.latitud != null ? Number(suc.latitud) : null,
    longitud: suc.longitud != null ? Number(suc.longitud) : null,
  }))

  return [...mappedOrgs, ...mappedSucursales].map(empresaSucursalToBranch)
}

export function useBranches() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  const loadBranches = useCallback(async () => {
    if (isAuthLoading) return
    if (!isAuthenticated) {
      setBranches([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      if (canReadOrganizationDirectory(user?.role)) {
        const [orgs, sucursales] = await Promise.all([
          api.get<any[]>('/organizaciones').catch(() => []),
          api.get<any[]>('/sucursales').catch(() => []),
        ])

        setBranches(mapOrganizacionesYSucursales(orgs, sucursales))
        return
      }

      const instalaciones = await api.get<any[]>("/instalaciones").catch(() => [])
      const { organizaciones, sucursales } = deriveDirectoryFromInstalaciones(instalaciones)
      setBranches([...organizaciones, ...sucursales].map(empresaSucursalToBranch))
    } catch (err) {
      console.error("Error loading branches:", err)
      setBranches([])
    } finally {
      setLoading(false)
    }
  }, [isAuthLoading, isAuthenticated, user?.role])

  useEffect(() => {
    if (isAuthLoading) return
    loadBranches()
  }, [isAuthLoading, loadBranches])

  // Agregar sucursal
  const addBranch = async (newBranch: Omit<EmpresaSucursal, "id_empresa_sucursal" | "fecha_registro">) => {
    const endpoint = newBranch.tipo === 'empresa' ? '/organizaciones' : '/sucursales'
    const payload = newBranch.tipo === 'empresa'
      ? {
          nombre: newBranch.nombre,
          telefono: newBranch.telefono,
          correo: newBranch.email,
          estado: newBranch.estado_operativo,
          direccion: newBranch.calle,
          id_estado: newBranch.id_estado,
          latitud: newBranch.latitud,
          longitud: newBranch.longitud,
        }
      : {
          id_organizacion: newBranch.id_padre,
          nombre_sucursal: newBranch.nombre,
          telefono_sucursal: newBranch.telefono,
          correo_sucursal: newBranch.email,
          estado: newBranch.estado_operativo,
          direccion_sucursal: newBranch.calle,
          numero_int_ext: newBranch.numero_int_ext,
          referencia: newBranch.referencia,
          id_cp: newBranch.id_cp,
          id_colonia: newBranch.id_colonia,
          id_estado: newBranch.id_estado,
          latitud: newBranch.latitud,
          longitud: newBranch.longitud,
        }

    await api.post(endpoint, payload)
    await loadBranches()
  }

  // Actualizar sucursal
  const updateBranch = async (id: number, updated: Partial<EmpresaSucursal>) => {
    const target = branches.find((branch) => branch.id_empresa_sucursal === id)
    if (!target) {
      throw new Error("No se encontró el registro a actualizar")
    }

    if (target.tipo === "empresa") {
      await api.put(`/organizaciones/${id}`, {
        ...(updated.nombre !== undefined ? { nombre: updated.nombre } : {}),
        ...(updated.telefono !== undefined ? { telefono: updated.telefono } : {}),
        ...(updated.email !== undefined ? { correo: updated.email } : {}),
        ...(updated.estado_operativo !== undefined ? { estado: updated.estado_operativo } : {}),
        ...(updated.calle !== undefined ? { direccion: updated.calle } : {}),
        ...(updated.id_estado !== undefined ? { id_estado: updated.id_estado } : {}),
        ...(updated.latitud !== undefined ? { latitud: updated.latitud } : {}),
        ...(updated.longitud !== undefined ? { longitud: updated.longitud } : {}),
      })
    } else {
      const realSucursalId = id - 10000
      if (!Number.isFinite(realSucursalId) || realSucursalId <= 0) {
        throw new Error("ID de sucursal inválido")
      }

      await api.put(`/sucursales/${realSucursalId}`, {
        ...(updated.id_padre !== undefined ? { id_organizacion: updated.id_padre } : {}),
        ...(updated.nombre !== undefined ? { nombre_sucursal: updated.nombre } : {}),
        ...(updated.telefono !== undefined ? { telefono_sucursal: updated.telefono } : {}),
        ...(updated.email !== undefined ? { correo_sucursal: updated.email } : {}),
        ...(updated.estado_operativo !== undefined ? { estado: updated.estado_operativo } : {}),
        ...(updated.calle !== undefined ? { direccion_sucursal: updated.calle } : {}),
        ...(updated.numero_int_ext !== undefined ? { numero_int_ext: updated.numero_int_ext } : {}),
        ...(updated.referencia !== undefined ? { referencia: updated.referencia } : {}),
        ...(updated.id_cp !== undefined ? { id_cp: updated.id_cp } : {}),
        ...(updated.id_colonia !== undefined ? { id_colonia: updated.id_colonia } : {}),
        ...(updated.id_estado !== undefined ? { id_estado: updated.id_estado } : {}),
        ...(updated.latitud !== undefined ? { latitud: updated.latitud } : {}),
        ...(updated.longitud !== undefined ? { longitud: updated.longitud } : {}),
      })
    }

    await loadBranches()
  }

  // Eliminar sucursal
  const deleteBranch = async (id: number) => {
    const target = branches.find((b) => b.id_empresa_sucursal === id)
    if (!target) {
      toast.error("No se encontró el registro a eliminar")
      return
    }

    try {
      if (target.tipo === "empresa") {
        await api.delete(`/organizaciones/${id}`)
      } else {
        const realSucursalId = id - 10000
        if (!Number.isFinite(realSucursalId) || realSucursalId <= 0) {
          throw new Error("ID de sucursal inválido")
        }
        await api.delete(`/sucursales/${realSucursalId}`)
      }

      setBranches((prev) => prev.filter((b) => b.id_empresa_sucursal !== id))
      toast.success("Eliminado correctamente")
    } catch (error) {
      console.error("Error deleting branch:", error)
      toast.error("Error al eliminar")
      throw error
    }
  }

  return {
    branches,
    loading,
    addBranch,
    updateBranch,
    deleteBranch,
    reload: loadBranches,
  }
}
