"use client"

import { useState, useEffect } from "react"

interface Sensor {
  id_sensor: number
  nombre_sensor: string
  tipo_sensor: string
  ubicacion?: string
  estado: "activo" | "inactivo" | "mantenimiento"
  id_instalacion: number
  fecha_instalacion: string
  modelo?: string
  marca?: string
}

export function useSensoresDeInstalacion(id_instalacion: number | string | undefined) {
  const [sensores, setSensores] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id_instalacion) {
      setSensores([])
      return
    }
    setLoading(true)
    setError(null)
    const instalacionId = typeof id_instalacion === "string" ? Number.parseInt(id_instalacion, 10) : id_instalacion
    fetch(`/api/sensores?instalacion=${instalacionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar sensores")
        return res.json()
      })
      .then((data) => setSensores(data))
      .catch(() => setError("Error al cargar sensores"))
      .finally(() => setLoading(false))
  }, [id_instalacion])

  return {
    sensores,
    loading,
    error,
  }
}

export const useSensorsByFacility = useSensoresDeInstalacion
