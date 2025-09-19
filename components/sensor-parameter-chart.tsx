"use client"

import React, { useEffect, useState, useMemo } from "react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Minus, Download, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { useSensorData } from "@/hooks/use-sensor-data"

interface SensorParameterChartProps {
  sensorId: string
  sensorType: string
  facilityName: string
  timeRange: { start: Date; end: Date }
  realTime?: boolean
  showExport?: boolean
  compact?: boolean
}

const SensorParameterChart: React.FC<SensorParameterChartProps> = ({
  sensorId,
  sensorType,
  facilityName,
  timeRange,
  realTime = false,
  showExport = true,
  compact = false,
}) => {
  const [isRealTime, setIsRealTime] = useState(realTime)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Refetch de datos reales cada 30s en modo tiempo real
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/lecturas?sensor=${sensorId}&from=${timeRange.start.toISOString()}&to=${timeRange.end.toISOString()}`)
        if (!res.ok) throw new Error("Error al obtener lecturas")
        const data = await res.json()
        setChartData(data || [])
      } catch {
        // Mantener datos previos si hay error
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
  }, [isRealTime, sensorId, timeRange])

  // Estadísticas y helpers
  const values = chartData?.map((d) => d.value) || []
  const avg = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  const min = values.length > 0 ? Math.min(...values) : 0
  const max = values.length > 0 ? Math.max(...values) : 0

  const downloadCSV = () => {
    if (chartData.length === 0) return
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += `Tiempo,Valor\n`
    for (let i = 0; i < chartData.length; i++) {
      csvContent += `${chartData[i].timestamp},${chartData[i].value}\n`
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `sensor_${sensorId}_data.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const value = payload[0].value
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {new Date(data.timestamp).toLocaleDateString("es-ES")} - {new Date(data.timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-lg font-bold">
            {value.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className={compact ? "h-64" : "h-96"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{sensorType}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRealTime(!isRealTime)}
              className={`text-xs ${isRealTime ? "bg-green-50 border-green-200 text-green-700" : ""}`}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRealTime ? "animate-spin" : ""}`} />
              {isRealTime ? "Tiempo Real" : "Histórico"}
            </Button>
            {showExport && (
              <Button variant="ghost" size="sm" onClick={downloadCSV} className="h-6 px-2 text-xs">
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={compact ? 160 : 320}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${sensorId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(timestamp) =>
                new Date(timestamp).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
              tick={{ fontSize: 11 }}
              axisLine={{ stroke: "#d1d5db" }}
              tickLine={{ stroke: "#d1d5db" }}
            />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fontSize: 11 }}
              axisLine={{ stroke: "#d1d5db" }}
              tickLine={{ stroke: "#d1d5db" }}
              tickFormatter={(value) => `${value.toFixed(1)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill={`url(#gradient-${sensorId})`}
              connectNulls={false}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#10b981",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
        {isRealTime && (
          <div className="text-xs text-muted-foreground mt-2">Actualizando cada 30s • {chartData.length} puntos</div>
        )}
      </CardContent>
    </Card>
  )
}

export default React.memo(SensorParameterChart)
