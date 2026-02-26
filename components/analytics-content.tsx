"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { Activity, AlertTriangle, Fish, Building2 } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type SensorTypeRow = {
  canonicalType: string
  typeLabel: string
  total: number
  active: number
  alert: number
}

type FacilityRow = {
  facilityId: string
  facilityName: string
  totalSensors: number
  activeSensors: number
  alertSensors: number
  totalProcesses: number
  activeProcesses: number
}

const SENSOR_STATUS_LABELS: Record<string, string> = {
  active: "Activos",
  inactive: "Inactivos",
  offline: "Desconectados",
  maintenance: "Mantenimiento",
  alert: "En alerta",
}

const SENSOR_STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  inactive: "#6b7280",
  offline: "#ef4444",
  maintenance: "#f59e0b",
  alert: "#dc2626",
}

function normalizeText(value: string): string {
  return String(value || "").trim().toLowerCase()
}

function getTipoMedidaFromSensor(sensor: any): string {
  const raw =
    sensor?.tipoMedida ??
    sensor?.tipo_medida ??
    sensor?.catalogo_sensores?.tipo_medida ??
    sensor?.catalogo?.tipo_medida ??
    sensor?.type
  return String(raw || "")
}

function detectSensorType(sensor: any): string {
  const raw = normalizeText(getTipoMedidaFromSensor(sensor))
  const unit = normalizeText(sensor?.unit || "")
  const name = normalizeText(sensor?.name || sensor?.descripcion || "")

  if (raw.includes("ph") || raw.includes("potencial") || raw.includes("hidrogeno") || raw.includes("hidrógeno")) return "ph"
  if (raw.includes("temp") || raw.includes("temperatura")) return "temperature"
  if (raw.includes("ox") || raw.includes("oxígeno") || raw.includes("oxigeno") || raw.includes("oxygen") || raw.includes("o2")) return "oxygen"
  if (raw.includes("sal") || raw.includes("salinidad")) return "salinity"
  if (raw.includes("turb") || raw.includes("turbidez")) return "turbidity"
  if (raw.includes("nitrat") || raw.includes("nitrato")) return "nitrates"
  if (raw.includes("amon") || raw.includes("ammo") || raw.includes("amoniaco") || raw.includes("amoníaco")) return "ammonia"
  if (raw.includes("baro") || raw.includes("presión") || raw.includes("presion")) return "barometric"

  if (unit.includes("ph")) return "ph"
  if (unit.includes("°c") || unit === "c" || unit.endsWith(" c")) return "temperature"
  if (unit.includes("mg/l") && (name.includes("ox") || name.includes("o2"))) return "oxygen"
  if (unit.includes("ppt")) return "salinity"
  if (unit.includes("ntu")) return "turbidity"
  if (unit.includes("hpa")) return "barometric"

  if (name.includes("ph") || name.includes("potencial") || name.includes("hidrogeno") || name.includes("hidrógeno")) return "ph"
  if (name.includes("temp") || name.includes("temperatura")) return "temperature"
  if (name.includes("ox") || name.includes("oxígeno") || name.includes("oxigeno") || name.includes("oxygen") || name.includes("o2")) return "oxygen"
  if (name.includes("sal") || name.includes("salinidad")) return "salinity"
  if (name.includes("turb") || name.includes("turbidez")) return "turbidity"
  if (name.includes("nitrat") || name.includes("nitrato")) return "nitrates"
  if (name.includes("amon") || name.includes("ammo") || name.includes("amoniaco") || name.includes("amoníaco")) return "ammonia"
  if (name.includes("baro") || name.includes("presión") || name.includes("presion")) return "barometric"

  return "other"
}

function sensorTypeLabel(type: string): string {
  switch (type) {
    case "temperature":
      return "Temperatura"
    case "ph":
      return "pH"
    case "oxygen":
      return "Oxígeno"
    case "salinity":
      return "Salinidad"
    case "turbidity":
      return "Turbidez"
    case "nitrates":
      return "Nitratos"
    case "ammonia":
      return "Amonio"
    case "barometric":
      return "Presión atmosférica"
    default:
      return "Otro"
  }
}

function normalizeProcessState(process: any): string {
  const raw = normalizeText(process?.estado ?? process?.estado_proceso ?? "")
  if (raw.includes("progreso") || raw === "activo") return "en_progreso"
  if (raw.includes("plan")) return "planificado"
  if (raw.includes("paus")) return "pausado"
  if (raw.includes("cancel")) return "cancelado"
  if (raw.includes("complet") || raw.includes("final")) return "completado"
  return raw || "desconocido"
}

function processStateLabel(state: string): string {
  switch (state) {
    case "en_progreso":
      return "En progreso"
    case "completado":
      return "Completado"
    case "planificado":
      return "Planificado"
    case "pausado":
      return "Pausado"
    case "cancelado":
      return "Cancelado"
    default:
      return "Desconocido"
  }
}

function resolveFacilityId(value: unknown): string {
  return String(value ?? "").trim()
}

interface AnalyticsContentProps {
  dateRange?: DateRange
  sensors?: any[]
  processes?: any[]
  facilities?: any[]
}

export default function AnalyticsContent({
  dateRange,
  sensors: sensorsProp = [],
  processes: processesProp = [],
  facilities: facilitiesProp = [],
}: AnalyticsContentProps) {
  const sensors = Array.isArray(sensorsProp) ? sensorsProp : []
  const processes = Array.isArray(processesProp) ? processesProp : []
  const facilities = Array.isArray(facilitiesProp) ? facilitiesProp : []

  const facilityNameById = useMemo(() => {
    const map = new Map<string, string>()
    facilities.forEach((facility: any) => {
      const id = resolveFacilityId(facility?.id_instalacion)
      const name = String(facility?.nombre_instalacion || facility?.nombre || "").trim()
      if (id) map.set(id, name || `Instalación ${id}`)
    })
    return map
  }, [facilities])

  const processStatusData = useMemo(() => {
    const counts = new Map<string, number>()
    processes.forEach((process: any) => {
      const state = normalizeProcessState(process)
      counts.set(state, (counts.get(state) || 0) + 1)
    })
    const orderedStates = ["en_progreso", "completado", "planificado", "pausado", "cancelado", "desconocido"]
    const stateColors: Record<string, string> = {
      en_progreso: "#10b981",
      completado: "#3b82f6",
      planificado: "#6366f1",
      pausado: "#f59e0b",
      cancelado: "#ef4444",
      desconocido: "#6b7280",
    }
    return orderedStates
      .map((state) => ({
        key: state,
        name: processStateLabel(state),
        value: counts.get(state) || 0,
        color: stateColors[state] || "#6b7280",
      }))
      .filter((row) => row.value > 0)
  }, [processes])

  const sensorStatusData = useMemo(() => {
    const counts = new Map<string, number>()
    sensors.forEach((sensor: any) => {
      const status = String(sensor?.status || "desconocido")
      counts.set(status, (counts.get(status) || 0) + 1)
    })
    const rows = Array.from(counts.entries()).map(([status, value]) => ({
      key: status,
      name: SENSOR_STATUS_LABELS[status] || status,
      value,
      color: SENSOR_STATUS_COLORS[status] || "#6b7280",
    }))
    return rows.sort((a, b) => b.value - a.value)
  }, [sensors])

  const typeRows = useMemo<SensorTypeRow[]>(() => {
    const byType = new Map<string, SensorTypeRow>()
    sensors.forEach((sensor: any) => {
      const canonicalType = detectSensorType(sensor)
      const prev = byType.get(canonicalType)
      if (!prev) {
        byType.set(canonicalType, {
          canonicalType,
          typeLabel: sensorTypeLabel(canonicalType),
          total: 1,
          active: sensor?.status === "active" ? 1 : 0,
          alert: sensor?.status === "alert" ? 1 : 0,
        })
        return
      }
      prev.total += 1
      if (sensor?.status === "active") prev.active += 1
      if (sensor?.status === "alert") prev.alert += 1
    })
    return Array.from(byType.values()).sort((a, b) => b.total - a.total)
  }, [sensors])

  const facilityRows = useMemo<FacilityRow[]>(() => {
    const byFacility = new Map<string, FacilityRow>()
    sensors.forEach((sensor: any) => {
      const facilityId = resolveFacilityId(sensor?.id_instalacion ?? sensor?.facilityId)
      const fallbackName = String(sensor?.facilityName || "").trim()
      const facilityName =
        facilityNameById.get(facilityId) ||
        fallbackName ||
        (facilityId ? `Instalación ${facilityId}` : "Sin instalación")
      const key = facilityId || normalizeText(facilityName) || `facility-${byFacility.size + 1}`

      const prev = byFacility.get(key)
      if (!prev) {
        byFacility.set(key, {
          facilityId,
          facilityName,
          totalSensors: 1,
          activeSensors: sensor?.status === "active" ? 1 : 0,
          alertSensors: sensor?.status === "alert" ? 1 : 0,
          totalProcesses: 0,
          activeProcesses: 0,
        })
        return
      }
      prev.totalSensors += 1
      if (sensor?.status === "active") prev.activeSensors += 1
      if (sensor?.status === "alert") prev.alertSensors += 1
    })

    processes.forEach((process: any) => {
      const facilityId = resolveFacilityId(process?.id_instalacion)
      const state = normalizeProcessState(process)
      const fallbackName = facilityNameById.get(facilityId) || (facilityId ? `Instalación ${facilityId}` : "Sin instalación")
      const key = facilityId || normalizeText(fallbackName)
      const existing = byFacility.get(key)
      if (!existing) {
        byFacility.set(key, {
          facilityId,
          facilityName: fallbackName,
          totalSensors: 0,
          activeSensors: 0,
          alertSensors: 0,
          totalProcesses: 1,
          activeProcesses: state === "en_progreso" ? 1 : 0,
        })
        return
      }
      existing.totalProcesses += 1
      if (state === "en_progreso") existing.activeProcesses += 1
    })

    return Array.from(byFacility.values()).sort((a, b) => b.totalSensors - a.totalSensors)
  }, [sensors, processes, facilityNameById])

  const stats = useMemo(() => {
    const totalFacilities = facilities.length > 0 ? facilities.length : facilityRows.length
    const activeFacilities =
      facilities.length > 0
        ? facilities.filter((facility: any) => facility.estado_operativo === "activo").length
        : facilityRows.filter((row) => row.activeSensors > 0).length
    const activeProcesses = processStatusData.find((row) => row.key === "en_progreso")?.value || 0

    return {
      totalProcesses: processes.length,
      activeProcesses,
      totalSensors: sensors.length,
      activeSensors: sensors.filter((sensor: any) => sensor.status === "active").length,
      totalFacilities,
      activeFacilities,
      alertsCount: sensors.filter((sensor: any) => sensor.status === "alert").length,
    }
  }, [facilities, facilityRows, processStatusData, processes, sensors])

  const processChartConfig = {
    value: {
      label: "Procesos",
      color: "#3b82f6",
    },
  } satisfies ChartConfig

  const sensorStatusChartConfig = {
    value: {
      label: "Sensores",
      color: "#10b981",
    },
  } satisfies ChartConfig

  const processActivityRate = stats.totalProcesses > 0 ? (stats.activeProcesses / stats.totalProcesses) * 100 : 0
  const sensorAvailability = stats.totalSensors > 0 ? (stats.activeSensors / stats.totalSensors) * 100 : 0
  const avgSensorsPerFacility = stats.totalFacilities > 0 ? stats.totalSensors / stats.totalFacilities : 0

  const insights = useMemo(() => {
    const rows: string[] = []
    if (stats.totalSensors === 0) {
      rows.push("No hay sensores en el alcance actual. Ajusta filtros o permisos para visualizar tendencia.")
      return rows
    }
    if (stats.alertsCount > 0) {
      rows.push(`Se detectan ${stats.alertsCount} sensores en alerta (${((stats.alertsCount / Math.max(1, stats.totalSensors)) * 100).toFixed(1)}%).`)
    } else {
      rows.push("No hay sensores en estado de alerta en el período y alcance seleccionados.")
    }
    rows.push(`Disponibilidad actual de sensores: ${sensorAvailability.toFixed(1)}% (${stats.activeSensors}/${stats.totalSensors}).`)
    if (typeRows.length > 0) {
      rows.push(`Tipo dominante: ${typeRows[0].typeLabel} con ${typeRows[0].total} sensores (${((typeRows[0].total / Math.max(1, stats.totalSensors)) * 100).toFixed(1)}%).`)
    }
    if (stats.totalProcesses > 0) {
      rows.push(`Procesos en progreso: ${stats.activeProcesses}/${stats.totalProcesses} (${processActivityRate.toFixed(1)}%).`)
    }
    return rows.slice(0, 4)
  }, [stats, sensorAvailability, typeRows, processActivityRate])

  const fromLabel = dateRange?.from ? format(dateRange.from, "dd MMM yyyy", { locale: es }) : "-"
  const toLabel = dateRange?.to ? format(dateRange.to, "dd MMM yyyy", { locale: es }) : "-"
  const hasData = sensors.length > 0 || processes.length > 0 || facilities.length > 0

  if (!hasData) {
    return <div className="text-sm text-muted-foreground">No hay datos disponibles para el análisis detallado.</div>
  }

  const topFacilities = facilityRows.slice(0, 8)
  const topTypes = typeRows.slice(0, 8)
  const statusRows = processStatusData.length > 0 ? processStatusData : [{ key: "none", name: "Sin procesos", value: 0, color: "#6b7280" }]

  const processRowsByFacility = topFacilities
    .filter((row) => row.totalProcesses > 0 || row.totalSensors > 0)
    .sort((a, b) => b.totalProcesses - a.totalProcesses || b.totalSensors - a.totalSensors)

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          </div>
          <p className="text-muted-foreground">Análisis y métricas del sistema de monitoreo acuícola</p>
          <p className="text-xs text-muted-foreground mt-1">Período: {fromLabel} — {toLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Procesos Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeProcesses}</p>
              </div>
              <Fish className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sensores Activos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeSensors}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Instalaciones</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalFacilities}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas</p>
                <p className="text-2xl font-bold text-red-600">{stats.alertsCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hallazgos del Período</CardTitle>
          <CardDescription>Indicadores clave para priorizar acciones operativas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {insights.map((insight, index) => (
            <p key={`insight-${index}`} className="text-muted-foreground">
              {index + 1}. {insight}
            </p>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Procesos por Estado</CardTitle>
            <CardDescription>Distribución de procesos de cultivo</CardDescription>
          </CardHeader>
          <CardContent>
            {processStatusData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground">No hay procesos en el alcance actual</div>
            ) : (
              <ChartContainer config={processChartConfig} className="h-80">
                <BarChart data={statusRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    isAnimationActive={true}
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Sensores</CardTitle>
            <CardDescription>Distribución por estado operativo</CardDescription>
          </CardHeader>
          <CardContent>
            {sensorStatusData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground">No hay sensores en el alcance actual</div>
            ) : (
              <ChartContainer config={sensorStatusChartConfig} className="h-80">
                <PieChart>
                  <Pie
                    data={sensorStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={84}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    isAnimationActive={true}
                    animationDuration={500}
                    animationEasing="ease-out"
                  >
                    {sensorStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        valueFormatter={(value) => String(value ?? 0)}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="processes" className="w-full">
        <TabsList>
          <TabsTrigger value="processes">Procesos</TabsTrigger>
          <TabsTrigger value="sensors">Sensores</TabsTrigger>
          <TabsTrigger value="facilities">Instalaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Procesos</CardTitle>
              <CardDescription>Métricas de carga y avance por instalación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalProcesses}</div>
                  <div className="text-sm text-muted-foreground">Procesos Totales</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{processActivityRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Tasa de Actividad</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(processes.map((process: any) => process?.id_especie).filter(Boolean)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Especies en Cultivo</div>
                </div>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                  <span>Instalación</span>
                  <span>Sensores</span>
                  <span>Procesos</span>
                  <span>Activos</span>
                </div>
                {processRowsByFacility.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No hay cruce de procesos e instalaciones para mostrar.</div>
                ) : (
                  processRowsByFacility.map((row) => (
                    <div key={`${row.facilityId || row.facilityName}-process`} className="grid grid-cols-4 gap-2 px-3 py-2 text-sm border-b last:border-b-0">
                      <span className="truncate">{row.facilityName}</span>
                      <span>{row.totalSensors}</span>
                      <span>{row.totalProcesses}</span>
                      <span>{row.activeProcesses}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Sensores</CardTitle>
              <CardDescription>Disponibilidad y riesgo por tipo de medición</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.activeSensors}</div>
                  <div className="text-sm text-muted-foreground">Sensores Activos</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{sensorAvailability.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Disponibilidad</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.alertsCount}</div>
                  <div className="text-sm text-muted-foreground">Sensores en Alerta</div>
                </div>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                  <span>Tipo</span>
                  <span>Total</span>
                  <span>Activos</span>
                  <span>Alertas</span>
                </div>
                {topTypes.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No hay sensores para desglosar.</div>
                ) : (
                  topTypes.map((row) => (
                    <div key={row.canonicalType} className="grid grid-cols-4 gap-2 px-3 py-2 text-sm border-b last:border-b-0">
                      <span>{row.typeLabel}</span>
                      <span>{row.total}</span>
                      <span>{row.active}</span>
                      <span>{row.alert}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Instalaciones</CardTitle>
              <CardDescription>Densidad de sensores y carga operativa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalFacilities}</div>
                  <div className="text-sm text-muted-foreground">Total Instalaciones</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.activeFacilities}</div>
                  <div className="text-sm text-muted-foreground">Instalaciones Activas</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{avgSensorsPerFacility.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Sensores por Instalación</div>
                </div>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                  <span>Instalación</span>
                  <span>Sensores</span>
                  <span>Activos</span>
                  <span>Alertas</span>
                  <span>Procesos</span>
                </div>
                {topFacilities.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No hay instalaciones para mostrar.</div>
                ) : (
                  topFacilities.map((row) => (
                    <div key={`${row.facilityId || row.facilityName}-facility`} className="grid grid-cols-5 gap-2 px-3 py-2 text-sm border-b last:border-b-0">
                      <span className="truncate">{row.facilityName}</span>
                      <span>{row.totalSensors}</span>
                      <span>{row.activeSensors}</span>
                      <span>{row.alertSensors}</span>
                      <span>{row.totalProcesses}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { AnalyticsContent }
