"use client"

import { useState, useEffect } from "react"
import { backendApi } from "@/lib/backend-client"

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
    ;(async () => {
      try {
        const res = await backendApi.getSensoresInstalados({
          id_instalacion: instalacionId,
          page: 1,
          limit: 1000,
        })

        const payload: any = res
        const items = Array.isArray(payload) ? payload : (payload.data || [])

        const mapped: Sensor[] = items.map((s: any) => {
          const activo = (s as any).activo !== false
          return {
            id_sensor: Number(s.id_sensor_instalado ?? s.id_sensor ?? 0),
            nombre_sensor: (s.tipo_medida || s.descripcion || `Sensor ${s.id_sensor_instalado}`) as string,
            tipo_sensor: (s.tipo_medida || s.tipo_sensor || "") as string,
            ubicacion: s.ubicacion || undefined,
            estado: activo ? "activo" : "inactivo",
            id_instalacion: Number(s.id_instalacion ?? instalacionId),
            fecha_instalacion: (s.created_at || s.fecha_instalada || "") as string,
            modelo: s.modelo || undefined,
            marca: s.marca || undefined,
          }
        })

        setSensores(mapped)
      } catch {
        setError("Error al cargar sensores")
        setSensores([])
      } finally {
        setLoading(false)
      }
    })()
  }, [id_instalacion])

  return {
    sensores,
    loading,
    error,
  }
}

export const useSensorsByFacility = useSensoresDeInstalacion
