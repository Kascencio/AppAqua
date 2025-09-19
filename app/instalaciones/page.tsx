"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Calendar, Building, Trash2, Edit, Plus } from "lucide-react"
import { AddInstalacionDialog } from "@/components/add-instalacion-dialog"
import { useInstalaciones } from "@/hooks/use-instalaciones"
import { useToast } from "@/hooks/use-toast"
import type { Instalacion } from "@/types/instalacion"

// TODO: Esta página ya está alineada a las interfaces oficiales. Cambiar a fetch real al pasar a producción.

export default function InstalacionesPage() {
  const { instalaciones, loading, error, deleteInstalacion, addInstalacion } = useInstalaciones()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredInstalaciones, setFilteredInstalaciones] = useState<Instalacion[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  // Filtrar instalaciones basado en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInstalaciones(instalaciones)
    } else {
      const filtered = instalaciones.filter(
        (instalacion) =>
          instalacion.nombre_instalacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instalacion.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instalacion.tipo_uso.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instalacion.nombre_empresa?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredInstalaciones(filtered)
    }
  }, [instalaciones, searchTerm])

  const handleAddInstalacion = async (instalacionData: Omit<Instalacion, "id_instalacion">) => {
    try {
      await addInstalacion(instalacionData)
      setIsAddDialogOpen(false)
      toast({
        title: "Éxito",
        description: "Instalación creada correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear instalación",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteInstalacion = async (id: number, nombre: string) => {
    if (window.confirm(`¿Está seguro de eliminar la instalación "${nombre}"?`)) {
      try {
        await deleteInstalacion(id)
        toast({
          title: "Éxito",
          description: "Instalación eliminada correctamente",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al eliminar instalación",
          variant: "destructive",
        })
      }
    }
  }

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "activo":
        return "default"
      case "inactivo":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getTipoUsoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "acuicultura":
        return "default"
      case "tratamiento":
        return "secondary"
      case "otros":
        return "outline"
      default:
        return "outline"
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error al cargar instalaciones: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Instalaciones</h1>
            <p className="text-muted-foreground">Gestiona las instalaciones acuícolas del sistema</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Instalación
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar instalaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Instalaciones</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : instalaciones.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  instalaciones.filter((i) => i.estado_operativo === "activo").length
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
              <div className="h-2 w-2 bg-red-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  instalaciones.filter((i) => i.estado_operativo === "inactivo").length
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acuicultura</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  instalaciones.filter((i) => i.tipo_uso === "acuicultura").length
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instalaciones Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredInstalaciones.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Building className="mx-auto h-12 w-12 mb-4" />
                <p>
                  {searchTerm
                    ? "No se encontraron instalaciones que coincidan con la búsqueda"
                    : "No hay instalaciones registradas"}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primera instalación
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstalaciones.map((instalacion) => (
              <Card key={instalacion.id_instalacion} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{instalacion.nombre_instalacion}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">ID: {instalacion.id_instalacion}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteInstalacion(instalacion.id_instalacion, instalacion.nombre_instalacion)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getEstadoBadgeVariant(instalacion.estado_operativo)}>
                      {instalacion.estado_operativo}
                    </Badge>
                    <Badge variant={getTipoUsoBadgeVariant(instalacion.tipo_uso)}>{instalacion.tipo_uso}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{instalacion.descripcion}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Instalada:</span>
                        <span>{new Date(instalacion.fecha_instalacion).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Empresa:</span>
                        <span>{instalacion.nombre_empresa || `ID ${instalacion.id_empresa_sucursal}`}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Proceso:</span>
                        <span>{instalacion.nombre_proceso || `ID ${instalacion.id_proceso}`}</span>
                      </div>

                      {instalacion.nombre_especie && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Especie:</span>
                          <span>{instalacion.nombre_especie}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddInstalacionDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddInstalacion={handleAddInstalacion}
        />
      </div>
    </div>
  )
}
