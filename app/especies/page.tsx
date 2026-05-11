"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Fish, Activity, TrendingUp, ArrowRight, RefreshCw, GitBranch } from "lucide-react"
import { useSpecies } from "@/hooks/use-species"
import { useRolePermissions } from "@/hooks/use-role-permissions"
import { SpeciesTable } from "@/components/species-table"
import { AddSpeciesDialog } from "@/components/add-species-dialog"
import { useAppContext } from "@/context/app-context"

export default function EspeciesPage() {
  const router = useRouter()
  const { species, parameters, speciesParameters, loadSpecies, loading, deleteSpecies } = useSpecies()
  const appContext = useAppContext()
  const permissions = useRolePermissions()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const canManageSpecies = permissions.canCreateData
  const procesos = appContext?.procesos ?? []

  const stats = {
    totalSpecies: species.length,
    activeSpecies: species.filter((s) => s.estado === "activa").length,
    configuredSpecies: species.filter((s) => Array.isArray((s as any).parametros) && (s as any).parametros.length > 0).length,
    totalParameters: parameters.length,
    configuredParameters: speciesParameters.length,
  }

  const processCountBySpecies = useMemo(() => {
    const counts = new Map<number, number>()
    for (const process of procesos) {
      const idEspecie = Number((process as any).id_especie ?? 0)
      if (!Number.isFinite(idEspecie) || idEspecie <= 0) continue
      counts.set(idEspecie, (counts.get(idEspecie) ?? 0) + 1)
    }
    return counts
  }, [procesos])

  const topLinkedSpecies = useMemo(() => {
    return species
      .map((item) => ({
        ...item,
        processCount: processCountBySpecies.get(Number(item.id_especie)) ?? 0,
      }))
      .filter((item) => item.processCount > 0)
      .sort((a, b) => b.processCount - a.processCount)
      .slice(0, 5)
  }, [processCountBySpecies, species])

  const handleRefresh = async () => {
    await Promise.all([
      loadSpecies(),
      appContext?.refreshData?.({ silent: true, force: true }) ?? Promise.resolve(),
    ])
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-8 pt-6 md:px-8 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Especies</h1>
          <p className="text-muted-foreground">Gestiona especies, rangos óptimos y su conexión con procesos y analítica</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {canManageSpecies && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Especie
            </Button>
          )}
        </div>
      </div>

      <Card className="card-wave hover-lift">
        <CardContent className="py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conexión rápida entre pantallas</p>
              <p className="text-sm text-muted-foreground">
                Navega de catálogo de especies a procesos y analítica sin perder contexto.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push("/procesos")}>
                Procesos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => router.push("/analytics")}>
                Analítica
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift slide-in" style={{ animationDelay: "40ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Especies</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpecies}</div>
            <p className="text-xs text-muted-foreground">{stats.activeSpecies} activas</p>
          </CardContent>
        </Card>

        <Card className="hover-lift slide-in" style={{ animationDelay: "90ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Especies Activas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSpecies}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSpecies > 0
                ? `${Math.round((stats.activeSpecies / stats.totalSpecies) * 100)}% del total`
                : "0% del total"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift slide-in" style={{ animationDelay: "140ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parámetros Disponibles</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParameters}</div>
            <p className="text-xs text-muted-foreground">Para configurar especies</p>
          </CardContent>
        </Card>

        <Card className="hover-lift slide-in" style={{ animationDelay: "190ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rangos Configurados</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.configuredParameters}</div>
            <p className="text-xs text-muted-foreground">{stats.configuredSpecies} especies con parámetros</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Especies Con Mayor Actividad
          </CardTitle>
          <CardDescription>Top especies más vinculadas con procesos activos e históricos</CardDescription>
        </CardHeader>
        <CardContent>
          {topLinkedSpecies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay procesos vinculados a especies.</p>
          ) : (
            <div className="space-y-2">
              {topLinkedSpecies.map((item) => (
                <div
                  key={item.id_especie}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-medium">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">{item.nombre_cientifico || "Sin nombre científico"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.processCount} procesos</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/procesos?especie=${item.id_especie}&especieNombre=${encodeURIComponent(item.nombre)}`)
                      }
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg">
        <SpeciesTable
          species={species}
          parameters={parameters}
          speciesParameters={speciesParameters}
          loading={loading}
          onDelete={deleteSpecies}
          onRefresh={loadSpecies}
          canManage={canManageSpecies}
        />
      </div>

      {canManageSpecies && (
        <AddSpeciesDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={loadSpecies} />
      )}
    </div>
  )
}
