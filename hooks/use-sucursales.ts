"use client"

import { useState, useEffect } from "react"

export function useSucursales() {
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch("/api/sucursales")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar sucursales")
        return r.json()
      })
      .then(setSucursales)
      .catch((err) => {
        setError("Error al cargar sucursales")
        setSucursales([])
      })
      .finally(() => setLoading(false))
  }, [])

  return { sucursales, loading, error }
}
