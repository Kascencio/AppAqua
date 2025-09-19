"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts"
import { format } from "date-fns"
import { Activity, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSensorParameterData, useFacilitySensors } from "@/hooks/use-sensor-data"
import {
  getParameterName,
  getParameterColor,
  getParameterUnit,
  isParameterOutOfRange,
  smoothData,
  calculateYAxisDomain,
  reduceDataDensity,
  formatDateTime,
} from "@/lib/utils"

interface ProcessParameterChartProps {
  facilityId: string
  processDateRange: { from: Date; to: Date }
  displayDateRange: { from: Date; to: Date }
  processId: string
  showDetailedView?: boolean
}

// Componente de tooltip personalizado para parámetros individuales
const ParameterTooltip = ({
  active,
  payload,
  label,
  parameterName,
  parameterUnit,
  parameterColor,
  sensorConfig,
}: any) => {
  if (!active || !payload || !payload.length) return null

  try {
    const timestamp = new Date(label)
    if (isNaN(timestamp.getTime())) return null

    const { date, time } = formatDateTime(timestamp)
    const value = payload[0].value
    const isOutOfRange =
      sensorConfig?.optimal &&
      isParameterOutOfRange(value, payload[0].dataKey, sensorConfig.optimal.min, sensorConfig.optimal.max)

    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-xs">
        {/* Fecha y hora */}
        <div className="mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{date}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{time}</p>
        </div>

        {/* Información del parámetro */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: parameterColor }} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{parameterName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Valor medido:</span>
            <span
              className={`text-sm font-semibold ${
                isOutOfRange ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {value.toFixed(2)} {parameterUnit}
            </span>
          </div>

          {/* Rango óptimo */}
          {sensorConfig?.optimal && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Rango óptimo:</span>
              <span className="text-xs text-green-600 dark:text-green-400">
                {sensorConfig.optimal.min.toFixed(1)} - {sensorConfig.optimal.max.toFixed(1)} {parameterUnit}
              </span>
            </div>
          )}
        </div>

        {/* Alerta si está fuera de rango */}
        {isOutOfRange && (
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Fuera del rango óptimo</span>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error rendering parameter tooltip:", error)
    return null
  }
}

function ParameterChart({
  facilityId,
  parameter,
  dateRange,
  sensorConfig,
}: {
  facilityId: string
  parameter: string
  dateRange: { from: Date; to: Date }
  sensorConfig: any
}) {
  const { chartData: rawData, loading, error } = useSensorParameterData(facilityId, parameter, dateRange)

  const parameterName = getParameterName(parameter)
  const parameterColor = getParameterColor(parameter)
  const parameterUnit = sensorConfig?.unit || getParameterUnit(parameter)

  // Procesar datos: reducir densidad y suavizar
  const chartData = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return []

    let processed = [...rawData]

    // Reducir densidad si hay demasiados puntos
    processed = reduceDataDensity(processed, 150)

    // Aplicar suavizado para parámetros que lo requieren
    const shouldSmooth = ["temperature", "ph", "oxygen", "salinity"].includes(parameter)
    if (shouldSmooth) {
      processed = smoothData(processed, 3)
    }

    return processed
  }, [rawData, parameter])

  // Calcular dominio del eje Y
  const yAxisDomain = React.useMemo(() => {
    if (!chartData.length) return [0, 100]

    const values = chartData.map((d) => d.value)
    return calculateYAxisDomain(
      values,
      sensorConfig?.optimal?.min,
      sensorConfig?.optimal?.max,
      sensorConfig?.range?.min,
      sensorConfig?.range?.max,
    )
  }, [chartData, sensorConfig])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {parameterName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !chartData.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {parameterName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const values = chartData.map((d) => d.value)
  const alerts = chartData.filter((d) => d.status === "critical").length
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <CardTitle className="text-sm">{parameterName}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {parameterUnit}
            </Badge>
          </div>
          {alerts > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {alerts}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Promedio: {avg.toFixed(1)} {parameterUnit} • Rango: {min.toFixed(1)} - {max.toFixed(1)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="timestamp" tickFormatter={(time) => format(new Date(time), "HH:mm")} fontSize={10} />
            <YAxis domain={yAxisDomain} fontSize={10} tickFormatter={(value) => `${value.toFixed(1)}`} />

            {/* Zona verde para rango óptimo */}
            {sensorConfig?.optimal && (
              <ReferenceArea
                y1={sensorConfig.optimal.min}
                y2={sensorConfig.optimal.max}
                fill="#22c55e"
                fillOpacity={0.1}
                stroke="#22c55e"
                strokeOpacity={0.3}
                strokeDasharray="2 2"
              />
            )}

            {/* Líneas de referencia para rango óptimo */}
            {sensorConfig?.optimal && (
              <>
                <ReferenceLine y={sensorConfig.optimal.min} stroke="#10b981" strokeDasharray="2 2" opacity={0.5} />
                <ReferenceLine y={sensorConfig.optimal.max} stroke="#10b981" strokeDasharray="2 2" opacity={0.5} />
              </>
            )}

            <Tooltip
              content={(props) => (
                <ParameterTooltip
                  {...props}
                  parameterName={parameterName}
                  parameterUnit={parameterUnit}
                  parameterColor={parameterColor}
                  sensorConfig={sensorConfig}
                />
              )}
              cursor={{ stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "3 3" }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke={parameterColor}
              strokeWidth={2}
              dot={(props: any) => {
                const dataPoint = chartData.find((d) => d.timestamp === props.payload?.timestamp)
                const isOutOfRange =
                  sensorConfig?.optimal &&
                  dataPoint &&
                  isParameterOutOfRange(dataPoint.value, parameter, sensorConfig.optimal.min, sensorConfig.optimal.max)

                if (isOutOfRange || dataPoint?.status === "critical") {
                  return <circle cx={props.cx} cy={props.cy} r={4} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
                }
                return false // No mostrar puntos normales para línea más limpia
              }}
              activeDot={{ r: 6, stroke: parameterColor, strokeWidth: 2, fill: "#ffffff" }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ProcessParameterChart({
  facilityId,
  processDateRange,
  displayDateRange,
  processId,
  showDetailedView = false,
}: ProcessParameterChartProps) {
  const facilitySensors = useFacilitySensors(facilityId)

  if (!facilitySensors.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">No hay sensores configurados</h3>
              <p className="text-muted-foreground">La instalación {facilityId} no tiene sensores configurados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {facilitySensors.map((sensorConfig) => (
        <ParameterChart
          key={sensorConfig.parameter}
          facilityId={facilityId}
          parameter={sensorConfig.parameter}
          dateRange={displayDateRange}
          sensorConfig={sensorConfig}
        />
      ))}
    </div>
  )
}
