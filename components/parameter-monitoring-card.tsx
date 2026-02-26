"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ParametroMonitoreo } from "@/types/lectura"
import { Thermometer, Droplets, Zap, Eye, Download, RefreshCw } from "lucide-react"
import { backendApi, type Lectura as BackendLectura } from "@/lib/backend-client"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface ParameterMonitoringCardProps {
  parametro: ParametroMonitoreo
  isRealTime?: boolean
  showModeToggle?: boolean
}

const getParameterIcon = (nombre: string) => {
  switch (nombre.toLowerCase()) {
    case "temperatura":
      return <Thermometer className="h-4 w-4" />
    case "ph":
      return <Droplets className="h-4 w-4" />
    case "oxígeno disuelto":
    case "oxigeno":
      return <Droplets className="h-4 w-4" />
    case "turbidez":
      return <Eye className="h-4 w-4" />
    case "conductividad":
      return <Zap className="h-4 w-4" />
    default:
      return <Droplets className="h-4 w-4" />
  }
}

const getStatusColor = (estado: string) => {
  switch (estado) {
    case "normal":
      return "bg-green-100 text-green-800 border-green-200"
    case "advertencia":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "critico":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getChartColor = (estado: string) => {
  switch (estado) {
    case "normal":
      return "#22c55e"
    case "advertencia":
      return "#f59e0b"
    case "critico":
      return "#ef4444"
    default:
      return "#6b7280"
  }
}

export function ParameterMonitoringCard({
  parametro,
  isRealTime,
  showModeToggle = true,
}: ParameterMonitoringCardProps) {
  const [localIsRealTime, setLocalIsRealTime] = useState(false)
  const [lecturas, setLecturas] = useState(parametro.lecturas ?? [])
  const [loading, setLoading] = useState(false)
  const effectiveIsRealTime = isRealTime ?? localIsRealTime

  // Refetch de datos reales cada 30s en modo tiempo real
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    if (effectiveIsRealTime) {
      const fetchLecturas = async () => {
        setLoading(true)
        try {
          const sensorInstaladoId = Number(
            (parametro as any).sensorInstaladoId ??
              (parametro as any).id_sensor_instalado ??
              (parametro as any).id_sensor_instalado_id ??
              (parametro as any).id_sensor,
          )

          if (!sensorInstaladoId || Number.isNaN(sensorInstaladoId)) {
            // No hay forma confiable de refrescar sin sensorInstaladoId
            return
          }

          const hasta = new Date().toISOString()
          const desde = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          const resp = await backendApi.getLecturas({
            sensorInstaladoId,
            page: 1,
            limit: 5000,
            desde,
            hasta,
          })

          const payload: any = resp
          const rows: BackendLectura[] = Array.isArray(payload) ? payload : (payload.data || [])

          const mapped = rows
            .map((l) => {
              const ts = (l as any).tomada_en || ((l as any).fecha && (l as any).hora ? `${(l as any).fecha}T${(l as any).hora}` : (l as any).created_at)
              const timestamp = ts ? new Date(ts).toISOString() : new Date().toISOString()
              const valor = Number((l as any).valor ?? 0)
              return {
                timestamp,
                valor,
                estado: "normal",
              }
            })
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

          setLecturas(mapped as any)
        } catch {
          // Mantener lecturas previas si hay error
        } finally {
          setLoading(false)
        }
      }
      fetchLecturas()
      interval = setInterval(fetchLecturas, 30000)
    } else {
      setLecturas(parametro.lecturas ?? [])
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [effectiveIsRealTime, parametro])

  // Preparar datos para la gráfica
  const chartData = useMemo(() => {
    return lecturas
      .map((lectura) => {
        const date = new Date(lectura.timestamp)
        const isValid = !Number.isNaN(date.getTime())
        return {
          time: isValid
            ? date.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--:--",
          timestampMs: isValid ? date.getTime() : 0,
          valor: Number(lectura.valor ?? 0),
          timestamp: lectura.timestamp,
          estado: lectura.estado || "normal",
        }
      })
      .filter((point) => Number.isFinite(point.valor) && Number.isFinite(point.timestampMs) && point.timestampMs > 0)
      .sort((a, b) => a.timestampMs - b.timestampMs)
  }, [lecturas])

  const chartBounds = useMemo(() => {
    const values = chartData.map((point) => point.valor)
    const minData = values.length > 0 ? Math.min(...values) : 0
    const maxData = values.length > 0 ? Math.max(...values) : 1
    const minRange = Number(parametro.rango_min)
    const maxRange = Number(parametro.rango_max)
    const hasRange = Number.isFinite(minRange) && Number.isFinite(maxRange) && minRange < maxRange
    const minBase = hasRange ? Math.min(minData, minRange) : minData
    const maxBase = hasRange ? Math.max(maxData, maxRange) : maxData
    const span = Math.max(1, maxBase - minBase)
    const padding = span * 0.15

    return {
      hasRange,
      minRange,
      maxRange,
      minY: minBase - padding,
      maxY: maxBase + padding,
    }
  }, [chartData, parametro.rango_min, parametro.rango_max])

  const downloadCSV = () => {
    if (chartData.length === 0) return
    let csvContent = "data:text/csv;charset=utf-8,"
    const nombre = parametro.nombre ?? parametro.nombre_parametro ?? "Parametro"
    const unidad = parametro.unidad ?? parametro.unidad_medida ?? ""
    csvContent += `Tiempo,${nombre} (${unidad})\n`
    for (let i = 0; i < chartData.length; i++) {
      csvContent += `${chartData[i].time},${chartData[i].valor}\n`
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${nombre.toLowerCase().replace(/\s+/g, "_")}_data.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleRealTime = () => {
    if (isRealTime !== undefined) return
    setLocalIsRealTime((prev) => !prev)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getParameterIcon(parametro.nombre ?? parametro.nombre_parametro ?? "")}
            <span className="font-medium text-sm">{parametro.nombre ?? parametro.nombre_parametro}</span>
            <span className="text-xs text-muted-foreground">{parametro.unidad ?? parametro.unidad_medida}</span>
          </div>
          <div className="flex items-center gap-2">
            {(parametro.alertas_count ?? 0) > 0 && (
              <Badge variant="destructive" className="text-xs">
                {parametro.alertas_count ?? 0}
              </Badge>
            )}
            {showModeToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleRealTime}
                className={`text-xs ${effectiveIsRealTime ? "bg-green-50 border-green-200 text-green-700" : ""}`}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${effectiveIsRealTime ? "animate-spin" : ""}`} />
                {effectiveIsRealTime ? "Tiempo Real" : "Histórico"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={downloadCSV}>
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {effectiveIsRealTime
            ? `Tiempo real • Rango: ${parametro.rango_min ?? 0} - ${parametro.rango_max ?? 0}`
            : `Promedio: ${(parametro.promedio ?? 0).toFixed(1)} ${parametro.unidad ?? parametro.unidad_medida ?? ""} • Rango: ${parametro.rango_min ?? 0} - ${parametro.rango_max ?? 0}`}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-48 mb-3">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="timestampMs"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  scale="time"
                  tick={{ fontSize: 10 }}
                  minTickGap={24}
                  tickFormatter={(value: number) =>
                    new Date(value).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  width={48}
                  domain={[chartBounds.minY, chartBounds.maxY]}
                  tickFormatter={(value: number) => Number(value).toFixed(1)}
                />
                {chartBounds.hasRange && (
                  <ReferenceArea
                    y1={chartBounds.minRange}
                    y2={chartBounds.maxRange}
                    fill="#22c55e"
                    fillOpacity={0.08}
                    strokeOpacity={0}
                  />
                )}
                {chartBounds.hasRange && (
                  <>
                    <ReferenceLine y={chartBounds.minRange} stroke="#16a34a" strokeDasharray="4 4" />
                    <ReferenceLine y={chartBounds.maxRange} stroke="#16a34a" strokeDasharray="4 4" />
                  </>
                )}
                <Tooltip
                  formatter={(value: number) => [
                    `${Number(value).toFixed(2)} ${parametro.unidad ?? parametro.unidad_medida ?? ""}`.trim(),
                    parametro.nombre ?? parametro.nombre_parametro ?? "Valor",
                  ]}
                  labelFormatter={(label) =>
                    new Date(Number(label)).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke={getChartColor(parametro.estado ?? "normal")}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff" }}
                  isAnimationActive={!effectiveIsRealTime}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground">
              No hay lecturas para graficar en este período
            </div>
          )}
        </div>
        {/* Estado actual */}
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(parametro.estado ?? "normal")}`}
          >
            {parametro.estado === "normal" && "✓ Normal"}
            {parametro.estado === "advertencia" && "⚠️ Advertencia"}
            {parametro.estado === "critico" && "🚨 Crítico"}
          </div>
          {effectiveIsRealTime && (
            <div className="text-xs text-muted-foreground">
              Actualizando cada 30s • {chartData.length} puntos
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
