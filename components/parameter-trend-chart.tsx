"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"
import { backendApi, type Promedio } from "@/lib/backend-client"
import { useSensors } from "@/hooks/use-sensors"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type ParamKey = string

type TrendPoint = {
  ts: string // ISO
  value: number
  muestras: number
}

function computeBucketMinutes(from: Date, to: Date, targetPoints = 240): number {
  const totalMinutes = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 60000))
  const bucket = Math.ceil(totalMinutes / targetPoints)
  return Math.max(5, bucket)
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

export function ParameterTrendChart({ dateRange, sensors }: { dateRange: DateRange; sensors?: any[] }) {
  const { sensors: hookSensors = [], loading: sensorsLoading, error: sensorsError } = useSensors()
  const [parameter, setParameter] = useState<ParamKey>("temperature")
  const [data, setData] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasData = useRef(false)

  const from = dateRange?.from
  const to = dateRange?.to

  const sourceSensors = useMemo(() => (sensors && sensors.length ? sensors : hookSensors), [sensors, hookSensors])

  const availableTypes = useMemo(() => {
    const map = new Map<string, string>()
    sourceSensors.forEach((s: any) => {
      const raw = getTipoMedidaFromSensor(s)
      const key = normalizeKey(raw)
      if (!key) return
      // conservar el primer valor "bonito" para mostrar
      if (!map.has(key)) map.set(key, raw)
    })
    // orden estable por label
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1], "es"))
      .map(([, raw]) => raw)
  }, [sourceSensors])

  useEffect(() => {
    if (availableTypes.length && !availableTypes.includes(parameter)) {
      setParameter(availableTypes[0])
    }
  }, [availableTypes, parameter])

  const sensorsToQuery = useMemo(() => {
    const key = normalizeKey(parameter)
    return (sourceSensors || []).filter((s: any) => normalizeKey(getTipoMedidaFromSensor(s)) === key)
  }, [sourceSensors, parameter])

  useEffect(() => {
    if (!from || !to) return
    if (!sensorsToQuery.length) {
      setData([])
      hasData.current = false
      return
    }

    if (!hasData.current) setLoading(true)
    else setIsRefreshing(true)

    setError(null)
    let cancelled = false

    ;(async () => {
      try {
        const bucketMinutes = computeBucketMinutes(from, to, 100)
        const desde = from.toISOString()
        const hasta = to.toISOString()

        // Usar concurrencia limitada para no saturar el servidor
        const results = await mapWithConcurrency(
          sensorsToQuery,
          3, // máximo 3 requests simultáneos para mejor velocidad
          async (s: any) => {
            const id = Number(s.id_sensor_instalado)
            if (!id) return [] as Promedio[]

            const resp = await backendApi
              .getPromedios({ sensorInstaladoId: id, bucketMinutes, desde, hasta })
              .catch(() => [] as Promedio[])

            return ((resp as any[]) as Promedio[]).filter((p) => {
              const t = new Date(p.timestamp).getTime()
              return Number.isFinite(t) && t >= from.getTime() && t <= to.getTime()
            })
          },
        )

        // Aggregate by timestamp with weights (muestras)
        const agg = new Map<string, { sumWV: number; sumW: number }>()
        for (const arr of results) {
          for (const p of arr) {
            const ts = normalizeTs(p.timestamp)
            const w = Number((p as any).muestras ?? 1)
            const v = Number((p as any).promedio ?? 0)
            if (!Number.isFinite(v)) continue
            const weight = Number.isFinite(w) && w > 0 ? w : 1
            const prev = agg.get(ts) || { sumWV: 0, sumW: 0 }
            prev.sumWV += v * weight
            prev.sumW += weight
            agg.set(ts, prev)
          }
        }

        const merged: TrendPoint[] = Array.from(agg.entries())
          .map(([ts, x]) => ({ ts, value: x.sumW > 0 ? x.sumWV / x.sumW : 0, muestras: x.sumW }))
          .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())

        if (!cancelled) {
          setData(merged)
          hasData.current = merged.length > 0
        }
      } catch (e: any) {
        console.error("[ParameterTrendChart] error", e)
        if (!cancelled) {
          setError(e?.message || "Error al obtener tendencia")
          if (!hasData.current) setData([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setIsRefreshing(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [from, to, sensorsToQuery])

  const anyError = sensorsError || error
  const meta = pickMeta(parameter, sourceSensors)

  if (!from || !to) return null

  if (anyError && data.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{String(anyError)}</AlertDescription>
      </Alert>
    )
  }

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
                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {pickMeta(t, sourceSensors).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {anyError && data.length > 0 && <div className="mb-2 text-xs text-destructive">{String(anyError)}</div>}

        {sensorsLoading && data.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-muted-foreground">Cargando…</div>
        ) : data.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No hay datos para {meta.label} en el rango
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
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
                <Tooltip
                  labelFormatter={(label: any) => {
                    const d = new Date(String(label))
                    return isNaN(d.getTime()) ? String(label) : format(d, "dd MMM yyyy HH:mm", { locale: es })
                  }}
                  formatter={(value: any) => {
                    const n = Number(value)
                    const unit = meta.unit ? ` ${meta.unit}` : ""
                    return [`${Number.isFinite(n) ? n.toFixed(2) : "0.00"}${unit}`, meta.label]
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={meta.color}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && sensorsToQuery.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Sensores considerados: {sensorsToQuery.length}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
