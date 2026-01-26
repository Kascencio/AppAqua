"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Fish, MapPin, Radio, RefreshCw, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const app = useAppContext()

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
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

  const connectedStats = app?.stats
    ? {
        totalEmpresas: app.stats.total_empresas,
        totalSucursales: app.stats.total_sucursales,
        totalInstalaciones: app.stats.total_instalaciones,
        instalacionesActivas: app.stats.instalaciones_activas,
        totalEspecies: app.stats.total_especies,
        procesosActivos: app.stats.procesos_activos,
        sensoresInstalados: app.stats.sensores_instalados,
      }
    : {
        totalEmpresas: empresasSucursales.filter((e) => e.tipo === "empresa").length,
        totalSucursales: empresasSucursales.filter((e) => e.tipo === "sucursal").length,
        totalInstalaciones: instalaciones.length,
        instalacionesActivas: instalaciones.filter((i) => i.estado_operativo === "activo").length,
        totalEspecies: especies.length,
        procesosActivos: procesos.filter((p) => p.estado_proceso === "activo").length,
        sensoresInstalados: app?.sensoresInstalados?.length ?? 0,
      }

  const loadingApp = app?.isLoading ?? false
  const error = app?.error
  const refreshData = app?.refreshData

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inicio</h2>
          <p className="text-sm text-muted-foreground">Solo se muestra lo que está conectado al backend.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refreshData?.()} disabled={!refreshData || loadingApp}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button onClick={() => router.push("/map")}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Mapa
          </Button>
          <Button variant="secondary" onClick={() => router.push("/sensors")}
          >
            <Radio className="mr-2 h-4 w-4" />
            Sensores
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No se pudo cargar información</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refreshData?.()} disabled={!refreshData || loadingApp}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedStats.totalEmpresas}</div>
            <p className="text-xs text-muted-foreground">{connectedStats.totalSucursales} sucursales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instalaciones</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedStats.totalInstalaciones}</div>
            <p className="text-xs text-muted-foreground">{connectedStats.instalacionesActivas} activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesos Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedStats.procesosActivos}</div>
            <p className="text-xs text-muted-foreground">{connectedStats.totalEspecies} especies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sensores Instalados</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedStats.sensoresInstalados}</div>
            <p className="text-xs text-muted-foreground">Lecturas y estado en /sensors</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/instalaciones")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Instalaciones</CardTitle>
            <CardDescription>Listado conectado al backend</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Ver y administrar instalaciones.</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/empresas")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Empresas / Sucursales</CardTitle>
            <CardDescription>Estructura organizacional</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Ver empresas y sucursales.</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/procesos")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Procesos</CardTitle>
            <CardDescription>Listado y seguimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Entrar al módulo de procesos.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
