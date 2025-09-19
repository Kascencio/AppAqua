"use client"

import { HistoricalMonitoringChart } from "./historical-monitoring-chart"
import { useSensorData } from "@/hooks/use-sensor-data"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface SensorMonitoringCardProps {
  sensorId: string
  name: string
  unit: string
  parameter: string
  color: string
  from: Date
  to: Date
  facilityId?: string
}

export function SensorMonitoringCard({
  sensorId,
  name,
  unit,
  parameter,
  color,
  from,
  to,
  facilityId,
}: SensorMonitoringCardProps) {
  const { data, loading, error } = useSensorData(sensorId, from, to)

  const stats =
    data.length > 0
      ? {
          current: data[data.length - 1]?.value || 0,
          average: data.reduce((sum, point) => sum + point.value, 0) / data.length,
          min: Math.min(...data.map((point) => point.value)),
          max: Math.max(...data.map((point) => point.value)),
          trend: data.length > 1 ? data[data.length - 1].value - data[0].value : 0,
        }
      : null

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-72">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !data.length || !stats) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-72">
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-sm">Sin datos disponibles</p>
          </div>
        </div>
      </div>
    )
  }

  const formatValue = (value: number) => {
    if (parameter === "ph") return value.toFixed(1)
    if (parameter === "temperature") return value.toFixed(1)
    return value.toFixed(1)
  }

  const getTrendIcon = (trend: number) => {
    if (Math.abs(trend) < 0.05) return <Minus className="h-3 w-3 text-gray-500" />
    return trend > 0 ? (
      <TrendingUp className="h-3 w-3 text-green-600" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-600" />
    )
  }

  const getTrendColor = (trend: number) => {
    if (Math.abs(trend) < 0.05) return "text-gray-600"
    return trend > 0 ? "text-green-600" : "text-red-600"
  }

  const getTrendText = (trend: number) => {
    if (Math.abs(trend) < 0.05) return "Sin cambios"
    return `${trend > 0 ? "+" : ""}${formatValue(trend)} ${unit}`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 h-72 hover:shadow-md transition-shadow">
      {/* Header with better typography */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{name}</h4>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-gray-900">{formatValue(stats.current)}</span>
          <span className="text-sm text-gray-500 font-medium">{unit}</span>
        </div>
        <div className="flex items-center gap-1">
          {getTrendIcon(stats.trend)}
          <span className={`text-xs font-medium ${getTrendColor(stats.trend)}`}>{getTrendText(stats.trend)}</span>
        </div>
      </div>

      {/* Statistics with better spacing */}
      <div className="grid grid-cols-3 gap-3 text-xs mb-4">
        <div className="text-center">
          <p className="text-gray-500 mb-1">Promedio</p>
          <p className="font-semibold text-gray-900">{formatValue(stats.average)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 mb-1">Mín</p>
          <p className="font-semibold text-gray-900">{formatValue(stats.min)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 mb-1">Máx</p>
          <p className="font-semibold text-gray-900">{formatValue(stats.max)}</p>
        </div>
      </div>

      {/* Chart with proper container */}
      <div className="h-20 -mx-1">
        <HistoricalMonitoringChart
          sensorId={sensorId}
          parameter={parameter}
          unit={unit}
          color={color}
          facilityId={facilityId}
          dateRange={{ from, to }}
          height={80}
          compact={true}
        />
      </div>
    </div>
  )
}
