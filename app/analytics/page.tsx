"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Download, Filter, FileText, Activity, Thermometer, Droplets } from "lucide-react"
import { useAppContext } from "@/context/app-context"
import { AnalyticsContent } from "@/components/analytics-content"
import { DateRangePicker } from "@/components/date-range-picker"
import { useState } from "react"

export default function AnalyticsPage() {
  const { instalaciones, procesos, alerts, lecturas, isLoading } = useAppContext()

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
    to: new Date(),
  })

  // Calcular métricas de análisis
  const analytics = {
    totalLecturas: Array.isArray(lecturas) ? lecturas.length : 0,
    lecturasHoy: Array.isArray(lecturas)
      ? lecturas.filter((l) => {
          const today = new Date()
          const lecturaDate = new Date(l.fecha_hora_lectura)
          return lecturaDate.toDateString() === today.toDateString()
        }).length
      : 0,
    promedioTemperatura: Array.isArray(lecturas)
      ? lecturas
          .filter((l) => l.id_parametro === 1) // Temperatura
          .reduce((acc, l, _, arr) => acc + l.valor / arr.length, 0)
      : 0,
    promedioPH: Array.isArray(lecturas)
      ? lecturas
          .filter((l) => l.id_parametro === 2) // pH
          .reduce((acc, l, _, arr) => acc + l.valor / arr.length, 0)
      : 0,
    promedioOxigeno: Array.isArray(lecturas)
      ? lecturas
          .filter((l) => l.id_parametro === 3) // Oxígeno
          .reduce((acc, l, _, arr) => acc + l.valor / arr.length, 0)
      : 0,
    alertasUltimaSemana: Array.isArray(alerts)
      ? alerts.filter((a) => {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return new Date(a.fecha_hora_alerta) >= weekAgo
        }).length
      : 0,
    eficienciaOperativa:
      (instalaciones.filter((i) => i.estado_operativo === "activo").length / Math.max(instalaciones.length, 1)) * 100,
    procesosCompletados: procesos.filter((p) => p.estado_proceso === "completado").length,
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Análisis y Reportes</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Análisis y Reportes</h2>
        <div className="flex items-center space-x-2">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lecturas Totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLecturas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{analytics.lecturasHoy} hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperatura Promedio</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.promedioTemperatura.toFixed(1)}°C</div>
            <p className="text-xs text-muted-foreground">Últimos 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">pH Promedio</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.promedioPH.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Rango óptimo: 6.5-8.5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia Operativa</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.eficienciaOperativa.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Instalaciones activas</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas secundarias */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oxígeno Disuelto</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.promedioOxigeno.toFixed(1)} mg/L</div>
            <p className="text-xs text-muted-foreground">Nivel óptimo {">"} 4.0 mg/L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas (7 días)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.alertasUltimaSemana}</div>
            <p className="text-xs text-muted-foreground">Última semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesos Completados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.procesosCompletados}</div>
            <p className="text-xs text-muted-foreground">Este período</p>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal de análisis */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Análisis Detallado</CardTitle>
            <CardDescription>Gráficos y tendencias de los parámetros de calidad del agua</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsContent dateRange={dateRange} />
          </CardContent>
        </Card>
      </div>

      {/* Reportes disponibles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reporte Diario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Resumen diario de parámetros y alertas</p>
            <Badge variant="secondary">Disponible</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análisis Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Tendencias y comparativas semanales</p>
            <Badge variant="secondary">Disponible</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Reporte Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Análisis completo mensual con recomendaciones</p>
            <Badge variant="secondary">Disponible</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
