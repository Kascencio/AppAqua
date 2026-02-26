"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"
import { backendApi, type Promedio } from "@/lib/backend-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type SensorAverageRow = {
  sensorId: number
  name: string
  unit: string
  promedio: number
  muestras: number
}

function computeBucketMinutes(from: Date, to: Date, targetPoints = 200): number {
  const totalMinutes = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 60000))
  const bucket = Math.ceil(totalMinutes / targetPoints)
  return Math.max(5, bucket)
}

function weightedAverage(promedios: Promedio[]): { avg: number; muestras: number } {
  if (!promedios.length) return { avg: 0, muestras: 0 }

  const withMuestras = promedios.filter((p) => typeof p.muestras === "number" && Number(p.muestras) > 0)
  if (withMuestras.length) {
    const sumW = withMuestras.reduce((acc, p) => acc + Number(p.muestras || 0), 0)
    const sumWV = withMuestras.reduce((acc, p) => acc + Number(p.promedio) * Number(p.muestras || 0), 0)
    return { avg: sumW > 0 ? sumWV / sumW : 0, muestras: sumW }
  }

  const sum = promedios.reduce((acc, p) => acc + Number(p.promedio), 0)
  return { avg: sum / promedios.length, muestras: promedios.length }
}

// Ejecutar con concurrencia limitada para no saturar
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length) as any
  let idx = 0

  const workers = new Array(Math.max(1, limit)).fill(0).map(async () => {
    while (idx < items.length) {
      const current = idx++
      results[current] = await fn(items[current])
    }
  })

  await Promise.all(workers)
  return results
}

export function SensorAveragesChart({ dateRange, sensors }: { dateRange: DateRange; sensors?: any[] }) {
  const [rows, setRows] = useState<SensorAverageRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasData = useRef(false)

  const from = dateRange?.from
  const to = dateRange?.to

  const sensorsToQuery = useMemo(() => {
    const source = Array.isArray(sensors) ? sensors : []
    // Evitar sobrecargar: por defecto solo primeros 20 sensores del filtro actual
    return (source || []).slice(0, 20)
  }, [sensors])

  useEffect(() => {
    if (!from || !to) return
    if (!sensorsToQuery.length) {
      setRows([])
      hasData.current = false
      return
    }

    // Only show full loading on initial load, otherwise just refresh indicator
    if (!hasData.current) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)

    ;(async () => {
      try {
        const bucketMinutes = computeBucketMinutes(from, to, 100)
        const desde = from.toISOString()
        const hasta = to.toISOString()

        // Usar concurrencia limitada para no saturar el servidor
        const results = await mapWithConcurrency(
          sensorsToQuery,
          3, // máximo 3 requests simultáneos para mejorar velocidad
          async (s: any) => {
            const sensorId = Number(s.id_sensor_instalado)
            if (!sensorId) return null

            // Prefer backend-side filtering; fallback to client-side filtering if backend is strict.
            const promedios = await backendApi
              .getPromedios({
                sensorInstaladoId: sensorId,
                bucketMinutes,
                desde,
                hasta,
              })
              .catch(() => backendApi.getPromedios({ sensorInstaladoId: sensorId, bucketMinutes }))

            const arr = ((promedios as any[]) as Promedio[]).filter((p) => {
              const t = new Date(p.timestamp).getTime()
              return Number.isFinite(t) && t >= from.getTime() && t <= to.getTime()
            })
            const { avg, muestras } = weightedAverage(arr)

            return {
              sensorId,
              name: (() => {
                const rawName = String(s.name || s.sensor || `Sensor ${sensorId}`)
                const rawType = String(s.tipoMedida || s.tipo_medida || s.type || "").trim()
                return rawType ? `${rawName} (${rawType})` : rawName
              })(),
              unit: String(s.unit || ""),
              promedio: Number.isFinite(avg) ? avg : 0,
              muestras: Number.isFinite(muestras) ? muestras : 0,
            } satisfies SensorAverageRow
          },
        )

        const cleaned = results.filter(Boolean) as SensorAverageRow[]
        // Orden descendente por promedio para lectura rápida
        cleaned.sort((a, b) => b.promedio - a.promedio)
        setRows(cleaned)
        hasData.current = cleaned.length > 0
      } catch (e: any) {
        console.error("[SensorAveragesChart] error", e)
        setError(e?.message || "Error al obtener promedios por sensor")
        // Mantener datos previos si existen
        if (!hasData.current) setRows([])
      } finally {
        setLoading(false)
        setIsRefreshing(false)
      }
    })()
  }, [from, to, sensorsToQuery])

  const chartConfig = {
    promedio: {
      label: "Promedio",
      color: "#2563eb",
    },
  } satisfies ChartConfig

  const isInitialLoading = loading
  const anyError = error

  if (!from || !to) {
    return null
  }

  if (anyError && rows.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{String(anyError)}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Promedio por Sensor</CardTitle>
          <CardDescription>Promedio calculado con /api/promedios en el rango seleccionado</CardDescription>
        </div>
        {isRefreshing && (
          <span className="text-xs text-muted-foreground animate-pulse">Actualizando...</span>
        )}
      </CardHeader>
      <CardContent>
        {anyError && rows.length > 0 && (
          <div className="mb-2 text-xs text-destructive">{String(anyError)}</div>
        )}
        {isInitialLoading && rows.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-muted-foreground">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">Sin datos para el rango</div>
        ) : (
          <ChartContainer config={chartConfig} className="h-72">
              <BarChart data={rows} margin={{ left: 12, right: 12, top: 8, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => String(label ?? "")}
                      valueFormatter={(value, _name, item) => {
                        const row = (item?.payload || {}) as SensorAverageRow
                        const unit = row?.unit ? ` ${row.unit}` : ""
                        return `${Number(value || 0).toFixed(2)}${unit}`
                      }}
                    />
                  }
                />
                <Bar 
                  dataKey="promedio" 
                  fill="var(--color-promedio)" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-out"
                />
              </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
