"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Building2,
  Fish,
  MapPin,
  Radio,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Thermometer,
  Droplets,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
  Waves,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { useSensors } from "@/hooks/use-sensors"
import { backendApi } from "@/lib/backend-client"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const app = useAppContext()
  const { sensors } = useSensors()

  // Estado para promedios últimas 24h
  const [promedios24h, setPromedios24h] = useState({
    temperatura: 0,
    ph: 0,
    oxigeno: 0,
    loading: true,
  })

  // Calcular promedios de últimas 24h
  useEffect(() => {
    async function fetchPromedios() {
      if (!sensors.length) {
        setPromedios24h((p) => ({ ...p, loading: false }))
        return
      }

      const ahora = new Date()
      const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)
      const desde = hace24h.toISOString()
      const hasta = ahora.toISOString()

      const tempSensors = sensors.filter((s: any) => s.type === "temperature")
      const phSensors = sensors.filter((s: any) => s.type === "ph")
      const oxSensors = sensors.filter((s: any) => s.type === "oxygen")

      const fetchAvg = async (sensorList: any[]) => {
        if (!sensorList.length) return 0
        let sum = 0
        let count = 0
        for (const s of sensorList.slice(0, 5)) {
          try {
            const resp = await backendApi.getPromedios({
              sensorInstaladoId: s.id_sensor_instalado,
              bucketMinutes: 60,
              desde,
              hasta,
            })
            const arr = Array.isArray(resp) ? resp : []
            arr.forEach((p: any) => {
              if (typeof p.promedio === "number") {
                sum += p.promedio
                count++
              }
            })
          } catch {
            // skip
          }
        }
        return count > 0 ? sum / count : 0
      }

      const [temp, ph, ox] = await Promise.all([
        fetchAvg(tempSensors),
        fetchAvg(phSensors),
        fetchAvg(oxSensors),
      ])

      setPromedios24h({ temperatura: temp, ph, oxigeno: ox, loading: false })
    }

    fetchPromedios()
  }, [sensors])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    router.push("/login")
    return null
  }

  const empresasSucursales = app?.empresasSucursales ?? []
  const instalaciones = app?.instalaciones ?? []
  const especies = app?.especies ?? []
  const procesos = app?.procesos ?? []
  const alerts = app?.alerts ?? []
  const stats = app?.stats

  const sensoresActivos = sensors.filter((s: any) => s.status === "active").length
  const sensoresTotal = sensors.length

  const instalacionesActivas = stats?.instalaciones_activas ?? instalaciones.filter((i: any) => i.estado_operativo === "activo").length
  const procesosActivos = procesos.filter((p: any) => {
    const now = new Date()
    const inicio = new Date(p.fecha_inicio)
    const fin = new Date(p.fecha_final)
    return now >= inicio && now <= fin
  })

  const loadingApp = app?.isLoading ?? false
  const error = app?.error
  const refreshData = app?.refreshData

  // Accesos rápidos
  const quickActions = [
    { label: "Ver Sensores", icon: Radio, href: "/sensors", color: "text-blue-600" },
    { label: "Monitoreo", icon: Activity, href: "/monitoreo", color: "text-green-600" },
    { label: "Analítica", icon: TrendingUp, href: "/analytics", color: "text-purple-600" },
    { label: "Mapa", icon: MapPin, href: "/map", color: "text-orange-600" },
  ]

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Waves className="h-8 w-8 text-cyan-600" />
            AQUA Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido, {user.name || user.email}. Sistema de Gestión Acuícola.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshData?.()} disabled={loadingApp}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingApp ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sensores Activos</CardTitle>
            <Radio className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sensoresActivos}
              <span className="text-muted-foreground text-base font-normal">/{sensoresTotal}</span>
            </div>
            <Progress value={sensoresTotal > 0 ? (sensoresActivos / sensoresTotal) * 100 : 0} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {sensoresTotal > 0 ? Math.round((sensoresActivos / sensoresTotal) * 100) : 0}% operativos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesos Activos</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{procesosActivos.length}</div>
            <p className="text-xs text-muted-foreground">
              de {procesos.length} procesos totales
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instalaciones</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instalacionesActivas}
              <span className="text-muted-foreground text-base font-normal">/{instalaciones.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">activas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Promedios 24h y Accesos Rápidos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Promedios últimas 24h */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Promedios Últimas 24h
            </CardTitle>
            <CardDescription>Valores promedio de parámetros clave</CardDescription>
          </CardHeader>
          <CardContent>
            {promedios24h.loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Temperatura</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{promedios24h.temperatura.toFixed(1)}°C</div>
                    <Badge variant={promedios24h.temperatura >= 20 && promedios24h.temperatura <= 30 ? "default" : "destructive"} className="text-xs">
                      {promedios24h.temperatura >= 20 && promedios24h.temperatura <= 30 ? "Normal" : "Revisar"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">pH</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{promedios24h.ph.toFixed(1)}</div>
                    <Badge variant={promedios24h.ph >= 6.5 && promedios24h.ph <= 8.5 ? "default" : "destructive"} className="text-xs">
                      {promedios24h.ph >= 6.5 && promedios24h.ph <= 8.5 ? "Normal" : "Revisar"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Oxígeno Disuelto</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{promedios24h.oxigeno.toFixed(1)} mg/L</div>
                    <Badge variant={promedios24h.oxigeno >= 4 ? "default" : "destructive"} className="text-xs">
                      {promedios24h.oxigeno >= 4 ? "Normal" : "Bajo"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accesos Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Navega a las secciones principales</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="outline"
                className="h-20 flex-col gap-2 hover:shadow-md transition-shadow"
                onClick={() => router.push(action.href)}
              >
                <action.icon className={`h-6 w-6 ${action.color}`} />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Procesos Activos y Especies */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Procesos en Curso */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Procesos en Curso</CardTitle>
              <CardDescription>Procesos activos con fechas vigentes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/procesos")}>
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {procesosActivos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Fish className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay procesos activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {procesosActivos.slice(0, 4).map((p: any) => {
                  const diasRestantes = Math.max(0, Math.ceil((new Date(p.fecha_final).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  const diasTotal = Math.ceil((new Date(p.fecha_final).getTime() - new Date(p.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24))
                  const progreso = Math.min(100, Math.max(0, ((diasTotal - diasRestantes) / diasTotal) * 100))

                  return (
                    <div
                      key={p.id_proceso}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/monitoreo/proceso/${p.id_proceso}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Proceso #{p.id_proceso}</span>
                        <Badge variant="outline">{diasRestantes}d restantes</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {p.nombre_especie || `Especie #${p.id_especie}`}
                      </p>
                      <Progress value={progreso} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de Especies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Especies Registradas</CardTitle>
              <CardDescription>Catálogo de especies en el sistema</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/especies")}>
              Ver catálogo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {especies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Fish className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay especies registradas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {especies.slice(0, 6).map((e: any) => (
                  <div key={e.id_especie} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                        <Fish className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{e.nombre}</p>
                        {e.nombre_cientifico && (
                          <p className="text-xs text-muted-foreground italic">{e.nombre_cientifico}</p>
                        )}
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                ))}
                {especies.length > 6 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{especies.length - 6} más
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
