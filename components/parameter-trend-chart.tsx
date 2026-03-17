"use client"

import { useEffect, useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"
import type { Promedio } from "@/lib/backend-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type ParamKey = string

type TrendPoint = {
  ts: string // ISO
  value: number
  muestras: number
}

type OptionWithCount = {
  value: string
  count: number
}

function normalizeTs(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toISOString()
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

function getTipoMedidaFromSensor(sensor: any): string {
  // Preferimos el tipo real de BD si existe.
  const raw =
    sensor?.tipoMedida ??
    sensor?.tipo_medida ??
    sensor?.catalogo_sensores?.tipo_medida ??
    sensor?.catalogo?.tipo_medida ??
    sensor?.type

  return String(raw || "")
}

function detectCanonicalType(sensor: any): string {
  const raw = getTipoMedidaFromSensor(sensor)
  const t = normalizeKey(raw)
  const u = String(sensor?.unit || "").toLowerCase()
  const n = String(sensor?.name || sensor?.descripcion || "").toLowerCase()

  if (t.includes("ph") || t.includes("potencial") || t.includes("hidrogeno") || t.includes("hidrógeno")) return "ph"
  if (t.includes("temp") || t.includes("temperatura")) return "temperature"
  if (t.includes("ox") || t.includes("oxígeno") || t.includes("oxigeno") || t.includes("oxygen") || t.includes("o2")) return "oxygen"
  if (t.includes("sal") || t.includes("salinidad")) return "salinity"
  if (t.includes("turb") || t.includes("turbidez")) return "turbidity"
  if (t.includes("nitrat") || t.includes("nitrato")) return "nitrates"
  if (t.includes("amon") || t.includes("ammo") || t.includes("amoniaco") || t.includes("amoníaco")) return "ammonia"
  if (t.includes("baro") || t.includes("presión") || t.includes("presion")) return "barometric"

  if (u.includes("ph")) return "ph"
  if (u.includes("°c") || u === "c" || u.endsWith(" c")) return "temperature"
  if (u.includes("mg/l") && (n.includes("ox") || n.includes("o2") || t.includes("ox"))) return "oxygen"
  if (u.includes("ppt")) return "salinity"
  if (u.includes("ntu")) return "turbidity"
  if (u.includes("hpa")) return "barometric"

  // fallback por nombre
  if (n.includes("ph") || n.includes("potencial") || n.includes("hidrogeno") || n.includes("hidrógeno")) return "ph"
  if (n.includes("temp") || n.includes("temperatura")) return "temperature"
  if (n.includes("ox") || n.includes("oxígeno") || n.includes("oxigeno") || n.includes("oxygen") || n.includes("o2")) return "oxygen"
  if (n.includes("sal") || n.includes("salinidad")) return "salinity"
  if (n.includes("turb") || n.includes("turbidez")) return "turbidity"
  if (n.includes("nitrat") || n.includes("nitrato")) return "nitrates"
  if (n.includes("amon") || n.includes("ammo") || n.includes("amoniaco") || n.includes("amoníaco")) return "ammonia"
  if (n.includes("baro") || n.includes("presión") || n.includes("presion")) return "barometric"

  return "other"
}

function humanizeTipoMedida(raw: string): string {
  const cleaned = raw.trim()
  if (!cleaned) return "Otro"
  // Capitalización simple, conservando siglas.
  return cleaned
    .split(/\s+/)
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ")
}

function pickMeta(param: ParamKey, sensors: any[]) {
  const colorMap: Record<string, string> = {
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

  const labelMap: Record<string, string> = {
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

  const match = sensors.find((s) => normalizeKey(getTipoMedidaFromSensor(s)) === normalizeKey(param))
  const canonical = match ? detectCanonicalType(match) : "other"
  const unit = match?.unit || (canonical === "temperature" ? "°C" : canonical === "oxygen" ? "mg/L" : "")
  return {
    label: labelMap[canonical] || humanizeTipoMedida(param),
    unit,
    color: colorMap[canonical] || colorMap.other,
  }
}
export function ParameterTrendChart({
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
  const [parameter, setParameter] = useState<ParamKey>("temperature")

  const from = dateRange?.from
  const to = dateRange?.to

  const sourceSensors = useMemo(() => (Array.isArray(sensors) ? sensors : []), [sensors])

  const availableTypeOptions = useMemo<OptionWithCount[]>(() => {
    const map = new Map<string, OptionWithCount>()
    sourceSensors.forEach((s: any) => {
      const raw = getTipoMedidaFromSensor(s)
      const key = normalizeKey(raw)
      if (!key) return
      const prev = map.get(key)
      if (!prev) {
        map.set(key, { value: raw, count: 1 })
        return
      }
      prev.count += 1
    })
    return Array.from(map.values()).sort((a, b) => a.value.localeCompare(b.value, "es"))
  }, [sourceSensors])

  const availableTypes = useMemo(() => availableTypeOptions.map((option) => option.value), [availableTypeOptions])

  useEffect(() => {
    if (availableTypes.length && !availableTypes.includes(parameter)) {
      setParameter(availableTypes[0])
    }
  }, [availableTypes, parameter])

  const sensorsToQuery = useMemo(() => {
    const key = normalizeKey(parameter)
    return (sourceSensors || [])
      .filter((s: any) => normalizeKey(getTipoMedidaFromSensor(s)) === key)
      .slice(0, 12)
  }, [sourceSensors, parameter])

  const sensorsAvailableForParameter = useMemo(() => {
    const key = normalizeKey(parameter)
    return (sourceSensors || []).filter((s: any) => normalizeKey(getTipoMedidaFromSensor(s)) === key).length
  }, [sourceSensors, parameter])

  const data = useMemo<TrendPoint[]>(() => {
    if (!from || !to || !seriesBySensor || sensorsToQuery.length === 0) return []

    const agg = new Map<string, { sumWV: number; sumW: number }>()
    for (const sensor of sensorsToQuery) {
      const sensorId = Number(sensor.id_sensor_instalado)
      const rows = seriesBySensor.get(sensorId) ?? []
      for (const point of rows) {
        const t = new Date(point.timestamp).getTime()
        if (!Number.isFinite(t) || t < from.getTime() || t > to.getTime()) continue

        const ts = normalizeTs(point.timestamp)
        const weightRaw = Number(point.muestras ?? 1)
        const weight = Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : 1
        const value = Number(point.promedio ?? 0)
        if (!Number.isFinite(value)) continue

        const current = agg.get(ts) ?? { sumWV: 0, sumW: 0 }
        current.sumWV += value * weight
        current.sumW += weight
        agg.set(ts, current)
      }
    }

    return Array.from(agg.entries())
      .map(([ts, value]) => ({
        ts,
        value: value.sumW > 0 ? value.sumWV / value.sumW : 0,
        muestras: value.sumW,
      }))
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
  }, [from, to, sensorsToQuery, seriesBySensor])

  const meta = pickMeta(parameter, sourceSensors)
  const chartConfig = {
    value: {
      label: meta.label,
      color: meta.color,
    },
  } satisfies ChartConfig

  if (!from || !to) return null

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Tendencia ({meta.label})</CardTitle>
          <CardDescription>
            Línea con puntos (tipo monedas) usando promedios por intervalo en el rango seleccionado
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {isRefreshing && <span className="text-xs text-muted-foreground animate-pulse">Actualizando...</span>}
          <div className="w-44">
            <Select value={parameter} onValueChange={(v) => setParameter(v as ParamKey)}>
              <SelectTrigger>
                <SelectValue placeholder="Parámetro" />
              </SelectTrigger>
              <SelectContent>
                {availableTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {(() => {
                      const info = pickMeta(option.value, sourceSensors)
                      const raw = humanizeTipoMedida(option.value)
                      const label =
                        info.label.toLowerCase() === raw.toLowerCase()
                          ? info.label
                          : `${info.label} · ${raw}`
                      return `${label} (${option.count})`
                    })()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {coverage && sensorsAvailableForParameter > sensorsToQuery.length && (
          <div className="mb-3 text-xs text-muted-foreground">
            Tendencia rápida basada en {sensorsToQuery.length}/{sensorsAvailableForParameter} sensores del parámetro.
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-muted-foreground">Cargando…</div>
        ) : data.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No hay datos para {meta.label} en el rango
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-72">
              <LineChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ts"
                  tickFormatter={(v: any) => {
                    const d = new Date(String(v))
                    return isNaN(d.getTime()) ? String(v) : format(d, "dd/MM HH:mm", { locale: es })
                  }}
                  minTickGap={32}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => {
                        const d = new Date(String(label))
                        return isNaN(d.getTime()) ? String(label) : format(d, "dd MMM yyyy HH:mm", { locale: es })
                      }}
                      valueFormatter={(value) => {
                        const n = Number(value)
                        const unit = meta.unit ? ` ${meta.unit}` : ""
                        return `${Number.isFinite(n) ? n.toFixed(2) : "0.00"}${unit}`
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              </LineChart>
          </ChartContainer>
        )}

        {!loading && sensorsToQuery.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Sensores considerados: {sensorsToQuery.length} de {sensorsAvailableForParameter}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
