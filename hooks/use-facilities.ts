"use client"

import { useState, useEffect } from "react"
import type { Instalacion } from "@/types/instalacion"

export function useFacilities() {
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch("/api/instalaciones")
      .then((res) => res.json())
      .then((data) => setInstalaciones(data))
      .catch(() => setError("Error al cargar las instalaciones"))
      .finally(() => setLoading(false))
  }, [])

  return {
    instalaciones,
    loading,
    error,
  }
}
