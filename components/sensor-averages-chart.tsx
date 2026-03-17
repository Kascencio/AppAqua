"use client"

import { useMemo } from "react"
import type { DateRange } from "react-day-picker"
import type { Promedio } from "@/lib/backend-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type SensorAverageRow = {
  sensorId: number
  name: string
  unit: string
  promedio: number
  muestras: number
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
export function SensorAveragesChart({
  dateRange,
  sensors,
  seriesBySensor,
  loading = false,
  isRefreshing = false,
  coverage,
}: {
  dateRange: DateRange
  sensors?: any[]
  seriesBySensor?: Map<number, Promedio[]>
  loading?: boolean
  isRefreshing?: boolean
  coverage?: { queried: number; total: number }
}) {
  const from = dateRange?.from
  const to = dateRange?.to

  const sensorsToQuery = useMemo(() => {
    const source = Array.isArray(sensors) ? sensors : []
    return (source || []).slice(0, 20)
  }, [sensors])

  const rows = useMemo<SensorAverageRow[]>(() => {
    if (!from || !to || !seriesBySensor) return []

    const computed = sensorsToQuery.map((sensor: any) => {
      const sensorId = Number(sensor.id_sensor_instalado)
      const points = (seriesBySensor.get(sensorId) ?? []).filter((point) => {
        const t = new Date(point.timestamp).getTime()
        return Number.isFinite(t) && t >= from.getTime() && t <= to.getTime()
      })
      const { avg, muestras } = weightedAverage(points)

      return {
        sensorId,
        name: (() => {
          const rawName = String(sensor.name || sensor.sensor || `Sensor ${sensorId}`)
          const rawType = String(sensor.tipoMedida || sensor.tipo_medida || sensor.type || "").trim()
          return rawType ? `${rawName} (${rawType})` : rawName
        })(),
        unit: String(sensor.unit || ""),
        promedio: Number.isFinite(avg) ? avg : 0,
        muestras: Number.isFinite(muestras) ? muestras : 0,
      }
    })

    computed.sort((a, b) => b.promedio - a.promedio)
    return computed
  }, [from, to, sensorsToQuery, seriesBySensor])

  const chartConfig = {
    promedio: {
      label: "Promedio",
      color: "#2563eb",
    },
  } satisfies ChartConfig

  if (!from || !to) {
    return null
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
        {coverage && coverage.total > sensorsToQuery.length && (
          <div className="mb-3 text-xs text-muted-foreground">
            Vista rápida basada en {sensorsToQuery.length}/{coverage.total} sensores.
          </div>
        )}
        {loading && rows.length === 0 ? (
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
