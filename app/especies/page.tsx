"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Fish, Activity, TrendingUp } from "lucide-react"
import { useSpecies } from "@/hooks/use-species"
import { SpeciesTable } from "@/components/species-table"
import { AddSpeciesDialog } from "@/components/add-species-dialog"
import { useState } from "react"

export default function EspeciesPage() {
  const { species, parameters, speciesParameters, loadSpecies, loading } = useSpecies()
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Cargar datos al montar el componente
  useEffect(() => {
    loadSpecies()
  }, [loadSpecies])

  // Calcular estadísticas
  const stats = {
    totalSpecies: species.length,
    activeSpecies: species.filter((s) => s.estado === "activa").length,
    totalParameters: parameters.length,
    configuredParameters: speciesParameters.length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Especies</h1>
          <p className="text-muted-foreground">Gestiona las especies acuícolas y sus parámetros de calidad del agua</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Especie
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Especies</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpecies}</div>
            <p className="text-xs text-muted-foreground">{stats.activeSpecies} activas</p>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parámetros Disponibles</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParameters}</div>
            <p className="text-xs text-muted-foreground">Para configurar especies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuraciones</CardTitle>
            <Badge className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.configuredParameters}</div>
            <p className="text-xs text-muted-foreground">Parámetros configurados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de especies */}
      <SpeciesTable onRefresh={loadSpecies} />

      {/* Dialog para agregar especie */}
      <AddSpeciesDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={loadSpecies} />
    </div>
  )
}
