"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Fish,
  Thermometer,
  Droplets,
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
  MapPin,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/app-context"
import { RecentAlerts } from "@/components/recent-alerts"
import { WaterQualityOverview } from "@/components/water-quality-overview"
import { BranchStatusChart } from "@/components/branch-status-chart"
import { useAuth } from "@/context/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const {
    empresasSucursales = [],
    instalaciones = [],
    especies = [],
    procesos = [],
    alerts = [],
    users = [],
    isLoading: isAppLoading = false,
  } = useAppContext() || {}

  // Esperar a que el contexto de autenticación termine de cargar
  if (isLoading) {
    return null
  }

  // Si no hay usuario autenticado, no renderizar nada (deja que el layout muestre el login)
  if (!isAuthenticated || !user) {
    return null
  }

  // Calcular estadísticas
  const stats = {
    totalEmpresas: empresasSucursales.filter((e) => e.tipo === "empresa").length,
    totalSucursales: empresasSucursales.filter((e) => e.tipo === "sucursal").length,
    totalInstalaciones: instalaciones.length,
    instalacionesActivas: instalaciones.filter((i) => i.estado_operativo === "activo").length,
    totalEspecies: especies.length,
    procesosActivos: procesos.filter((p) => p.estado_proceso === "activo").length,
    alertasActivas: Array.isArray(alerts) ? alerts.filter((a) => a.estado_alerta === "activa").length : 0,
    alertasCriticas: Array.isArray(alerts)
      ? alerts.filter((a) => a.estado_alerta === "activa" && a.tipo_alerta === "critica").length
      : 0,
    totalUsuarios: users.length,
    usuariosActivos: users.filter((u) => u.status === "active").length,
  }

  if (isAppLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/map")}>
            <MapPin className="mr-2 h-4 w-4" />
            Ver Mapa
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmpresas}</div>
            <p className="text-xs text-muted-foreground">{stats.totalSucursales} sucursales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instalaciones</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInstalaciones}</div>
            <p className="text-xs text-muted-foreground">{stats.instalacionesActivas} activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesos Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.procesosActivos}</div>
            <p className="text-xs text-muted-foreground">{stats.totalEspecies} especies monitoreadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.alertasActivas}
              {stats.alertasCriticas > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.alertasCriticas} críticas
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Alertas activas</p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas secundarias */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
            <p className="text-xs text-muted-foreground">{stats.usuariosActivos} activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperatura Promedio</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">27.5°C</div>
            <p className="text-xs text-muted-foreground">Rango óptimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">pH Promedio</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.2</div>
            <p className="text-xs text-muted-foreground">Dentro del rango</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oxígeno Disuelto</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6.8 mg/L</div>
            <p className="text-xs text-muted-foreground">Nivel óptimo</p>
          </CardContent>
        </Card>
      </div>

      {/* Sección principal con gráficos y alertas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Instalaciones</CardTitle>
              <CardDescription>Distribución del estado operativo de las instalaciones</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <BranchStatusChart />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recientes</CardTitle>
              <CardDescription>Últimas alertas del sistema de monitoreo</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RecentAlerts />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calidad del agua */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Calidad del Agua</CardTitle>
            <CardDescription>Parámetros principales de todas las instalaciones activas</CardDescription>
          </CardHeader>
          <CardContent>
            <WaterQualityOverview />
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/monitoreo")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monitoreo en Tiempo Real</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Ver lecturas actuales de todos los sensores</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/analytics")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Análisis y Reportes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Generar reportes y análisis históricos</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/procesos")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Gestión de Procesos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Administrar procesos de cultivo activos</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/notifications")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Centro de Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Gestionar todas las alertas del sistema</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
