"use client"

import { useEffect, useState } from "react"
import { backendApi, type Lectura as BackendLectura, type SensorInstalado as BackendSensorInstalado } from "@/lib/backend-client"

export interface LecturaRango {
  id_lectura: string
  id_sensor: string
  tipo_parametro: string
  valor: number
  unidad: string
  timestamp: string
  fecha: string
}

function toIsoStartOfDay(dateStr: string) {
  // dateStr expected: YYYY-MM-DD
  return `${dateStr}T00:00:00.000Z`
}

function toIsoEndOfDay(dateStr: string) {
  return `${dateStr}T23:59:59.999Z`
}

function lecturaTimestamp(l: BackendLectura): string {
  if (l.tomada_en) return l.tomada_en
  if (l.fecha && l.hora) return `${l.fecha}T${l.hora}`
  if (l.created_at) return l.created_at
  return new Date().toISOString()
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

    const instalacionId = typeof id_instalacion === "string" ? Number.parseInt(id_instalacion, 10) : Number(id_instalacion)

    ;(async () => {
      try {
        // 1) Obtener sensores instalados de la instalación
        const sensoresResp = await backendApi.getSensoresInstalados({ id_instalacion: instalacionId, page: 1, limit: 1000 })
        const sensoresPayload: any = sensoresResp
        const sensores: BackendSensorInstalado[] = Array.isArray(sensoresPayload)
          ? sensoresPayload
          : (sensoresPayload.data || [])

        if (sensores.length === 0) {
          setLecturas([])
          return
        }

        const desde = toIsoStartOfDay(fecha_inicio)
        const hasta = toIsoEndOfDay(fin)

        // 2) Obtener lecturas por sensorInstaladoId (obligatorio)
        const all = await Promise.all(
          sensores.map(async (s) => {
            const resp = await backendApi.getLecturas({
              sensorInstaladoId: s.id_sensor_instalado,
              page: 1,
              limit: 5000,
              desde,
              hasta,
            })
            const payload: any = resp
            return (Array.isArray(payload) ? payload : (payload.data || [])) as BackendLectura[]
          }),
        )

        const unidadBySensor = new Map<number, string>(sensores.map((s) => [s.id_sensor_instalado, s.unidad_medida || ""]))

        const mapped: LecturaRango[] = all
          .flat()
          .map((l) => {
            const sensorId = Number(l.id_sensor_instalado ?? l.sensor_instalado_id ?? 0)
            const ts = lecturaTimestamp(l)
            return {
              id_lectura: String(l.id_lectura ?? ""),
              id_sensor: String(sensorId),
              tipo_parametro: String(l.tipo_medida ?? ""),
              valor: Number(l.valor ?? 0),
              unidad: unidadBySensor.get(sensorId) || "",
              timestamp: ts,
              fecha: ts.split("T")[0] || "",
            }
          })

        setLecturas(mapped)
      } catch (err: any) {
        console.error("Error fetching lecturas:", err)
        setError(err?.message || "Error al cargar lecturas")
        setLecturas([])
      } finally {
        setLoading(false)
      }
    })()
  }, [id_instalacion, fecha_inicio, fecha_fin])

  return { lecturas, loading, error }
}
