"use client"

import { useEffect, useState } from "react"

export interface LecturaRango {
  id_lectura: string
  id_sensor: string
  tipo_parametro: string
  valor: number
  unidad: string
  timestamp: string
  fecha: string
}

/**
 * Obtiene lecturas de sensores para una instalación, dentro de un rango de fechas.
 * @param id_instalacion El ID de la instalación.
 * @param fecha_inicio Fecha inicio del proceso (YYYY-MM-DD).
 * @param fecha_fin Fecha fin del proceso (YYYY-MM-DD) o fecha actual si no hay.
 */
export function useLecturasPorRango(
  id_instalacion: number | string | undefined,
  fecha_inicio: string | undefined,
  fecha_fin: string | undefined,
) {
  const [lecturas, setLecturas] = useState<LecturaRango[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id_instalacion || !fecha_inicio) {
      setLecturas([])
      return
    }

    setLoading(true)
    setError(null)

    const fin = fecha_fin || new Date().toISOString().substring(0, 10)

    fetch(`/api/lecturas?instalacion=${id_instalacion}&from=${fecha_inicio}&to=${fin}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
      .then((data) => {
        setLecturas(data || [])
      })
      .catch((err) => {
        console.error("Error fetching lecturas:", err)
        setError(err.message)
        setLecturas([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id_instalacion, fecha_inicio, fecha_fin])

  return { lecturas, loading, error }
}
