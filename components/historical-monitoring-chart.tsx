"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts"
import { format } from "date-fns"
import { AlertTriangle, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSensorDataMultiple, useFacilitySensors, useSensorData } from "@/hooks/use-sensor-data"
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
import React from "react"

interface HistoricalMonitoringChartProps {
  // Props para modo multi-sensor (requiere facilityId)
  processId?: string
  facilityId?: string
  // Props para modo single-sensor (requiere sensorId)
  sensorId?: string | number
  parameter?: string
  unit?: string
  color?: string
  // Props comunes
  dateRange: { from: Date; to: Date }
  height?: number
  compact?: boolean
}

// Componente de tooltip personalizado para múltiples parámetros
const MultiParameterTooltip = ({ active, payload, label, facilitySensors }: any) => {
  if (!active || !payload || !payload.length) return null

  try {
    const timestamp = new Date(label)
    if (isNaN(timestamp.getTime())) return null

    const { date, time } = formatDateTime(timestamp)

    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
        {/* Fecha y hora */}
        <div className="mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{date}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{time}</p>
        </div>

        {/* Valores de los parámetros */}
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const sensorConfig = facilitySensors.find((s: any) => s.parameter === entry.dataKey)
            if (!sensorConfig) return null

            const value = entry.value
            const isOutOfRange =
              sensorConfig.optimal &&
              isParameterOutOfRange(value, entry.dataKey, sensorConfig.optimal.min, sensorConfig.optimal.max)

            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {getParameterName(entry.dataKey)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-sm font-medium ${
                      isOutOfRange ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {value.toFixed(2)} {sensorConfig.unit || getParameterUnit(entry.dataKey)}
                  </span>
                  {isOutOfRange && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                </div>
              </div>
            )
          })}
        </div>

        {/* Indicador de fuera de rango */}
        {payload.some((entry: any) => {
          const sensorConfig = facilitySensors.find((s: any) => s.parameter === entry.dataKey)
          return (
            sensorConfig?.optimal &&
            isParameterOutOfRange(entry.value, entry.dataKey, sensorConfig.optimal.min, sensorConfig.optimal.max)
          )
        }) && (
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                Algunos valores fuera del rango óptimo
              </span>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error rendering multi-parameter tooltip:", error)
    return null
  }
}

export function HistoricalMonitoringChart({
  processId,
  facilityId,
  sensorId,
  parameter,
  unit,
  color,
  dateRange,
  height = 300,
  compact = false,
}: HistoricalMonitoringChartProps) {
  // Modo single sensor: usar useSensorData directamente
  const singleSensorData = useSensorData(
    sensorId ? String(sensorId) : '',
    dateRange.from,
    dateRange.to
  )
  
  // Modo multi-sensor: usar useFacilitySensors + useSensorDataMultiple
  const facilitySensors = useFacilitySensors(facilityId || '')
  const parameters = facilityId ? (facilitySensors?.map((s) => s.parameter) || []) : []

  const multiSensorData = useSensorDataMultiple(facilityId || null, {
    from: dateRange.from,
    to: dateRange.to,
    parameters: parameters,
  })
  
  // Determinar qué modo usar
  const isSingleSensorMode = !!sensorId && !facilityId
  const readings = isSingleSensorMode ? [] : multiSensorData.readings
  const loading = isSingleSensorMode ? singleSensorData.loading : multiSensorData.loading
  const error = isSingleSensorMode ? singleSensorData.error : multiSensorData.error

  // Procesar datos combinados (para multi-sensor) o datos de sensor único
  const { combinedData, yAxisDomain, effectiveParameters } = React.useMemo(() => {
    // Modo sensor único
    if (isSingleSensorMode && singleSensorData.data.length > 0) {
      const singleParam = parameter || 'value'
      const processed = reduceDataDensity(
        singleSensorData.data.map(d => ({ 
          timestamp: d.timestamp, 
          [singleParam]: d.value 
        })),
        200
      )
      const values = singleSensorData.data.map(d => d.value)
      const domain = calculateYAxisDomain(values)
      return { combinedData: processed, yAxisDomain: domain, effectiveParameters: [singleParam] }
    }
    
    // Modo multi-sensor
    if (!readings || readings.length === 0) {
      return { combinedData: [], yAxisDomain: [0, 100], effectiveParameters: parameters }
    }

    // Agrupar lecturas por timestamp
    const timestampMap = new Map<string, any>()

    readings.forEach((reading) => {
      const timestamp = reading.timestamp.toISOString()

      if (!timestampMap.has(timestamp)) {
        timestampMap.set(timestamp, { timestamp })
      }

      const point = timestampMap.get(timestamp)
      point[reading.parameter] = reading.value
    })

    let processed = Array.from(timestampMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    // Reducir densidad si hay demasiados puntos
    processed = reduceDataDensity(processed, 200)

    // Aplicar suavizado a parámetros específicos
    const smoothingParams = ["temperature", "ph", "oxygen", "salinity"]
    smoothingParams.forEach((param) => {
      if (parameters.includes(param)) {
        const paramData = processed.map((d) => ({ ...d, value: d[param] || 0 }))
        const smoothed = smoothData(paramData, 3)
        processed = processed.map((d, i) => ({
          ...d,
          [param]: smoothed[i]?.value || d[param],
        }))
      }
    })

    // Calcular dominio del eje Y
    const allValues: number[] = []
    let optimalMin: number | undefined
    let optimalMax: number | undefined

    parameters.forEach((param) => {
      const values = processed.map((d) => Number(d[param])).filter((v) => !isNaN(v))
      allValues.push(...values)

      const sensorConfig = facilitySensors.find((s) => s.parameter === param)
      if (sensorConfig?.optimal && optimalMin === undefined) {
        optimalMin = sensorConfig.optimal.min
        optimalMax = sensorConfig.optimal.max
      }
    })

    const domain = calculateYAxisDomain(allValues, optimalMin, optimalMax)

    return { combinedData: processed, yAxisDomain: domain, effectiveParameters: parameters }
  }, [readings, parameters, facilitySensors, isSingleSensorMode, singleSensorData.data, parameter])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Condición de no datos: depende del modo
  const hasNoData = isSingleSensorMode 
    ? singleSensorData.data.length === 0 
    : (!readings || readings.length === 0)

  if (error || hasNoData) {
    // En modo compact, mostrar mensaje simple
    if (compact) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
          Sin datos
        </div>
      )
    }
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin datos disponibles</h3>
            <p className="text-muted-foreground">
              {error || (isSingleSensorMode ? `No hay datos para el sensor ${sensorId}` : `No hay datos de sensores para la instalación ${facilityId}`)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Sensores configurados: {effectiveParameters.length > 0 ? effectiveParameters.join(", ") : "ninguno"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const alerts = isSingleSensorMode ? 0 : readings.filter((r) => r.isOutOfRange).length

  // En modo compact para sensor único, renderizar solo el gráfico sin Card wrapper
  if (compact && isSingleSensorMode) {
    const lineColor = color || getParameterColor(parameter || 'value')
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={combinedData}>
          <Line
            type="monotone"
            dataKey={parameter || 'value'}
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, stroke: lineColor, strokeWidth: 1, fill: "#ffffff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <Card>
      {!compact && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Monitoreo Histórico</CardTitle>
              {alerts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {alerts} alertas
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Datos de {effectiveParameters.length} sensores • {isSingleSensorMode ? singleSensorData.data.length : readings.length} lecturas
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className={compact ? "p-4" : "pt-0"}>
        {combinedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(time) => {
                  try {
                    return format(new Date(time), "dd/MM HH:mm")
                  } catch {
                    return time
                  }
                }}
                fontSize={10}
              />
              <YAxis fontSize={10} domain={yAxisDomain} tickFormatter={(value) => `${value.toFixed(1)}`} />

              <Tooltip
                content={(props) => <MultiParameterTooltip {...props} facilitySensors={facilitySensors} />}
                cursor={{ stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "3 3" }}
              />

              {/* Zonas verdes para rangos óptimos */}
              {facilitySensors.map(
                (sensor, index) =>
                  sensor.optimal && (
                    <ReferenceArea
                      key={`optimal-${sensor.parameter}`}
                      y1={sensor.optimal.min}
                      y2={sensor.optimal.max}
                      fill={getParameterColor(sensor.parameter)}
                      fillOpacity={0.05}
                      stroke={getParameterColor(sensor.parameter)}
                      strokeOpacity={0.2}
                      strokeDasharray="2 2"
                    />
                  ),
              )}

              {effectiveParameters.map((param, index) => (
                <Line
                  key={param}
                  type="monotone"
                  dataKey={param}
                  stroke={isSingleSensorMode && color ? color : getParameterColor(param)}
                  strokeWidth={2}
                  dot={((props: any) => {
                    const sensorConfig = facilitySensors.find((s) => s.parameter === param)
                    const value = props.payload?.[param]
                    const isOutOfRange =
                      sensorConfig?.optimal &&
                      value &&
                      isParameterOutOfRange(value, param, sensorConfig.optimal.min, sensorConfig.optimal.max)

                    if (isOutOfRange) {
                      return (
                        <circle cx={props.cx} cy={props.cy} r={4} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
                      )
                    }
                    return null // No mostrar puntos normales para línea más limpia
                  }) as any}
                  activeDot={{ r: 6, stroke: isSingleSensorMode && color ? color : getParameterColor(param), strokeWidth: 2, fill: "#ffffff" }}
                  connectNulls={false}
                  name={getParameterName(param)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
            </div>
          </div>
        )}

        {compact && (
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{effectiveParameters.length} parámetros monitoreados</span>
            {alerts > 0 && (
              <Badge variant="destructive" className="text-xs">
                {alerts} alertas
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
