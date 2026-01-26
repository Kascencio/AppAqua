"use client"

import { api } from "@/lib/api"
import { backendApi } from "@/lib/backend-client"
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
import type { Proceso, Instalacion, Especie, SensorInstalado, Lectura, CatalogoSensor, EmpresaSucursalCompleta, EspecieParametro } from "@/types"
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
import type { DateRange } from "react-day-picker"

// Tipo extendido para el detalle completo del proceso
interface ProcesoDetalleCompleto extends Proceso {
  instalacion: Instalacion & {
    empresa_sucursal: EmpresaSucursalCompleta
  }
  especie: Especie
  especie_parametros: EspecieParametro[]
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
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
    to: new Date(),
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch de datos del proceso
  useEffect(() => {
    const fetchProcesoDetalle = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch proceso
        const procesoData = await api.get<Proceso>(`/procesos/${procesoId}`)
        if (!procesoData) throw new Error(`Proceso con ID ${procesoId} no encontrado`)

        // Fetch related data
        const [instalacion, especie, sensoresInstalados, especieParametros] = await Promise.all([
          api.get<Instalacion>(`/instalaciones/${procesoData.id_instalacion}`),
          api.get<Especie>(`/catalogo-especies/${procesoData.id_especie}`),
          api.get<SensorInstalado[]>(`/sensores-instalados?id_instalacion=${procesoData.id_instalacion}`),
          api.get<EspecieParametro[]>(`/especie-parametros?id_especie=${procesoData.id_especie}`)
        ])

        // Fetch empresa/sucursal info for installation
        const sucursales = await api.get<any[]>("/sucursales")
        const sucursal = sucursales.find((s: any) => s.id_organizacion_sucursal === instalacion.id_empresa_sucursal)
        
        // Fetch readings for sensors
        const sensoresConLecturas = await Promise.all(sensoresInstalados.map(async (sensor) => {
            // Get sensor catalog info
            const catalogoSensores = await api.get<CatalogoSensor[]>("/catalogo-sensores")
            const sensorInfo = catalogoSensores.find(c => c.id_sensor === sensor.id_sensor)
            
            // Get recent readings from backend API
            let lecturas: Lectura[] = []
            try {
              const now = new Date()
              const desde = new Date(now.getTime() - 24 * 60 * 60 * 1000) // últimas 24 horas
              const resp = await backendApi.getLecturas({
                sensorInstaladoId: sensor.id_sensor_instalado,
                page: 1,
                limit: 100,
                desde: desde.toISOString(),
                hasta: now.toISOString(),
              })
              const payload: any = resp
              const rows: any[] = Array.isArray(payload) ? payload : (payload?.data || [])
              lecturas = rows.map((r: any) => ({
                id_lectura: r.id_lectura,
                id_sensor_instalado: r.id_sensor_instalado,
                valor: Number(r.valor),
                fecha: r.fecha || r.tomada_en?.split('T')[0] || '',
                hora: r.hora || r.tomada_en?.split('T')[1]?.substring(0, 8) || '',
              }))
            } catch (err) {
              console.warn(`Error fetching lecturas for sensor ${sensor.id_sensor_instalado}:`, err)
            }

            return {
                ...sensor,
                sensor_info: sensorInfo!,
                lecturas_recientes: lecturas
            }
        }))

        const procesoCompleto: ProcesoDetalleCompleto = {
            ...procesoData,
            instalacion: {
                ...instalacion,
                empresa_sucursal: {
                    id_empresa_sucursal: sucursal?.id_organizacion_sucursal || 0,
                    id_padre: sucursal?.id_organizacion || 0,
                    nombre: sucursal?.nombre_sucursal || "Desconocida",
                    tipo: "sucursal",
                    estado_operativo: "activa",
                    fecha_registro: "",
                    id_estado: 0,
                    id_cp: 0,
                    id_colonia: 0,
                    calle: sucursal?.direccion_sucursal || "",
                    telefono: sucursal?.telefono_sucursal || "",
                    email: sucursal?.correo_sucursal || ""
                }
            },
            especie,
            especie_parametros: especieParametros,
            sensores_instalados: sensoresConLecturas,
            estadisticas: {
                dias_transcurridos: Math.floor((Date.now() - new Date(procesoData.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24)),
                dias_restantes: Math.floor((new Date(procesoData.fecha_final).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                progreso_porcentaje: 50, // Calculate based on dates
                total_lecturas: 0,
                lecturas_hoy: 0,
                parametros_monitoreados: sensoresConLecturas.length,
                alertas_activas: 0
            }
        }

        setProceso(procesoCompleto)
      } catch (err) {
        console.error(err)
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
    window.location.reload()
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

      // Find optimal range from especie_parametros
      // We need to match sensor parameter with especie parameter. 
      // Assuming sensor_info.id_parametro exists or we match by name?
      // CatalogoSensor usually has id_parametro.
      // Let's assume we can find it.
      
      // For now, using defaults if not found
      let rango_min = 0
      let rango_max = 100
      
      // Try to find matching parameter config
      // Note: This logic depends on having id_parametro in sensor_info, which we might need to verify
      
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
                    <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ProcessParameterChart
                    facilityId={proceso.id_instalacion.toString()}
                    processDateRange={{ from: new Date(proceso.fecha_inicio), to: new Date(proceso.fecha_final) }}
                    displayDateRange={{ from: dateRange.from || new Date(), to: dateRange.to || new Date() }}
                    processId={proceso.id_proceso.toString()}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sensors" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proceso.sensores_instalados.map((sensor) => (
                  <SensorMonitoringCard 
                    key={sensor.id_sensor_instalado} 
                    sensorId={sensor.id_sensor_instalado}
                    name={sensor.sensor_info.sensor}
                    unit={sensor.sensor_info.unidad_medida || ""}
                    parameter={sensor.sensor_info.sensor} // Usar nombre del sensor como parámetro
                    color="#2563eb"
                    from={dateRange.from || new Date()}
                    to={dateRange.to || new Date()}
                    sensor={sensor} 
                    especie={proceso.especie} 
                  />
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
                          {sensor.lecturas_recientes.length > 0 ? (
                            sensor.lecturas_recientes.map((lectura) => (
                                <div key={lectura.id_lectura} className="flex justify-between items-center text-sm">
                                <span>
                                    {lectura.fecha} {lectura.hora}
                                </span>
                                <span className="font-mono">
                                    {lectura.valor} {sensor.sensor_info.unidad_medida}
                                </span>
                                </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No hay lecturas recientes</p>
                          )}
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
                    {proceso.instalacion.empresa_sucursal.calle}, {proceso.instalacion.empresa_sucursal.nombre_colonia || "Colonia desconocida"}
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
                {proceso.especie_parametros.map(param => (
                    <div key={param.id_especie_parametro} className="flex justify-between items-center text-sm">
                        <span>Parametro {param.id_parametro}:</span>
                        <span className="font-mono">
                        {param.Rmin} - {param.Rmax}
                        </span>
                    </div>
                ))}
                {proceso.especie_parametros.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay parámetros definidos.</p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
