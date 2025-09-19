"use client"

import { useState, useEffect } from "react"
import type { EmpresaSucursal } from "@/types/empresa-sucursal"
import { empresaSucursalToBranch, Branch } from "@/types/empresa-sucursal"

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch("/api/sucursales")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBranches(data.map(empresaSucursalToBranch))
        } else {
          setBranches([])
        }
      })
      .catch(() => setBranches([]))
      .finally(() => setLoading(false))
  }, [])

  // Agregar sucursal
  const addBranch = async (newBranch: Omit<EmpresaSucursal, "id_empresa_sucursal" | "fecha_registro">) => {
    const res = await fetch("/api/sucursales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBranch),
    })
    if (!res.ok) throw new Error("Error al crear sucursal")
    const created = await res.json()
    setBranches((prev) => [...prev, empresaSucursalToBranch(created)])
  }

  // Actualizar sucursal
  const updateBranch = async (id: number, updated: Partial<EmpresaSucursal>) => {
    const res = await fetch(`/api/sucursales?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    })
    if (!res.ok) throw new Error("Error al actualizar sucursal")
    const updatedBranch = await res.json()
    setBranches((prev) => prev.map((b) => (b.id === id ? empresaSucursalToBranch(updatedBranch) : b)))
  }

  // Eliminar sucursal
  const deleteBranch = async (id: number) => {
    const res = await fetch(`/api/sucursales?id=${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Error al eliminar sucursal")
    setBranches((prev) => prev.filter((b) => b.id !== id))
  }

  return {
    branches,
    loading,
    addBranch,
    updateBranch,
    deleteBranch,
  }
}
