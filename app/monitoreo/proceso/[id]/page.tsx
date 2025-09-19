"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { DateRangePicker } from "@/components/date-range-picker"
import { ProcessParameterChart } from "@/components/process-parameter-chart"
import { SensorMonitoringCard } from "@/components/sensor-monitoring-card"
import type { Proceso, Instalacion, Especie, SensorInstalado, Lectura, CatalogoSensor, EmpresaSucursal } from "@/types"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  Fish,
  Thermometer,
  Droplets,
  AlertTriangle,
  TrendingUp,
  Clock,
  Activity,
  RefreshCw,
} from "lucide-react"

// Tipo extendido para el detalle completo del proceso
interface ProcesoDetalleCompleto extends Proceso {
  instalacion: Instalacion & {
    empresa_sucursal: EmpresaSucursal
  }
  especie: Especie
  sensores_instalados: (SensorInstalado & {
    sensor_info: CatalogoSensor
    lecturas_recientes: Lectura[]
  })[]
  estadisticas: {
    dias_transcurridos: number
    dias_restantes: number
    progreso_porcentaje: number
    total_lecturas: number
    lecturas_hoy: number
    parametros_monitoreados: number
    alertas_activas: number
  }
}

export default function ProcesoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const procesoId = Number.parseInt(params.id as string)

  const [proceso, setProceso] = useState<ProcesoDetalleCompleto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
    to: new Date(),
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Simular fetch de datos del proceso
  useEffect(() => {
    const fetchProcesoDetalle = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Simular delay de API
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Simular error ocasional
        if (Math.random() < 0.1) {
          throw new Error("Error de conexión con el servidor")
        }

        // Verificar si el proceso existe
        if (procesoId !== 1) {
          throw new Error(`Proceso con ID ${procesoId} no encontrado`)
        }

        // setProceso(mockProcesoDetalle) // Eliminar uso de mockProcesoDetalle
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    if (procesoId) {
      fetchProcesoDetalle()
    }
  }, [procesoId])

  // Función para refrescar datos
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (proceso) {
      // Simular actualización de estadísticas
      setProceso((prev) =>
        prev
          ? {
              ...prev,
              estadisticas: {
                ...prev.estadisticas,
                lecturas_hoy: prev.estadisticas.lecturas_hoy + Math.floor(Math.random() * 5),
                total_lecturas: prev.estadisticas.total_lecturas + Math.floor(Math.random() * 10),
              },
            }
          : null,
      )
    }

    setIsRefreshing(false)
  }

  // Calcular parámetros fuera de rango
  const parametrosFueraDeRango = useMemo(() => {
    if (!proceso) return []

    const fuera: Array<{
      sensor: string
      valor: number
      rango_min: number
      rango_max: number
      unidad: string
    }> = []

    proceso.sensores_instalados.forEach((sensor) => {
      const ultimaLectura = sensor.lecturas_recientes[0]
      if (!ultimaLectura) return

      let rango_min = 0,
        rango_max = 100

      // Definir rangos óptimos según el tipo de sensor y especie
      switch (sensor.sensor_info.sensor) {
        case "pH":
          rango_min = proceso.especie.ph_optimo_min || 6.5
          rango_max = proceso.especie.ph_optimo_max || 8.5
          break
        case "Temperatura":
          rango_min = proceso.especie.temperatura_optima_min || 24
          rango_max = proceso.especie.temperatura_optima_max || 30
          break
        case "Oxígeno Disuelto":
          rango_min = proceso.especie.oxigeno_minimo || 5.0
          rango_max = 12.0
          break
      }

      if (ultimaLectura.valor < rango_min || ultimaLectura.valor > rango_max) {
        fuera.push({
          sensor: sensor.sensor_info.sensor,
          valor: ultimaLectura.valor,
          rango_min,
          rango_max,
          unidad: sensor.sensor_info.unidad_medida || "",
        })
      }
    })

    return fuera
  }, [proceso])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Error al cargar proceso</h1>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="ml-2">
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!proceso) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No se encontraron datos para este proceso.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Proceso de {proceso.especie.nombre}</h1>
          <p className="text-muted-foreground">
            {proceso.instalacion.nombre_instalacion} - {proceso.instalacion.empresa_sucursal.nombre}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso del Cultivo</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proceso.estadisticas.progreso_porcentaje.toFixed(1)}%</div>
            <Progress value={proceso.estadisticas.progreso_porcentaje} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {proceso.estadisticas.dias_transcurridos} de{" "}
              {proceso.estadisticas.dias_transcurridos + proceso.estadisticas.dias_restantes} días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lecturas Hoy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proceso.estadisticas.lecturas_hoy}</div>
            <p className="text-xs text-muted-foreground">
              Total: {proceso.estadisticas.total_lecturas.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parámetros</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proceso.estadisticas.parametros_monitoreados}</div>
            <p className="text-xs text-muted-foreground">Monitoreados activamente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{proceso.estadisticas.alertas_activas}</div>
            <p className="text-xs text-muted-foreground">
              {parametrosFueraDeRango.length > 0 ? `${parametrosFueraDeRango.length} fuera de rango` : "Todo normal"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas fuera de rango */}
      {parametrosFueraDeRango.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Parámetros fuera de rango:</strong>
            <ul className="mt-2 space-y-1">
              {parametrosFueraDeRango.map((param, index) => (
                <li key={index} className="text-sm">
                  • {param.sensor}: {param.valor} {param.unidad} (rango óptimo: {param.rango_min}-{param.rango_max}{" "}
                  {param.unidad})
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts and Monitoring */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="charts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="charts">Gráficos</TabsTrigger>
              <TabsTrigger value="sensors">Sensores</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Parámetros en Tiempo Real</CardTitle>
                      <CardDescription>Monitoreo continuo de los parámetros críticos del cultivo</CardDescription>
                    </div>
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ProcessParameterChart
                    procesoId={proceso.id_proceso}
                    dateRange={dateRange}
                    sensores={proceso.sensores_instalados}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sensors" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proceso.sensores_instalados.map((sensor) => (
                  <SensorMonitoringCard key={sensor.id_sensor_instalado} sensor={sensor} especie={proceso.especie} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Lecturas</CardTitle>
                  <CardDescription>Registro histórico de todas las mediciones del proceso</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proceso.sensores_instalados.map((sensor) => (
                      <div key={sensor.id_sensor_instalado} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{sensor.sensor_info.sensor}</h4>
                        <div className="space-y-2">
                          {sensor.lecturas_recientes.map((lectura) => (
                            <div key={lectura.id_lectura} className="flex justify-between items-center text-sm">
                              <span>
                                {lectura.fecha} {lectura.hora}
                              </span>
                              <span className="font-mono">
                                {lectura.valor} {sensor.sensor_info.unidad_medida}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Información del Proceso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5" />
                Información del Proceso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Inicio: {new Date(proceso.fecha_inicio).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Fin estimado: {new Date(proceso.fecha_final).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Duración: {proceso.estadisticas.dias_transcurridos + proceso.estadisticas.dias_restantes} días
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <h4 className="font-semibold mb-2">Especie: {proceso.especie.nombre}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Nombre científico:</strong> {proceso.especie.nombre_cientifico}
                  </p>
                  <p>
                    <strong>Familia:</strong> {proceso.especie.familia}
                  </p>
                  <p>
                    <strong>Tipo de agua:</strong> {proceso.especie.tipo_agua}
                  </p>
                  <p>
                    <strong>Tiempo de cultivo:</strong> {proceso.especie.tiempo_cultivo_dias} días
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Instalación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Instalación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">{proceso.instalacion.nombre_instalacion}</h4>
                <p className="text-sm text-muted-foreground mt-1">{proceso.instalacion.descripcion}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{proceso.instalacion.empresa_sucursal.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {proceso.instalacion.empresa_sucursal.calle}, {proceso.instalacion.empresa_sucursal.colonia}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Instalada: {new Date(proceso.instalacion.fecha_instalacion).toLocaleDateString()}</span>
                </div>
              </div>

              <Badge variant={proceso.instalacion.estado_operativo === "activo" ? "default" : "destructive"}>
                {proceso.instalacion.estado_operativo === "activo" ? "Activa" : "Inactiva"}
              </Badge>
            </CardContent>
          </Card>

          {/* Parámetros Óptimos */}
          <Card>
            <CardHeader>
              <CardTitle>Parámetros Óptimos</CardTitle>
              <CardDescription>Rangos ideales para {proceso.especie.nombre}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Temperatura:</span>
                <span className="font-mono">
                  {proceso.especie.temperatura_optima_min}°C - {proceso.especie.temperatura_optima_max}°C
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>pH:</span>
                <span className="font-mono">
                  {proceso.especie.ph_optimo_min} - {proceso.especie.ph_optimo_max}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Oxígeno mínimo:</span>
                <span className="font-mono">{proceso.especie.oxigeno_minimo} mg/L</span>
              </div>
              {proceso.especie.salinidad_maxima && (
                <div className="flex justify-between items-center text-sm">
                  <span>Salinidad máx:</span>
                  <span className="font-mono">{proceso.especie.salinidad_maxima} ppt</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
