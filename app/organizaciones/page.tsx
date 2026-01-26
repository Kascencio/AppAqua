"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Activity, TrendingUp, Users } from "lucide-react"
import { useOrganizaciones } from "@/hooks/use-organizaciones"
import { OrganizacionesTable } from "@/components/organizaciones-table"
import { AddOrganizacionDialog } from "@/components/add-organizacion-dialog"

export default function OrganizacionesPage() {
  const { organizaciones, loading, total, page, setPage, refresh } = useOrganizaciones({ auto: true, limit: 20 })
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Calcular estadísticas
  const stats = {
    total: total,
    activas: organizaciones.filter((o) => o.activo).length,
    inactivas: organizaciones.filter((o) => !o.activo).length,
    porcentajeActivas: total > 0 ? Math.round((organizaciones.filter((o) => o.activo).length / total) * 100) : 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizaciones</h1>
          <p className="text-muted-foreground">Gestiona las organizaciones del sistema</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Organización
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizaciones</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.activas} activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activas}</div>
            <p className="text-xs text-muted-foreground">{stats.porcentajeActivas}% del total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactivas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? `${Math.round((stats.inactivas / stats.total) * 100)}%` : "0%"} del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={stats.porcentajeActivas >= 80 ? "default" : "secondary"}>
                {stats.porcentajeActivas >= 80 ? "Óptimo" : "Normal"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Basado en actividad</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de organizaciones */}
      <OrganizacionesTable
        organizaciones={organizaciones}
        loading={loading}
        onRefresh={refresh}
        page={page}
        onPageChange={setPage}
      />

      {/* Dialog para agregar organización */}
      <AddOrganizacionDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={refresh} />
    </div>
  )
}
