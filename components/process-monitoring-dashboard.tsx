"use client"

import { useState } from "react"
import { useLecturasPorProceso } from "@/hooks/use-lecturas-por-proceso"
import type { ProcesoDetallado } from "@/types/proceso"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParameterMonitoringCard } from "./parameter-monitoring-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  RefreshCw,
  Calendar,
  AlertTriangle,
  Activity,
  BarChart3,
  TrendingUp,
  Thermometer,
  Droplets,
  Eye,
  Zap,
} from "lucide-react"

interface ProcessMonitoringDashboardProps {
  proceso: ProcesoDetallado
}

export function ProcessMonitoringDashboard({ proceso }: ProcessMonitoringDashboardProps) {
  const [periodo, setPeriodo] = useState("proceso_completo")
  const [activeTab, setActiveTab] = useState("graficas")
  const [isRealTime, setIsRealTime] = useState(false)

  // Calcular fechas según el período seleccionado
  const getFechas = () => {
    const ahora = new Date()
    const inicioProcesoDate = new Date(proceso.fecha_inicio)
    const finProcesoDate = new Date(proceso.fecha_final)
    switch (periodo) {
      case "ultimo_dia": {
        const ayer = new Date(ahora)
        ayer.setDate(ayer.getDate() - 1)
        return {
          inicio: ayer.toISOString().split("T")[0],
          fin: ahora.toISOString().split("T")[0],
        }
      }
      case "ultima_semana": {
        const semanaAtras = new Date(ahora)
        semanaAtras.setDate(semanaAtras.getDate() - 7)
        return {
          inicio: semanaAtras.toISOString().split("T")[0],
          fin: ahora.toISOString().split("T")[0],
        }
      }
      case "proceso_completo":
      default:
        return {
          inicio: proceso.fecha_inicio,
          fin: proceso.fecha_final,
        }
    }
  }

  const { inicio, fin } = getFechas()
  const { parametros, loading, error, lastUpdated, refresh } = useLecturasPorProceso(
    proceso.id_proceso,
    inicio,
    fin
  )

  const getPeriodoLabel = () => {
    switch (periodo) {
      case "ultimo_dia":
        return "Últimas 24 horas"
      case "ultima_semana":
        return "Última semana"
      case "proceso_completo":
        return `Todo el proceso (${proceso.fecha_inicio} - ${proceso.fecha_final})`
      default:
        return "Período seleccionado"
    }
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return ""
    return lastUpdated.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Calcular estadísticas de los parámetros
  const getParameterStats = () => {
    const total = parametros.length
    const normal = parametros.filter((p) => p.estado === "normal").length
    const advertencia = parametros.filter((p) => p.estado === "advertencia").length
    const critico = parametros.filter((p) => p.estado === "critico").length
    const totalAlertas = parametros.reduce((sum, p) => sum + (p.alertas_count ?? 0), 0)
    return { total, normal, advertencia, critico, totalAlertas }
  }
  const stats = getParameterStats()

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Error al cargar los datos de monitoreo: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monitoreo de Proceso
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{getPeriodoLabel()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultimo_dia">Últimas 24 horas</SelectItem>
                  <SelectItem value="ultima_semana">Última semana</SelectItem>
                  <SelectItem value="proceso_completo">Desde el inicio del proceso</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant={isRealTime ? "default" : "outline"}
                size="sm"
                onClick={() => setIsRealTime(!isRealTime)}
                className={isRealTime ? "bg-green-50 border-green-200 text-green-700" : ""}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRealTime ? "animate-spin" : ""}`} />
                {isRealTime ? "Tiempo Real" : "Histórico"}
              </Button>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Límites del proceso: {proceso.fecha_inicio} - {proceso.fecha_final}
              <span className="ml-2">• Última actualización: {formatLastUpdated()}</span>
            </p>
          )}
        </CardHeader>
      </Card>
      {/* Estadísticas de parámetros */}
      {parametros.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Parámetros</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.normal}</div>
              <div className="text-sm text-muted-foreground">Normales</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.advertencia}</div>
              <div className="text-sm text-muted-foreground">Advertencias</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.critico}</div>
              <div className="text-sm text-muted-foreground">Críticos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalAlertas}</div>
              <div className="text-sm text-muted-foreground">Alertas</div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Alerta si hay parámetros críticos */}
      {(stats.critico > 0 || stats.totalAlertas > 0) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atención requerida:</strong> {stats.critico} parámetro(s) en estado crítico y {stats.totalAlertas} alerta(s) activa(s).
          </AlertDescription>
        </Alert>
      )}
      {/* Información sobre las gráficas */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Gráficas Interactivas</h3>
              <p className="text-sm text-blue-700">
                Cambia entre vista histórica y tiempo real. Las gráficas en tiempo real se actualizan cada 30 segundos. Puedes descargar los datos en formato CSV desde cada gráfica.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabs para diferentes vistas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="graficas" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Gráficas Interactivas
          </TabsTrigger>
          <TabsTrigger value="resumen" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Resumen de Datos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="graficas" className="mt-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-48 w-full mb-2" />
                    <Skeleton className="h-6 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : parametros.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parametros.map((parametro) => (
                <ParameterMonitoringCard key={parametro.nombre ?? parametro.nombre_parametro} parametro={parametro} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay datos disponibles</h3>
                  <p className="text-muted-foreground">
                    No se encontraron lecturas de sensores para el período seleccionado.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="resumen" className="mt-0">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <div className="grid grid-cols-3 gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : parametros.length > 0 ? (
            <div className="space-y-4">
              {parametros.map((parametro) => (
                <Card key={parametro.nombre ?? parametro.nombre_parametro}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getParameterIcon(parametro.nombre ?? parametro.nombre_parametro)}
                        <h3 className="text-lg font-semibold">{parametro.nombre ?? parametro.nombre_parametro}</h3>
                        <span className="text-sm text-muted-foreground">({parametro.unidad ?? parametro.unidad_medida})</span>
                      </div>
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(parametro.estado ?? "normal")}`}
                      >
                        {parametro.estado === "normal" && "✓ Normal"}
                        {parametro.estado === "advertencia" && "⚠️ Advertencia"}
                        {parametro.estado === "critico" && "🚨 Crítico"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Promedio:</span>
                        <div className="text-lg font-semibold">
                          {(parametro.promedio ?? 0).toFixed(2)} {parametro.unidad ?? parametro.unidad_medida}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Rango Óptimo:</span>
                        <div className="text-lg font-semibold">
                          {parametro.rango_min ?? 0} - {parametro.rango_max ?? 0}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Lecturas:</span>
                        <div className="text-lg font-semibold">{(parametro.lecturas || []).length}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Alertas:</span>
                        <div className="text-lg font-semibold text-red-600">{parametro.alertas_count ?? 0}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay datos disponibles</h3>
                  <p className="text-muted-foreground">
                    No se encontraron lecturas de sensores para el período seleccionado.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getParameterIcon(nombre: string) {
  switch (nombre.toLowerCase()) {
    case "temperatura":
      return <Thermometer className="h-5 w-5" />
    case "ph":
      return <Droplets className="h-5 w-5" />
    case "oxígeno disuelto":
    case "oxigeno":
      return <Droplets className="h-5 w-5" />
    case "turbidez":
      return <Eye className="h-5 w-5" />
    case "conductividad":
      return <Zap className="h-5 w-5" />
    default:
      return <Droplets className="h-5 w-5" />
  }
}

function getStatusColor(estado: string) {
  switch (estado) {
    case "normal":
      return "bg-green-100 text-green-800 border-green-200"
    case "advertencia":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "critico":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}
