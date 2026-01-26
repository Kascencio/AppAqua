"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Activity, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { backendApi, type Lectura as BackendLectura } from "@/lib/backend-client"

interface ProcessSensorChartProps {
  sensorId: string
  parameter: string
  unit: string
  facilityId: string
  dateRange: { from: Date; to: Date }
  optimalRange?: { min: number; max: number }
  height?: number
}

const PARAMETER_CONFIG: Record<string, { name: string; color: string; optimalRange: { min: number; max: number } }> = {
  temperature: {
    name: "Temperatura",
    color: "#ef4444",
    optimalRange: { min: 24, max: 28 },
  },
  oxygen: {
    name: "Oxígeno Disuelto",
    color: "#3b82f6",
    optimalRange: { min: 6, max: 8 },
  },
  ph: {
    name: "pH",
    color: "#10b981",
    optimalRange: { min: 7, max: 7.5 },
  },
  salinity: {
    name: "Salinidad",
    color: "#8b5cf6",
    optimalRange: { min: 30, max: 35 },
  },
  turbidity: {
    name: "Turbidez",
    color: "#f59e0b",
    optimalRange: { min: 0, max: 5 },
  },
  nitrates: {
    name: "Nitratos",
    color: "#ec4899",
    optimalRange: { min: 0, max: 20 },
  },
  ammonia: {
    name: "Amonio",
    color: "#06b6d4",
    optimalRange: { min: 0, max: 0.5 },
  },
}

export function ProcessSensorChart({
  sensorId,
  parameter,
  unit,
  facilityId,
  dateRange,
  optimalRange,
  height = 200,
}: ProcessSensorChartProps) {
  const [isRealTime, setIsRealTime] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = PARAMETER_CONFIG[parameter] || {
    name: parameter,
    color: "#6b7280",
    optimalRange: { min: 0, max: 100 },
  }
  const range = optimalRange || config.optimalRange

  // Refetch de datos reales cada 30s en modo tiempo real
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const resp = await backendApi.getLecturas({
          sensorInstaladoId: Number(sensorId),
          page: 1,
          limit: 5000,
          desde: dateRange.from.toISOString(),
          hasta: dateRange.to.toISOString(),
        })

        const payload: any = resp
        const lecturas: BackendLectura[] = Array.isArray(payload) ? payload : (payload.data || [])

        const mapped = lecturas
          .map((l) => {
            const ts = (l as any).tomada_en || ((l as any).fecha && (l as any).hora ? `${(l as any).fecha}T${(l as any).hora}` : (l as any).created_at)
            const timestamp = ts ? new Date(ts).toISOString() : new Date().toISOString()
            const value = Number((l as any).valor ?? 0)
            const status = value < range.min || value > range.max ? "critical" : "normal"
            return { timestamp, value, status }
          })
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        setChartData(mapped)
      } catch {
        setError("Error al obtener lecturas")
      } finally {
        setLoading(false)
      }
    }
    if (isRealTime) {
      fetchData()
      interval = setInterval(fetchData, 30000)
    } else {
      fetchData()
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRealTime, facilityId, sensorId, parameter, dateRange])

  // Estadísticas
  const values = chartData?.map((d) => d.value) || []
  const alerts = chartData?.filter((d) => d.status === "critical").length || 0
  const avg = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  const min = values.length > 0 ? Math.min(...values) : 0
  const max = values.length > 0 ? Math.max(...values) : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    try {
      const timestamp = new Date(label)
      if (isNaN(timestamp.getTime())) return null
      const value = payload[0].value
      const status = chartData?.find((d) => d.timestamp === label)?.status
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-sm mb-1">{format(timestamp, "dd/MM/yyyy HH:mm", { locale: es })}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
            <span className={`font-medium ${status === "critical" ? "text-red-600" : ""}`}>{value?.toFixed(2)} {unit}</span>
            {status === "critical" && (
              <Badge variant="destructive" className="text-xs">Fuera de rango</Badge>
            )}
          </div>
        </div>
      )
    } catch (error) {
      return null
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <CardTitle className="text-sm">{config.name}</CardTitle>
          <Badge variant="outline" className="text-xs">{unit}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
            className={`text-xs ${isRealTime ? "bg-green-50 border-green-200 text-green-700" : ""}`}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRealTime ? "animate-spin" : ""}`} />
            {isRealTime ? "Tiempo Real" : "Histórico"}
          </Button>
        </div>
        <CardDescription className="text-xs">
          Promedio: {avg.toFixed(1)} {unit} • Rango: {min.toFixed(1)} - {max.toFixed(1)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="timestamp" tickFormatter={(time) => format(new Date(time), "HH:mm")} fontSize={10} />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              fontSize={10}
              tickFormatter={(value) => `${value.toFixed(1)}`}
            />
            <ReferenceLine y={range.min} stroke="#10b981" strokeDasharray="2 2" opacity={0.5} />
            <ReferenceLine y={range.max} stroke="#10b981" strokeDasharray="2 2" opacity={0.5} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              dot={(props: any) => {
                const dataPoint = chartData.find((d) => d.timestamp === props.payload?.timestamp)
                if (dataPoint?.status === "critical") {
                  return <circle cx={props.cx} cy={props.cy} r={4} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
                }
                return <circle cx={props.cx} cy={props.cy} r={2} fill={config.color} />
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
        {isRealTime && (
          <div className="text-xs text-muted-foreground mt-2">Actualizando cada 30s • {chartData.length} puntos</div>
        )}
      </CardContent>
    </Card>
  )
}
