"use client"

import { useMemo, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  Fish,
  MapPin,
  Radio,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Bell,
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
  const isSimpleOperatorView = user?.role === "standard" || user?.role === "operator"

  const isSensorOperational = (sensor: any) => {
    const status = String(sensor?.status ?? sensor?.estado_operativo ?? sensor?.estado ?? "").toLowerCase()
    return status === "active" || status === "activo"
  }

  const isAlertRead = (alert: any) => {
    if (typeof alert?.read === "boolean") return Boolean(alert.read)
    if (typeof alert?.leida === "boolean") return Boolean(alert.leida)
    return false
  }

  const formatDateLabel = (value?: string) => {
    if (!value) return "Sin fecha"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return "Sin fecha"
    return parsed.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Estado para promedios últimas 24h
  const [promedios24h, setPromedios24h] = useState({
    temperatura: 0,
    ph: 0,
    oxigeno: 0,
    loading: true,
  })
  const lastPromediosRequestKeyRef = useRef<string>("")

  const detectMetricType = (sensor: any): "temperature" | "ph" | "oxygen" | "other" => {
    const raw = String(
      sensor?.type ??
        sensor?.tipoMedida ??
        sensor?.tipo_medida ??
        sensor?.catalogo_sensores?.nombre ??
        sensor?.catalogo_sensores?.tipo_medida ??
        sensor?.descripcion ??
        "",
    )
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    if (raw.includes("temp") || raw.includes("temperatura")) return "temperature"
    if (raw.includes("ph") || raw.includes("potencial") || raw.includes("hidrogeno")) return "ph"
    if (raw.includes("oxigeno") || raw.includes("oxygen") || raw.includes("o2")) return "oxygen"
    return "other"
  }

  const activeFacilitySignature = useMemo(() => {
    if (!Array.isArray(app?.instalaciones) || app.instalaciones.length === 0) return ""
    return app.instalaciones
      .filter((instalacion: any) => instalacion.estado_operativo === "activo")
      .map((instalacion: any) => Number(instalacion.id_instalacion))
      .filter((id: number) => Number.isFinite(id) && id > 0)
      .sort((a: number, b: number) => a - b)
      .join(",")
  }, [app?.instalaciones])

  // Calcular promedios de últimas 24h (con deduplicación por minuto para evitar tormenta de requests)
  useEffect(() => {
    const MAX_SENSORS_PER_METRIC = 3

    async function fetchPromedios() {
      if (!isAuthenticated || !user) {
        lastPromediosRequestKeyRef.current = ""
        setPromedios24h({ temperatura: 0, ph: 0, oxigeno: 0, loading: false })
        return
      }

      if (isSimpleOperatorView) {
        lastPromediosRequestKeyRef.current = ""
        setPromedios24h({ temperatura: 0, ph: 0, oxigeno: 0, loading: false })
        return
      }

      const nowBucketMs = Math.floor(Date.now() / 60000) * 60000
      const requestKey = `${user.id || user.email || user.role}:${activeFacilitySignature}:${nowBucketMs}`
      if (lastPromediosRequestKeyRef.current === requestKey) return
      lastPromediosRequestKeyRef.current = requestKey

      setPromedios24h((prev) => ({ ...prev, loading: true }))

      const ahora = new Date(nowBucketMs)
      const hace24h = new Date(nowBucketMs - 24 * 60 * 60 * 1000)
      const desde = hace24h.toISOString()
      const hasta = ahora.toISOString()

      let sensoresFuente: any[] = []
      try {
        const sensoresResp = await backendApi.getSensoresInstalados({ page: 1, limit: 1000 })
        const payload: any = sensoresResp
        const sensoresDb: any[] = Array.isArray(payload) ? payload : payload?.data || []

        if (user.role === "superadmin") {
          sensoresFuente = sensoresDb
        } else {
          const activeFacilityIds = new Set<number>(
            (app?.instalaciones ?? [])
              .filter((instalacion: any) => instalacion.estado_operativo === "activo")
              .map((instalacion: any) => Number(instalacion.id_instalacion))
              .filter((id: number) => Number.isFinite(id) && id > 0),
          )

          sensoresFuente = sensoresDb.filter((sensor: any) => {
            const facilityId = Number(sensor?.id_instalacion ?? sensor?.instalacion?.id_instalacion ?? 0)
            return Number.isFinite(facilityId) && activeFacilityIds.has(facilityId)
          })
        }
      } catch {
        // fallback a sensores ya cargados en frontend si falla consulta directa
        sensoresFuente = sensors
      }

      if (!sensoresFuente.length) {
        setPromedios24h({ temperatura: 0, ph: 0, oxigeno: 0, loading: false })
        return
      }

      const tempSensors = sensoresFuente.filter((s: any) => detectMetricType(s) === "temperature")
      const phSensors = sensoresFuente.filter((s: any) => detectMetricType(s) === "ph")
      const oxSensors = sensoresFuente.filter((s: any) => detectMetricType(s) === "oxygen")

      const fetchAvg = async (sensorList: any[]) => {
        if (!sensorList.length) return 0
        let sum = 0
        let count = 0
        await Promise.all(
          sensorList.slice(0, MAX_SENSORS_PER_METRIC).map(async (s: any) => {
            try {
              const sensorId = Number(s.id_sensor_instalado)
              if (!Number.isFinite(sensorId) || sensorId <= 0) return
              const resp = await backendApi.getPromedios({
                sensorInstaladoId: sensorId,
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
          }),
        )
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
  }, [activeFacilitySignature, app?.instalaciones, isAuthenticated, isSimpleOperatorView, sensors, user])

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

  const sensoresActivos = sensors.filter(isSensorOperational).length
  const sensoresTotal = sensors.length

  const instalacionesActivas = stats?.instalaciones_activas ?? instalaciones.filter((i: any) => i.estado_operativo === "activo").length
  const procesosActivos = procesos.filter((p: any) => {
    const now = new Date()
    const inicio = new Date(p.fecha_inicio)
    const fin = new Date(p.fecha_final)
    return now >= inicio && now <= fin
  })
  const notificacionesNoLeidas = alerts.filter((alert: any) => !isAlertRead(alert)).length
  const sensoresConAtencion = sensors.filter((sensor: any) => !isSensorOperational(sensor)).slice(0, 6)
  const ultimasNotificaciones = [...alerts]
    .sort((a: any, b: any) => {
      const aTime = new Date(a?.fecha_alerta ?? a?.fecha ?? a?.fecha_hora_alerta ?? 0).getTime()
      const bTime = new Date(b?.fecha_alerta ?? b?.fecha ?? b?.fecha_hora_alerta ?? 0).getTime()
      return bTime - aTime
    })
    .slice(0, 6)
  const procesosActivosResumen = [...procesosActivos]
    .sort((a: any, b: any) => {
      const aTime = new Date(a?.fecha_final ?? 0).getTime()
      const bTime = new Date(b?.fecha_final ?? 0).getTime()
      return aTime - bTime
    })
    .slice(0, 6)

  const loadingApp = app?.isLoading ?? false
  const error = app?.error
  const refreshData = app?.refreshData

  const nombreEmpresaById = useMemo(
    () =>
      new Map<number, string>(
        empresasSucursales.map((empresa: any) => [Number(empresa.id_empresa_sucursal), String(empresa.nombre || "")]),
      ),
    [empresasSucursales],
  )

  const procesoByInstalacion = useMemo(() => {
    const byInstalacion = new Map<number, any>()
    for (const proceso of procesos) {
      const idInstalacion = Number((proceso as any).id_instalacion ?? 0)
      if (!Number.isFinite(idInstalacion) || idInstalacion <= 0 || byInstalacion.has(idInstalacion)) continue
      byInstalacion.set(idInstalacion, proceso)
    }
    return byInstalacion
  }, [procesos])

  const instalacionesResumen = useMemo(() => {
    return [...instalaciones]
      .sort((a: any, b: any) => {
        const aTime = new Date(a.fecha_instalacion ?? a.created_at ?? 0).getTime()
        const bTime = new Date(b.fecha_instalacion ?? b.created_at ?? 0).getTime()
        return bTime - aTime
      })
      .slice(0, 6)
      .map((instalacion: any) => {
        const proceso = procesoByInstalacion.get(Number(instalacion.id_instalacion))
        const nombreEmpresa =
          instalacion.nombre_empresa ??
          nombreEmpresaById.get(Number(instalacion.id_empresa_sucursal ?? 0)) ??
          "Sin organización"
        return {
          ...instalacion,
          nombreEmpresa,
          proceso,
        }
      })
  }, [instalaciones, nombreEmpresaById, procesoByInstalacion])

  if (isSimpleOperatorView) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Waves className="h-8 w-8 text-cyan-600" />
              Inicio del Operador
            </h1>
            <p className="text-muted-foreground mt-1">
              Hola, {user.name || user.email}. Aqui tienes sensores, notificaciones y procesos en una vista simple.
            </p>
          </div>
          <Button variant="outline" onClick={() => refreshData?.()} disabled={loadingApp}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingApp ? "animate-spin" : ""}`} />
            Actualizar datos
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-600" />
                Sensores
              </CardTitle>
              <CardDescription>Estado general de los sensores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-semibold">
                {sensoresActivos}
                <span className="text-base font-normal text-muted-foreground"> / {sensoresTotal}</span>
              </p>
              <Badge variant={sensoresConAtencion.length > 0 ? "destructive" : "secondary"}>
                {sensoresConAtencion.length > 0
                  ? `${sensoresConAtencion.length} sensor(es) por revisar`
                  : "Sin sensores con alerta"}
              </Badge>
              <Button className="w-full" variant="outline" onClick={() => router.push("/sensors")}>
                Ver sensores
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-600" />
                Notificaciones
              </CardTitle>
              <CardDescription>Alertas más recientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-semibold">{notificacionesNoLeidas}</p>
              <p className="text-sm text-muted-foreground">
                sin leer de {alerts.length} total
              </p>
              <Button className="w-full" variant="outline" onClick={() => router.push("/notifications")}>
                Ver notificaciones
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                Procesos
              </CardTitle>
              <CardDescription>Seguimiento de procesos activos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-semibold">
                {procesosActivos.length}
                <span className="text-base font-normal text-muted-foreground"> / {procesos.length}</span>
              </p>
              <Badge variant="secondary">{procesosActivos.length > 0 ? "Hay procesos en curso" : "Sin procesos activos"}</Badge>
              <Button className="w-full" variant="outline" onClick={() => router.push("/procesos")}>
                Ver procesos
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sensores que requieren revision</CardTitle>
              <CardDescription>Solo se muestran los casos que necesitan atencion</CardDescription>
            </CardHeader>
            <CardContent>
              {sensoresConAtencion.length === 0 ? (
                <div className="text-sm text-muted-foreground">Todo en orden. No hay sensores pendientes de revision.</div>
              ) : (
                <div className="space-y-2">
                  {sensoresConAtencion.map((sensor: any, index: number) => {
                    const statusRaw = String(sensor?.status ?? sensor?.estado_operativo ?? sensor?.estado ?? "").toLowerCase()
                    const sensorName = String(
                      sensor?.name ??
                        sensor?.nombre ??
                        sensor?.sensor ??
                        sensor?.catalogo_sensores?.nombre ??
                        `Sensor ${sensor?.id_sensor_instalado ?? index + 1}`,
                    )
                    const estadoLabel = statusRaw === "inactive" || statusRaw === "inactivo" ? "Inactivo" : "Revisar"
                    return (
                      <div
                        key={`${sensor?.id_sensor_instalado ?? sensor?.id ?? "sensor"}-${index}`}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <p className="font-medium">{sensorName}</p>
                        <Badge variant="destructive">{estadoLabel}</Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ultimas notificaciones</CardTitle>
              <CardDescription>Mensajes recientes del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {ultimasNotificaciones.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay notificaciones recientes.</div>
              ) : (
                <div className="space-y-2">
                  {ultimasNotificaciones.map((alerta: any, index: number) => {
                    const descripcion = String(alerta?.descripcion ?? alerta?.mensaje_alerta ?? alerta?.title ?? "Notificacion")
                    const fecha = String(alerta?.fecha_alerta ?? alerta?.fecha ?? alerta?.fecha_hora_alerta ?? "")
                    const leida = isAlertRead(alerta)

                    return (
                      <div
                        key={`${alerta?.id_alertas ?? alerta?.id_alerta ?? "alerta"}-${index}`}
                        className="rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{descripcion}</p>
                          <Badge variant={leida ? "outline" : "destructive"}>{leida ? "Leida" : "Nueva"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatDateLabel(fecha)}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Procesos en curso</CardTitle>
            <CardDescription>Los proximos procesos por fecha de cierre</CardDescription>
          </CardHeader>
          <CardContent>
            {procesosActivosResumen.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay procesos activos por el momento.</div>
            ) : (
              <div className="space-y-2">
                {procesosActivosResumen.map((proceso: any, index: number) => (
                  <div
                    key={`${proceso?.id_proceso ?? "proceso"}-${index}`}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{proceso?.nombre_proceso || `Proceso #${proceso?.id_proceso ?? index + 1}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {proceso?.nombre_especie || `Especie #${proceso?.id_especie ?? "N/A"}`}
                      </p>
                    </div>
                    <Badge variant="secondary">Fin: {formatDateLabel(proceso?.fecha_final)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Accesos rápidos
  const quickActions = [
    { label: "Ver Sensores", icon: Radio, href: "/sensors", color: "text-blue-600" },
    { label: "Analítica", icon: TrendingUp, href: "/analytics", color: "text-purple-600" },
    { label: "Mapa", icon: MapPin, href: "/map", color: "text-orange-600" },
  ]

  const indicadoresCalidad = [
    {
      key: "temperatura",
      label: "Temperatura",
      value: `${promedios24h.temperatura.toFixed(1)}°C`,
      ok: promedios24h.temperatura >= 20 && promedios24h.temperatura <= 30,
    },
    {
      key: "ph",
      label: "pH",
      value: promedios24h.ph.toFixed(1),
      ok: promedios24h.ph >= 6.5 && promedios24h.ph <= 8.5,
    },
    {
      key: "oxigeno",
      label: "Oxígeno",
      value: `${promedios24h.oxigeno.toFixed(1)} mg/L`,
      ok: promedios24h.oxigeno >= 4,
    },
  ]
  const parametrosFueraRango = indicadoresCalidad.filter((item) => !item.ok).length

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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Centro de Operaciones</CardTitle>
              <CardDescription>Monitoreo, catálogo e instalaciones en una sola vista</CardDescription>
            </div>
            {promedios24h.loading ? (
              <Badge variant="outline">Calculando calidad del agua...</Badge>
            ) : (
              <Badge variant={parametrosFueraRango > 0 ? "destructive" : "default"}>
                {parametrosFueraRango > 0 ? `${parametrosFueraRango} parámetros fuera de rango` : "Parámetros en rango"}
              </Badge>
            )}
          </div>
          <Separator />
          {!promedios24h.loading && (
            <div className="flex flex-wrap gap-2">
              {indicadoresCalidad.map((item) => (
                <Badge key={item.key} variant={item.ok ? "secondary" : "destructive"}>
                  {item.label}: {item.value}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monitoreo" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="monitoreo">Monitoreo</TabsTrigger>
              <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
              <TabsTrigger value="instalaciones">Instalaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="monitoreo" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2">
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
                          const diasRestantes = Math.max(
                            0,
                            Math.ceil((new Date(p.fecha_final).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                          )
                          const diasTotal = Math.ceil(
                            (new Date(p.fecha_final).getTime() - new Date(p.fecha_inicio).getTime()) /
                              (1000 * 60 * 60 * 24),
                          )
                          const progreso = Math.min(100, Math.max(0, ((diasTotal - diasRestantes) / diasTotal) * 100))

                          return (
                            <div
                              key={p.id_proceso}
                              className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/analytics?proceso=${p.id_proceso}`)}
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
              </div>
            </TabsContent>

            <TabsContent value="catalogo" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2">
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
                      <ScrollArea className="h-[280px] pr-4">
                        <div className="space-y-2">
                          {especies.slice(0, 10).map((e: any) => (
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
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="instalaciones">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Instalaciones Recientes</CardTitle>
                    <CardDescription>Conectadas desde backend y listas para monitoreo/procesos</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/instalaciones")}>
                    Ver instalaciones
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {instalacionesResumen.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No hay instalaciones disponibles para este usuario.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Instalación</TableHead>
                          <TableHead>Organización</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Proceso</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {instalacionesResumen.map((instalacion: any) => (
                          <TableRow key={instalacion.id_instalacion}>
                            <TableCell className="font-medium">
                              {instalacion.nombre_instalacion || `Instalación ${instalacion.id_instalacion}`}
                            </TableCell>
                            <TableCell>{instalacion.nombreEmpresa}</TableCell>
                            <TableCell>
                              <Badge variant={instalacion.estado_operativo === "activo" ? "default" : "secondary"}>
                                {instalacion.estado_operativo === "activo" ? "Activa" : "Inactiva"}
                              </Badge>
                            </TableCell>
                            <TableCell>{instalacion.proceso?.nombre_proceso || "Sin proceso"}</TableCell>
                            <TableCell>
                              {new Date(
                                instalacion.fecha_instalacion ?? instalacion.created_at ?? Date.now(),
                              ).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
