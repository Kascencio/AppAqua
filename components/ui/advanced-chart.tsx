"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Brush,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ZoomOut, Download, Settings, TrendingUp, TrendingDown, Maximize2, AlertTriangle } from "lucide-react"
import { cn, smoothData, calculateYAxisDomain, reduceDataDensity, formatDateTime } from "@/lib/utils"

interface ChartDataPoint {
  timestamp: number
  [key: string]: number | string
}

interface ChartSeries {
  key: string
  name: string
  color: string
  type?: "line" | "area" | "bar"
  yAxisId?: "left" | "right"
  strokeWidth?: number
  fillOpacity?: number
  minValue?: number
  maxValue?: number
  optimalMin?: number
  optimalMax?: number
  unit?: string
  smoothing?: boolean
}

interface AdvancedChartProps {
  data: ChartDataPoint[]
  series: ChartSeries[]
  title?: string
  description?: string
  height?: number
  enableZoom?: boolean
  enableBrush?: boolean
  enableExport?: boolean
  enableFullscreen?: boolean
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  timeFormat?: string
  className?: string
  smoothingWindow?: number
  maxDataPoints?: number
  onDataPointClick?: (data: ChartDataPoint) => void
  onZoom?: (domain: [number, number]) => void
}

// Componente de tooltip personalizado
const CustomTooltip = ({ active, payload, label, series }: any) => {
  if (!active || !payload || !payload.length) return null

  try {
    const timestamp = new Date(label)
    if (isNaN(timestamp.getTime())) return null

    const { date, time } = formatDateTime(timestamp)

    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-xs">
        {/* Fecha y hora */}
        <div className="mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{date}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{time}</p>
        </div>

        {/* Valores de los parámetros */}
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const seriesInfo = series.find((s: any) => s.key === entry.dataKey)
            if (!seriesInfo) return null

            const value = entry.value
            const isOutOfRange =
              seriesInfo.optimalMin !== undefined &&
              seriesInfo.optimalMax !== undefined &&
              (value < seriesInfo.optimalMin || value > seriesInfo.optimalMax)

            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{seriesInfo.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-sm font-medium ${
                      isOutOfRange ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {value.toFixed(2)} {seriesInfo.unit}
                  </span>
                  {isOutOfRange && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                </div>
              </div>
            )
          })}
        </div>

        {/* Indicador de fuera de rango */}
        {payload.some((entry: any) => {
          const seriesInfo = series.find((s: any) => s.key === entry.dataKey)
          return (
            seriesInfo?.optimalMin !== undefined &&
            seriesInfo?.optimalMax !== undefined &&
            (entry.value < seriesInfo.optimalMin || entry.value > seriesInfo.optimalMax)
          )
        }) && (
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Valor fuera del rango óptimo</span>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error rendering tooltip:", error)
    return null
  }
}

export function AdvancedChart({
  data,
  series,
  title,
  description,
  height = 400,
  enableZoom = true,
  enableBrush = false,
  enableExport = true,
  enableFullscreen = true,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  timeFormat = "HH:mm",
  className,
  smoothingWindow = 3,
  maxDataPoints = 200,
  onDataPointClick,
  onZoom,
}: AdvancedChartProps) {
  const [chartType, setChartType] = React.useState<"line" | "area" | "bar">("line")
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [zoomDomain, setZoomDomain] = React.useState<[number, number] | null>(null)
  const [selectedSeries, setSelectedSeries] = React.useState<string[]>(series.map((s) => s.key))

  const chartRef = React.useRef<HTMLDivElement>(null)

  // Procesar datos: reducir densidad y suavizar
  const processedData = React.useMemo(() => {
    let processed = [...data]

    // Reducir densidad si hay demasiados puntos
    processed = reduceDataDensity(processed, maxDataPoints)

    // Aplicar suavizado a series que lo requieran
    series.forEach((s) => {
      if (s.smoothing !== false && smoothingWindow > 1) {
        const seriesData = processed.map((d) => ({
          ...d,
          value: Number(d[s.key]) || 0,
        }))

        const smoothed = smoothData(seriesData, smoothingWindow)

        processed = processed.map((d, i) => ({
          ...d,
          [s.key]: smoothed[i]?.value || d[s.key],
        }))
      }
    })

    return processed
  }, [data, series, smoothingWindow, maxDataPoints])

  // Calcular estadísticas
  const stats = React.useMemo(() => {
    const seriesStats = series
      .map((s) => {
        const values = processedData.map((d) => Number(d[s.key])).filter((v) => !isNaN(v))
        if (values.length === 0) return null

        const avg = values.reduce((sum, val) => sum + val, 0) / values.length
        const min = Math.min(...values)
        const max = Math.max(...values)
        const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0

        return {
          key: s.key,
          name: s.name,
          avg,
          min,
          max,
          trend,
          unit: s.unit || "",
          color: s.color,
        }
      })
      .filter(Boolean)

    return seriesStats
  }, [processedData, series])

  // Calcular dominio del eje Y
  const yAxisDomain = React.useMemo(() => {
    if (selectedSeries.length === 0) return [0, 100]

    const allValues: number[] = []
    let optimalMin: number | undefined
    let optimalMax: number | undefined

    selectedSeries.forEach((seriesKey) => {
      const seriesConfig = series.find((s) => s.key === seriesKey)
      const values = processedData.map((d) => Number(d[seriesKey])).filter((v) => !isNaN(v))
      allValues.push(...values)

      // Usar el primer rango óptimo encontrado como referencia
      if (seriesConfig?.optimalMin !== undefined && optimalMin === undefined) {
        optimalMin = seriesConfig.optimalMin
        optimalMax = seriesConfig.optimalMax
      }
    })

    return calculateYAxisDomain(allValues, optimalMin, optimalMax)
  }, [processedData, selectedSeries, series])

  // Exportar datos
  const exportChart = (format: "csv" | "png" | "svg") => {
    if (format === "csv") {
      const headers = ["timestamp", ...selectedSeries]
      const rows = processedData.map((d) => [
        new Date(d.timestamp).toISOString(),
        ...selectedSeries.map((key) => d[key]),
      ])

      const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `chart-data-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Componente de gráfico según tipo
  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 },
      onClick: onDataPointClick ? ((data: any) => onDataPointClick(data?.activePayload?.[0]?.payload)) : undefined,
    }

    const xAxisProps = {
      dataKey: "timestamp",
      type: "number" as const,
      scale: "time" as const,
      domain: zoomDomain || ["dataMin", "dataMax"],
      tickFormatter: (value: number) =>
        new Date(value).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }

    const yAxisProps = {
      tick: { fontSize: 12 },
      domain: yAxisDomain,
    }

    const tooltipProps = showTooltip
      ? {
          content: (props: any) => <CustomTooltip {...props} series={series} />,
          cursor: { stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "3 3" },
        }
      : {}

    switch (chartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {showTooltip && <Tooltip {...tooltipProps} />}
            {showLegend && <Legend />}

            {/* Zona verde para rango óptimo */}
            {series
              .filter((s) => selectedSeries.includes(s.key) && s.optimalMin && s.optimalMax)
              .map((s) => (
                <ReferenceArea
                  key={`optimal-${s.key}`}
                  y1={s.optimalMin}
                  y2={s.optimalMax}
                  fill="#22c55e"
                  fillOpacity={0.1}
                  stroke="#22c55e"
                  strokeOpacity={0.3}
                  strokeDasharray="2 2"
                />
              ))}

            {series
              .filter((s) => selectedSeries.includes(s.key))
              .map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={s.fillOpacity || 0.3}
                  strokeWidth={s.strokeWidth || 2}
                  name={s.name}
                />
              ))}

            {enableBrush && <Brush dataKey="timestamp" height={30} />}
          </AreaChart>
        )

      case "bar":
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {showTooltip && <Tooltip {...tooltipProps} />}
            {showLegend && <Legend />}

            {series
              .filter((s) => selectedSeries.includes(s.key))
              .map((s) => (
                <Bar key={s.key} dataKey={s.key} fill={s.color} name={s.name} />
              ))}
          </BarChart>
        )

      default: // line
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {showTooltip && <Tooltip {...tooltipProps} />}
            {showLegend && <Legend />}

            {/* Zona verde para rango óptimo */}
            {series
              .filter((s) => selectedSeries.includes(s.key) && s.optimalMin && s.optimalMax)
              .map((s) => (
                <ReferenceArea
                  key={`optimal-${s.key}`}
                  y1={s.optimalMin}
                  y2={s.optimalMax}
                  fill="#22c55e"
                  fillOpacity={0.1}
                  stroke="#22c55e"
                  strokeOpacity={0.3}
                  strokeDasharray="2 2"
                />
              ))}

            {/* Líneas de referencia para límites críticos */}
            {series
              .filter((s) => selectedSeries.includes(s.key) && (s.minValue || s.maxValue))
              .map((s) => (
                <React.Fragment key={`ref-${s.key}`}>
                  {s.minValue && <ReferenceLine y={s.minValue} stroke="#ef4444" strokeDasharray="5 5" opacity={0.7} />}
                  {s.maxValue && <ReferenceLine y={s.maxValue} stroke="#ef4444" strokeDasharray="5 5" opacity={0.7} />}
                </React.Fragment>
              ))}

            {series
              .filter((s) => selectedSeries.includes(s.key))
              .map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={s.strokeWidth || 2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    if (!payload || !s.optimalMin || !s.optimalMax) return <g />

                    const value = payload[s.key]
                    const isOutOfRange = value < s.optimalMin || value > s.optimalMax

                    if (isOutOfRange) {
                      return <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
                    }
                    return <g />
                  }}
                  activeDot={{ r: 6, stroke: s.color, strokeWidth: 2, fill: "#ffffff" }}
                  name={s.name}
                />
              ))}

            {enableBrush && <Brush dataKey="timestamp" height={30} />}
          </LineChart>
        )
    }
  }

  return (
    <Card className={cn("shadow-lg", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle className="text-lg">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de tipo de gráfico */}
            <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="line">Línea</TabsTrigger>
                <TabsTrigger value="area">Área</TabsTrigger>
                <TabsTrigger value="bar">Barras</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Controles adicionales */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {enableZoom && (
                  <>
                    <DropdownMenuItem onClick={() => setZoomDomain(null)}>
                      <ZoomOut className="mr-2 h-4 w-4" />
                      Resetear zoom
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {enableExport && (
                  <>
                    <DropdownMenuItem onClick={() => exportChart("csv")}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportChart("png")}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar PNG
                    </DropdownMenuItem>
                  </>
                )}
                {enableFullscreen && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsFullscreen(!isFullscreen)}>
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Pantalla completa
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-4">
            {stats.filter(Boolean).map((stat) => stat && (
              <div key={stat.key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                <div className="text-sm">
                  <span className="font-medium">{stat.name}:</span>
                  <span className="ml-1 text-muted-foreground">
                    Prom: {stat.avg.toFixed(1)}
                    {stat.unit}
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    {stat.trend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={cn("text-xs", stat.trend > 0 ? "text-green-500" : "text-red-500")}>
                      {stat.trend > 0 ? "+" : ""}
                      {stat.trend.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div
          ref={chartRef}
          className={cn("w-full transition-all duration-300", isFullscreen && "fixed inset-0 z-50 bg-background p-6")}
          style={{ height: isFullscreen ? "100vh" : height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
