"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Activity, AlertTriangle, Fish, Building2, Download } from "lucide-react"
import { useSensors } from "@/hooks/use-sensors"
import { useProcesses } from "@/hooks/use-processes"
import { useBranches } from "@/hooks/use-branches"

export default function AnalyticsContent() {
  const { sensors = [], loading: sensorsLoading } = useSensors()
  const { processes = [], loading: processesLoading } = useProcesses()
  const { branches = [], loading: branchesLoading } = useBranches()

  // Memoizar datos para gráficos
  const chartData = useMemo(() => {
    if (!processes || !sensors.length) return null

    // Datos para gráfico de barras - procesos por estado
    const activeProcesses = processes.filter(p => p.estado === 'activo')
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
    const totalFacilities = branches.reduce((sum, branch) => sum + branch.facilities.length, 0)
    const alertsCount = sensors.filter((s) => s.status === "alert").length

    return {
      totalProcesses: processes.all.length,
      activeProcesses: processes.active.length,
      totalSensors: sensors.length,
      activeSensors,
      totalFacilities,
      activeBranches: branches.filter((b) => b.status === "active").length,
      alertsCount,
    }
  }, [processes, sensors, branches])

  const isLoading = sensorsLoading || processesLoading || branchesLoading

  if (isLoading) {
    return <div>Cargando analytics...</div>
  }

  if (!stats || !chartData) {
    return <div>No hay datos disponibles</div>
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Análisis y métricas del sistema de monitoreo acuícola</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Reporte
        </Button>
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
                  <Bar dataKey="value" fill="#3b82f6" />
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
                    {Object.keys(processes.bySpecies).length}
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
