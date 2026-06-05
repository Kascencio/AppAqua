"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"
import type { Promedio } from "@/lib/backend-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import {
  createChart,
  ColorType,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts"

// ─── Types ───────────────────────────────────────────────────────────────────

type ChartType = "line" | "area" | "histogram"

type SensorSeries = {
  sensorId: number
  name: string
  unit: string
  color: string
  data: Array<{ time: Time; value: number }>
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const PALETTE = [
  "#2563eb", "#7c3aed", "#059669", "#06b6d4",
  "#f59e0b", "#ef4444", "#8b5cf6", "#f97316",
  "#84cc16", "#ec4899",
]

function getChartThemeOptions(isDark: boolean) {
  return {
    layout: {
      background: { type: ColorType.Solid, color: isDark ? "#09090b" : "#ffffff" },
      textColor: isDark ? "#a1a1aa" : "#52525b",
    },
    grid: {
      vertLines: { color: isDark ? "#27272a" : "#f4f4f5" },
      horzLines: { color: isDark ? "#27272a" : "#f4f4f5" },
    },
    timeScale: {
      borderColor: isDark ? "#27272a" : "#e4e4e7",
      timeVisible: true,
      secondsVisible: false,
    },
    rightPriceScale: {
      borderColor: isDark ? "#27272a" : "#e4e4e7",
    },
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SensorAveragesChart({
  dateRange,
  sensors,
  seriesBySensor,
  loading = false,
  isRefreshing = false,
  coverage,
}: {
  dateRange: DateRange
  sensors?: unknown[]
  seriesBySensor?: Map<number, Promedio[]>
  loading?: boolean
  isRefreshing?: boolean
  coverage?: { queried: number; total: number }
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allSeriesRef = useRef<ISeriesApi<any>[]>([])

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [chartType, setChartType] = useState<ChartType>("line")
  const [chartReady, setChartReady] = useState(false)

  const from = dateRange?.from
  const to = dateRange?.to

  const sourceSensors = useMemo(
    () => (Array.isArray(sensors) ? (sensors as Array<Record<string, unknown>>) : []),
    [sensors],
  )

  // Build per-sensor time series (top 8 by number of data points)
  const sensorSeries = useMemo<SensorSeries[]>(() => {
    if (!from || !to || !seriesBySensor) return []

    const top = sourceSensors.slice(0, 8)
    return top.map((sensor, idx) => {
      const sensorId = Number(sensor.id_sensor_instalado || 0)
      const rawName = String(sensor.name || sensor.sensor || `Sensor ${sensorId}`)
      const rawType = String(sensor.tipoMedida || sensor.tipo_medida || sensor.type || "").trim()
      const name = rawType ? `${rawName} (${rawType})` : rawName

      const rows = seriesBySensor.get(sensorId) ?? []
      const data = rows
        .filter((p) => {
          const t = new Date(p.timestamp).getTime()
          return Number.isFinite(t) && t >= from.getTime() && t <= to.getTime()
        })
        .map((p) => ({
          time: Math.floor(new Date(p.timestamp).getTime() / 1000) as Time,
          value: Number(p.promedio ?? 0),
        }))
        .sort((a, b) => (a.time as number) - (b.time as number))

      return {
        sensorId,
        name,
        unit: String(sensor.unit || ""),
        color: PALETTE[idx % PALETTE.length],
        data,
      }
    })
  }, [from, to, sourceSensors, seriesBySensor])

  const hasData = sensorSeries.some((s) => s.data.length > 0)

  // ── Create chart once the container is mounted and has dimensions ─────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let chart: IChartApi | null = null
    let ro: ResizeObserver | null = null

    function initChart() {
      if (chart) return // already initialized
      const w = el!.clientWidth
      if (w === 0) return // not laid out yet, wait for resize

      chart = createChart(el!, {
        ...getChartThemeOptions(isDark),
        width: w,
        height: 320,
        handleScroll: true,
        handleScale: true,
      })
      chartRef.current = chart
      setChartReady(true)

      ro!.observe(el!)
    }

    ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      const w = entry?.contentRect.width ?? 0
      if (!chart) {
        if (w > 0) initChart()
      } else {
        chart.applyOptions({ width: w })
      }
    })

    // Try immediately, fall back to ResizeObserver
    if (el.clientWidth > 0) {
      initChart()
      ro.observe(el)
    } else {
      ro.observe(el)
    }

    return () => {
      ro?.disconnect()
      chart?.remove()
      chartRef.current = null
      allSeriesRef.current = []
      setChartReady(false)
    }
    // isDark intentionally excluded – handled by separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Update theme ─────────────────────────────────────────────────────────
  useEffect(() => {
    chartRef.current?.applyOptions(getChartThemeOptions(isDark))
  }, [isDark])

  // ── Rebuild all series when data, chart type, or chart readiness changes ──
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !chartReady) return

    // Remove old series
    for (const s of allSeriesRef.current) {
      try { chart.removeSeries(s) } catch { /* ignore */ }
    }
    allSeriesRef.current = []

    if (sensorSeries.length === 0 || !hasData) return

    for (const sensor of sensorSeries) {
      if (sensor.data.length === 0) continue
      const { color, data } = sensor

      if (chartType === "line") {
        const s = chart.addSeries(LineSeries, { color, lineWidth: 2, priceLineVisible: false, title: sensor.name })
        s.setData(data)
        allSeriesRef.current.push(s)
      } else if (chartType === "area") {
        const s = chart.addSeries(AreaSeries, {
          lineColor: color,
          topColor: `${color}44`,
          bottomColor: `${color}05`,
          lineWidth: 2,
          priceLineVisible: false,
          title: sensor.name,
        })
        s.setData(data)
        allSeriesRef.current.push(s)
      } else {
        const s = chart.addSeries(HistogramSeries, {
          color,
          priceLineVisible: false,
          title: sensor.name,
        })
        s.setData(data.map((d) => ({ ...d, color })))
        allSeriesRef.current.push(s)
      }
    }

    chart.timeScale().fitContent()
  }, [sensorSeries, chartType, chartReady, hasData])

  if (!from || !to) return null

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Tendencia por Sensor</CardTitle>
          <CardDescription>
            Evolución de los primeros {Math.min(sourceSensors.length, 8)} sensores en el período seleccionado
            {coverage && coverage.total > coverage.queried
              ? ` · resumen rápido: ${coverage.queried}/${coverage.total}`
              : ""}
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isRefreshing && (
            <span className="text-xs text-muted-foreground animate-pulse">Actualizando…</span>
          )}

          {/* Tipo de gráfico */}
          <div className="flex rounded-md border overflow-hidden">
            {(["line", "area", "histogram"] as ChartType[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={chartType === t ? "default" : "ghost"}
                className="h-7 rounded-none px-3 text-xs"
                onClick={() => setChartType(t)}
              >
                {t === "line" ? "Línea" : t === "area" ? "Área" : "Barras"}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend */}
        {sensorSeries.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {sensorSeries.map((s) => (
              <div key={s.sensorId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="truncate max-w-[140px]">{s.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="relative w-full" style={{ minHeight: 320 }}>
          {/* Overlay: loading or empty state */}
          {(loading && !hasData) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center text-muted-foreground">
              Cargando…
            </div>
          )}
          {(!loading && !hasData) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center text-muted-foreground">
              Sin datos para el rango seleccionado
            </div>
          )}

          {/* Chart container — always rendered so the chart can initialize */}
          <div
            ref={containerRef}
            className="w-full"
            style={{ height: 320, opacity: hasData ? 1 : 0, transition: "opacity 0.3s" }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
