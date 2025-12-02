"use client"

import { useState, useEffect, useMemo } from "react"
import { HistoricalMonitoringChart } from "./historical-monitoring-chart"
import { useSensorData } from "@/hooks/use-sensor-data"
import { useWebSocket } from "@/hooks/use-websocket"
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from "lucide-react"

interface SensorMonitoringCardProps {
  sensorId: string | number
  name: string
  unit: string
  parameter: string
  color: string
  from: Date
  to: Date
  facilityId?: string
  realTime?: boolean
  // También soporta props de objeto sensor para compatibilidad
  sensor?: any
  especie?: any
}

export function SensorMonitoringCard({
  sensorId: initialSensorId,
  name: initialName,
  unit: initialUnit,
  parameter: initialParameter,
  color: initialColor,
  from,
  to,
  facilityId,
  realTime = true,
  sensor,
  especie,
}: SensorMonitoringCardProps) {
  // Extraer datos del objeto sensor si está disponible (para compatibilidad)
  const sensorId = sensor?.id_sensor_instalado || sensor?.id || initialSensorId
  const name = sensor?.sensor_info?.sensor || sensor?.name || initialName
  const unit = sensor?.sensor_info?.unidad_medida || sensor?.unit || initialUnit
  const parameter = sensor?.sensor_info?.parametro || sensor?.parameter || initialParameter
  const color = initialColor

  // Obtener datos históricos iniciales
  const { data: initialData, loading: initialLoading, error: initialError } = useSensorData(String(sensorId), from, to)

  // Estado para datos actualizados en tiempo real
  const [realtimeData, setRealtimeData] = useState<{ value: number; timestamp: string; status: string } | null>(null)
  const [data, setData] = useState(initialData)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // WebSocket para actualizaciones en tiempo real
  const { isConnected, lastMessage, error: wsError } = useWebSocket({
    sensorId: sensorId,
    enabled: realTime,
    onMessage: (message) => {
      if (message.sensorId === String(sensorId) && message.value !== undefined) {
        setRealtimeData({
          value: message.value,
          timestamp: message.timestamp || new Date().toISOString(),
          status: message.status || "normal",
        })
        setLastUpdate(new Date())
        
        // Actualizar el último punto de datos
        if (data.length > 0) {
          setData((prev) => {
            const newData = [...prev]
            newData[newData.length - 1] = {
              ...newData[newData.length - 1],
              value: message.value,
              timestamp: message.timestamp || new Date().toISOString(),
              status: message.status || "normal",
            }
            return newData
          })
        }
      }
    },
    onError: () => {
      // Si WebSocket falla, continuar con polling
    },
  })

  // Actualizar datos cuando cambian los datos iniciales
  useEffect(() => {
    if (initialData.length > 0) {
      setData(initialData)
    }
  }, [initialData])

  const loading = initialLoading && !realtimeData
  const error = initialError && !realtimeData

  // Calcular estadísticas con datos actualizados en tiempo real
  const stats = useMemo(() => {
    if (data.length === 0) return null

    // Usar valor en tiempo real si está disponible, sino usar el último valor histórico
    const currentValue = realtimeData?.value ?? data[data.length - 1]?.value ?? 0
    const allValues = [...data.map((p) => p.value)]
    if (realtimeData?.value) {
      allValues[allValues.length - 1] = realtimeData.value
    }

    return {
      current: currentValue,
      average: allValues.reduce((sum, val) => sum + val, 0) / allValues.length,
      min: Math.min(...allValues),
      max: Math.max(...allValues),
      trend: allValues.length > 1 ? allValues[allValues.length - 1] - allValues[0] : 0,
    }
  }, [data, realtimeData])

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
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">{name}</h4>
          {realTime && (
            <div className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">En vivo</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Desconectado</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-gray-900">{formatValue(stats.current)}</span>
          <span className="text-sm text-gray-500 font-medium">{unit}</span>
        </div>
        <div className="flex items-center gap-1">
          {getTrendIcon(stats.trend)}
          <span className={`text-xs font-medium ${getTrendColor(stats.trend)}`}>{getTrendText(stats.trend)}</span>
        </div>
        {lastUpdate && (
          <div className="text-xs text-gray-400 mt-1">
            Actualizado: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
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
