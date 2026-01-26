"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Activity, AlertTriangle, Fish, Building2 } from "lucide-react"
import { useSensors } from "@/hooks/use-sensors"
import { useProcesos } from "@/hooks/use-procesos"
import { useSucursales } from "@/hooks/use-sucursales"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface AnalyticsContentProps {
  dateRange?: DateRange
  sensors?: any[]
}

export default function AnalyticsContent({ dateRange, sensors: sensorsProp }: AnalyticsContentProps) {
  const { sensors: hookSensors = [], loading: sensorsLoading } = useSensors()
  const sensors = sensorsProp && sensorsProp.length ? sensorsProp : hookSensors
  const { procesos: processes = [], loading: processesLoading } = useProcesos({ auto: true })
  const { sucursales: branches = [], loading: branchesLoading } = useSucursales({ auto: true })

  // Memoizar datos para gráficos
  const chartData = useMemo(() => {
    if (!processes || !sensors.length) return null

    // Datos para gráfico de barras - procesos por estado
    const activeProcesses = processes.filter(p => p.estado === 'en_progreso')
    const completedProcesses = processes.filter(p => p.estado === 'completado')
    const plannedProcesses = processes.filter(p => p.estado === 'planificado')
    
    const processStatusData = [
      { name: "Activos", value: activeProcesses.length, color: "#10b981" },
      { name: "Completados", value: completedProcesses.length, color: "#6b7280" },
      { name: "Planificados", value: plannedProcesses.length, color: "#3b82f6" },
    ]

    // Datos para gráfico de sensores por estado
    const sensorStatusData = sensors.reduce(
      (acc, sensor) => {
        const status = sensor.status
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const sensorChartData = Object.entries(sensorStatusData).map(([status, count]) => ({
      name: status === "active" ? "Activos" : status === "inactive" ? "Inactivos" : "Mantenimiento",
      value: count,
      color: status === "active" ? "#10b981" : status === "inactive" ? "#ef4444" : "#f59e0b",
    }))

    return {
      processStatusData,
      sensorChartData,
    }
  }, [processes, sensors])

  // Memoizar estadísticas generales
  const stats = useMemo(() => {
    if (!processes || !sensors.length || !branches.length) return null

    const activeSensors = sensors.filter((s) => s.status === "active").length
    const totalFacilities = branches.length
    const alertsCount = sensors.filter((s) => s.status === "alert").length
    const activeProcesses = processes.filter((p) => p.estado === "en_progreso").length

    return {
      totalProcesses: processes.length,
      activeProcesses,
      totalSensors: sensors.length,
      activeSensors,
      totalFacilities,
      activeBranches: branches.filter((b) => b.activo).length,
      alertsCount,
    }
  }, [processes, sensors, branches])

  const isLoading = sensorsLoading || processesLoading || branchesLoading

  // Only show loading on initial load when there's no data yet
  if (isLoading && !stats && !chartData) {
    return <div>Cargando analytics...</div>
  }

  if (!stats || !chartData) {
    return <div>No hay datos disponibles</div>
  }

  const fromLabel = dateRange?.from ? format(dateRange.from, "dd MMM yyyy", { locale: es }) : "-"
  const toLabel = dateRange?.to ? format(dateRange.to, "dd MMM yyyy", { locale: es }) : "-"

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            {isLoading && <span className="text-xs text-muted-foreground animate-pulse">Actualizando...</span>}
          </div>
          <p className="text-muted-foreground">Análisis y métricas del sistema de monitoreo acuícola</p>
          <p className="text-xs text-muted-foreground mt-1">Período: {fromLabel} — {toLabel}</p>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Procesos por Estado</CardTitle>
            <CardDescription>Distribución de procesos de cultivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.processStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6"
                    isAnimationActive={true}
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Sensores</CardTitle>
            <CardDescription>Distribución por estado operativo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.sensorChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    isAnimationActive={true}
                    animationDuration={500}
                    animationEasing="ease-out"
                  >
                    {chartData.sensorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
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
              <CardDescription>Métricas detalladas de los procesos de cultivo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalProcesses}</div>
                  <div className="text-sm text-muted-foreground">Total de Procesos</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {((stats.activeProcesses / stats.totalProcesses) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Tasa de Actividad</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(processes.map(p => p.id_especie)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Especies en Cultivo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Sensores</CardTitle>
              <CardDescription>Estado y rendimiento de la red de sensores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.activeSensors}</div>
                  <div className="text-sm text-muted-foreground">Sensores Activos</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {((stats.activeSensors / stats.totalSensors) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Disponibilidad</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.alertsCount}</div>
                  <div className="text-sm text-muted-foreground">Alertas Activas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Instalaciones</CardTitle>
              <CardDescription>Distribución y estado de las instalaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalFacilities}</div>
                  <div className="text-sm text-muted-foreground">Total Instalaciones</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.activeBranches}</div>
                  <div className="text-sm text-muted-foreground">Sucursales Activas</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {(stats.totalFacilities / stats.activeBranches).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Promedio por Sucursal</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { AnalyticsContent }
