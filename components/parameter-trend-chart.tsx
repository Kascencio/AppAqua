"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"
import type { Promedio } from "@/lib/backend-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
type ParamKey = string
type TrendPoint = { time: Time; value: number }
type OptionWithCount = { value: string; count: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toChartTimeSec(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000)
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

function getTipoMedidaFromSensor(sensor: unknown): string {
  const s = sensor as Record<string, unknown>
  const raw =
    s?.tipoMedida ??
    s?.tipo_medida ??
    (s?.catalogo_sensores as Record<string, unknown>)?.tipo_medida ??
    (s?.catalogo as Record<string, unknown>)?.tipo_medida ??
    s?.type
  return String(raw || "")
}

function detectCanonicalType(sensor: unknown): string {
  const raw = normalizeKey(getTipoMedidaFromSensor(sensor))
  const s = sensor as Record<string, unknown>
  const u = String(s?.unit || "").toLowerCase()
  const n = String(s?.name || (s as Record<string, unknown>)?.descripcion || "").toLowerCase()
  if (raw.includes("ph") || raw.includes("potencial")) return "ph"
  if (raw.includes("temp")) return "temperature"
  if (raw.includes("ox") || raw.includes("oxygen") || raw.includes("o2")) return "oxygen"
  if (raw.includes("sal")) return "salinity"
  if (raw.includes("turb")) return "turbidity"
  if (raw.includes("nitrat")) return "nitrates"
  if (raw.includes("amon") || raw.includes("ammo")) return "ammonia"
  if (raw.includes("baro") || raw.includes("presion") || raw.includes("presión")) return "barometric"
  if (u.includes("ph")) return "ph"
  if (u.includes("°c") || u === "c") return "temperature"
  if (u.includes("ppt")) return "salinity"
  if (u.includes("ntu")) return "turbidity"
  if (u.includes("hpa")) return "barometric"
  if (n.includes("ph")) return "ph"
  if (n.includes("temp")) return "temperature"
  if (n.includes("ox") || n.includes("o2")) return "oxygen"
  return "other"
}

function humanizeTipoMedida(raw: string): string {
  const cleaned = raw.trim()
  if (!cleaned) return "Otro"
  return cleaned
    .split(/\s+/)
    .map((w) =>
      w.length <= 3 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ")
}

const COLOR_MAP: Record<string, string> = {
  temperature: "#2563eb",
  ph: "#7c3aed",
  oxygen: "#059669",
  salinity: "#06b6d4",
  turbidity: "#84cc16",
  nitrates: "#f59e0b",
  ammonia: "#8b5cf6",
  barometric: "#f97316",
  other: "#6b7280",
}

const LABEL_MAP: Record<string, string> = {
  temperature: "Temperatura",
  ph: "pH",
  oxygen: "Oxígeno",
  salinity: "Salinidad",
  turbidity: "Turbidez",
  nitrates: "Nitratos",
  ammonia: "Amonio",
  barometric: "Presión Atmosférica",
  other: "Otro",
}

function pickMeta(param: string, sensors: unknown[]) {
  const match = sensors.find((s) => normalizeKey(getTipoMedidaFromSensor(s)) === normalizeKey(param))
  const canonical = match ? detectCanonicalType(match) : "other"
  const s = match as Record<string, unknown> | undefined
  const unit = String(s?.unit || (canonical === "temperature" ? "°C" : canonical === "oxygen" ? "mg/L" : ""))
  return {
    label: LABEL_MAP[canonical] || humanizeTipoMedida(param),
    unit,
    color: COLOR_MAP[canonical] || COLOR_MAP.other,
  }
}

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

export function ParameterTrendChart({
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
  const seriesRef = useRef<ISeriesApi<any> | null>(null)

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [chartType, setChartType] = useState<ChartType>("area")
  const [parameter, setParameter] = useState<ParamKey>("temperature")

  const from = dateRange?.from
  const to = dateRange?.to
  const sourceSensors = useMemo(() => (Array.isArray(sensors) ? sensors : []), [sensors])

  // Available parameter options
  const availableTypeOptions = useMemo<OptionWithCount[]>(() => {
    const map = new Map<string, OptionWithCount>()
    sourceSensors.forEach((s) => {
      const raw = getTipoMedidaFromSensor(s)
      const key = normalizeKey(raw)
      if (!key) return
      const prev = map.get(key)
      if (!prev) { map.set(key, { value: raw, count: 1 }); return }
      prev.count += 1
    })
    return Array.from(map.values()).sort((a, b) => a.value.localeCompare(b.value, "es"))
  }, [sourceSensors])

  useEffect(() => {
    const available = availableTypeOptions.map((o) => o.value)
    if (available.length && !available.includes(parameter)) setParameter(available[0])
  }, [availableTypeOptions, parameter])

  const meta = pickMeta(parameter, sourceSensors)

  // Aggregate: weighted average over all sensors of the selected parameter type
  const chartData = useMemo<TrendPoint[]>(() => {
    if (!from || !to || !seriesBySensor) return []

    const sensorsForParam = (sourceSensors as Array<Record<string, unknown>>).filter(
      (s) => normalizeKey(getTipoMedidaFromSensor(s)) === normalizeKey(parameter),
    ).slice(0, 12)

    if (sensorsForParam.length === 0) return []

    const agg = new Map<number, { sumWV: number; sumW: number }>()

    for (const sensor of sensorsForParam) {
      const sensorId = Number(sensor.id_sensor_instalado || 0)
      const rows = seriesBySensor.get(sensorId) ?? []
      for (const point of rows) {
        const t = new Date(point.timestamp).getTime()
        if (!Number.isFinite(t) || t < from.getTime() || t > to.getTime()) continue
        const timeSec = Math.floor(t / 1000)
        const weight =
          Number.isFinite(Number(point.muestras)) && Number(point.muestras) > 0 ? Number(point.muestras) : 1
        const value = Number(point.promedio ?? 0)
        if (!Number.isFinite(value)) continue
        const current = agg.get(timeSec) ?? { sumWV: 0, sumW: 0 }
        current.sumWV += value * weight
        current.sumW += weight
        agg.set(timeSec, current)
      }
    }

    return Array.from(agg.entries())
      .map(([timeSec, { sumWV, sumW }]) => ({
        time: timeSec as Time,
        value: sumW > 0 ? sumWV / sumW : 0,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number))
  }, [from, to, sourceSensors, seriesBySensor, parameter])

  // ── Create chart once ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      ...getChartThemeOptions(isDark),
      width: containerRef.current.clientWidth,
      height: 320,
      handleScroll: true,
      handleScale: true,
    })
    chartRef.current = chart

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Update theme ─────────────────────────────────────────────────────────
  useEffect(() => {
    chartRef.current?.applyOptions(getChartThemeOptions(isDark))
  }, [isDark])

  // ── Rebuild series when type, data or color changes ──────────────────────
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current)
      seriesRef.current = null
    }

    if (chartData.length === 0) return

    const color = meta.color

    if (chartType === "line") {
      const s = chart.addSeries(LineSeries, { color, lineWidth: 2, priceLineVisible: false })
      s.setData(chartData)
      seriesRef.current = s
    } else if (chartType === "area") {
      const s = chart.addSeries(AreaSeries, {
        lineColor: color,
        topColor: `${color}55`,
        bottomColor: `${color}08`,
        lineWidth: 2,
        priceLineVisible: false,
      })
      s.setData(chartData)
      seriesRef.current = s
    } else {
      const s = chart.addSeries(HistogramSeries, { color, priceLineVisible: false })
      s.setData(chartData)
      seriesRef.current = s
    }

    chart.timeScale().fitContent()
  }, [chartData, chartType, meta.color])

  if (!from || !to) return null

  const sensorsCount = sourceSensors.filter(
    (s) => normalizeKey(getTipoMedidaFromSensor(s)) === normalizeKey(parameter),
  ).length

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Tendencia — {meta.label}</CardTitle>
          <CardDescription>
            Promedio ponderado por intervalo · {sensorsCount} sensor{sensorsCount !== 1 ? "es" : ""}
            {meta.unit ? ` · ${meta.unit}` : ""}
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

          {/* Selector de parámetro */}
          <div className="w-44">
            <Select value={parameter} onValueChange={setParameter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Parámetro" />
              </SelectTrigger>
              <SelectContent>
                {availableTypeOptions.map((option) => {
                  const info = pickMeta(option.value, sourceSensors)
                  const raw = humanizeTipoMedida(option.value)
                  const label =
                    info.label.toLowerCase() === raw.toLowerCase() ? info.label : `${info.label} · ${raw}`
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      {label} ({option.count})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative w-full">
          {(chartData.length === 0 || (loading && chartData.length === 0)) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm text-muted-foreground">
              {loading && chartData.length === 0 ? "Cargando…" : "Sin datos para el rango seleccionado"}
            </div>
          )}
          <div
            ref={containerRef}
            className={`w-full transition-opacity duration-300 ${chartData.length === 0 ? "opacity-0" : "opacity-100"}`}
            style={{ minHeight: 320 }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
