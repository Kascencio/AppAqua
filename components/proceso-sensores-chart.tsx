"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useSensoresDeInstalacion } from "@/hooks/use-sensores-instalacion"
import { useLecturasPorRango } from "@/hooks/use-lecturas-rango"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Thermometer, Droplets, Activity, Waves, Eye, AlertCircle, Gauge, Calendar, MapPin } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ProcesoSensoresChartProps {
  proceso: {
    id_proceso?: number | string
    nombre?: string
    descripcion?: string
    id_instalacion: number | string
    fecha_inicio: string
    fecha_fin?: string
    estado?: string
  }
}

const iconosPorParametro: Record<string, any> = {
  ph: Droplets,
  temperatura: Thermometer,
  oxigeno: Activity,
  salinidad: Waves,
  turbidez: Eye,
}

const coloresPorParametro: Record<string, string> = {
  ph: "#3b82f6",
  temperatura: "#ef4444",
  oxigeno: "#10b981",
  salinidad: "#8b5cf6",
  turbidez: "#f59e0b",
}

export function ProcesoSensoresChart({ proceso }: ProcesoSensoresChartProps) {
  const { sensores, loading: loadingSensores, error: errorSensores } = useSensoresDeInstalacion(proceso.id_instalacion)
  const {
    lecturas,
    loading: loadingLecturas,
    error: errorLecturas,
  } = useLecturasPorRango(proceso.id_instalacion, proceso.fecha_inicio, proceso.fecha_fin)

  // Agrupar lecturas por parámetro
  const parametros = Array.from(new Set(lecturas.map((l) => l.tipo_parametro)))

  const datosGraficas = parametros.reduce(
    (acc, parametro) => {
      const lecturasParametro = lecturas
        .filter((l) => l.tipo_parametro === parametro)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((l) => ({
          fecha: format(new Date(l.timestamp), "dd/MM HH:mm", { locale: es }),
          valor: l.valor,
          timestamp: l.timestamp,
        }))

      acc[parametro] = lecturasParametro
      return acc
    },
    {} as Record<string, any[]>,
  )

  if (loadingSensores || loadingLecturas) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (errorSensores || errorLecturas) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error al cargar datos: {errorSensores || errorLecturas}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información del proceso */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{proceso.nombre || `Proceso #${proceso.id_proceso}`}</CardTitle>
              {proceso.descripcion && <p className="text-muted-foreground mt-1">{proceso.descripcion}</p>}
            </div>
            {proceso.estado && (
              <Badge variant={proceso.estado === "activo" ? "default" : "secondary"}>{proceso.estado}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Instalación: {proceso.id_instalacion}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Inicio: {format(new Date(proceso.fecha_inicio), "dd/MM/yyyy", { locale: es })}
              </span>
            </div>
            {proceso.fecha_fin && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Fin: {format(new Date(proceso.fecha_fin), "dd/MM/yyyy", { locale: es })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de sensores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Sensores de la Instalación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sensores.length === 0 ? (
            <div className="text-center py-8">
              <Gauge className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay sensores asociados a esta instalación</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensores.map((sensor) => {
                const Icono = iconosPorParametro[sensor.tipo_sensor] || Gauge
                return (
                  <Card
                    key={sensor.id_sensor}
                    className="border-l-4"
                    style={{ borderLeftColor: coloresPorParametro[sensor.tipo_sensor] || "#6b7280" }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icono className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{sensor.nombre_sensor}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{sensor.tipo_sensor}</p>
                          {sensor.ubicacion && <p className="text-xs text-muted-foreground mt-1">{sensor.ubicacion}</p>}
                          <Badge
                            variant={
                              sensor.estado === "activo"
                                ? "default"
                                : sensor.estado === "mantenimiento"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="mt-2 text-xs"
                          >
                            {sensor.estado}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficas por parámetro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Histórico de Parámetros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parametros.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay lecturas registradas para el rango de fechas del proceso</p>
            </div>
          ) : (
            <div className="space-y-8">
              {parametros.map((parametro) => {
                const Icono = iconosPorParametro[parametro] || Activity
                const color = coloresPorParametro[parametro] || "#6b7280"
                const datos = datosGraficas[parametro] || []
                const unidad = lecturas.find((l) => l.tipo_parametro === parametro)?.unidad || ""

                return (
                  <div key={parametro} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Icono className="h-5 w-5" style={{ color }} />
                      <h3 className="text-lg font-medium capitalize">{parametro}</h3>
                      {unidad && <Badge variant="outline">{unidad}</Badge>}
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={datos}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="fecha" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            labelFormatter={(label) => `Fecha: ${label}`}
                            formatter={(value: any) => [`${value} ${unidad}`, parametro]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="valor"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ fill: color, strokeWidth: 2, r: 4 }}
                            name={`${parametro} (${unidad})`}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
