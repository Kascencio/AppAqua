"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Calendar, Building, Trash2, Edit, Plus } from "lucide-react"
import { AddInstalacionDialog } from "@/components/add-instalacion-dialog"
import { EditInstalacionDialog } from "@/components/edit-instalacion-dialog"
import { AddOrganizacionDialog } from "@/components/add-organizacion-dialog"
import { useInstalaciones } from "@/hooks/use-instalaciones"
import { useOrganizaciones } from "@/hooks/use-organizaciones"
import { useRolePermissions } from "@/hooks/use-role-permissions"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import type { Instalacion as BackendInstalacion } from "@/lib/backend-client"
import type { Instalacion } from "@/types/instalacion"

// Extended type for UI compatibility
type InstalacionUI = BackendInstalacion & Partial<Instalacion>

// TODO: Esta página ya está alineada a las interfaces oficiales. Cambiar a fetch real al pasar a producción.

export default function InstalacionesPage() {
  const { instalaciones, loading, error, deleteInstalacion, createInstalacion, updateInstalacion } = useInstalaciones()
  const { refresh: refreshOrganizaciones } = useOrganizaciones({ auto: false })
  const { user } = useAuth()
  const permissions = useRolePermissions()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredInstalaciones, setFilteredInstalaciones] = useState<InstalacionUI[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddOrganizacionOpen, setIsAddOrganizacionOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedInstalacion, setSelectedInstalacion] = useState<Instalacion | null>(null)
  const { toast } = useToast()
  const canManageInstallaciones = permissions.canManageInstallations || permissions.canCreateData

  const normalizeOrganizacionSucursalId = (idEmpresaSucursal: number) => {
    const n = Number(idEmpresaSucursal)
    if (!Number.isFinite(n) || n <= 0) return null
    return n >= 10000 ? n - 10000 : n
  }

  // Filtrar instalaciones basado en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInstalaciones(instalaciones as InstalacionUI[])
    } else {
      const filtered = (instalaciones as InstalacionUI[]).filter(
        (instalacion) =>
          (instalacion.nombre_instalacion || instalacion.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (instalacion.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (instalacion.tipo_uso || instalacion.tipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (instalacion.nombre_empresa as string || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          ((instalacion as any).nombre_organizacion || '').toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredInstalaciones(filtered)
    }
  }, [instalaciones, searchTerm])

  const handleAddInstalacion = async (instalacionData: Omit<Instalacion, "id_instalacion">) => {
    try {
      const payload: Record<string, unknown> = {
        nombre_instalacion: instalacionData.nombre_instalacion,
        codigo_instalacion: instalacionData.codigo_instalacion,
        fecha_instalacion: instalacionData.fecha_instalacion,
        estado_operativo: instalacionData.estado_operativo,
        descripcion: instalacionData.descripcion,
        tipo_uso: instalacionData.tipo_uso,
        ubicacion: instalacionData.ubicacion,
        latitud: instalacionData.latitud,
        longitud: instalacionData.longitud,
        capacidad_maxima: instalacionData.capacidad_maxima,
        capacidad_actual: instalacionData.capacidad_actual,
        volumen_agua_m3: instalacionData.volumen_agua_m3,
        profundidad_m: instalacionData.profundidad_m,
        fecha_ultima_inspeccion: instalacionData.fecha_ultima_inspeccion,
        responsable_operativo: instalacionData.responsable_operativo,
        contacto_emergencia: instalacionData.contacto_emergencia,
        id_proceso: instalacionData.id_proceso,
      }

      const idOrganizacion = Number(instalacionData.id_organizacion ?? 0)
      if (Number.isFinite(idOrganizacion) && idOrganizacion > 0) {
        payload.id_organizacion = idOrganizacion
      }

      const rawSucursal = instalacionData.id_empresa_sucursal
      if (rawSucursal !== undefined && rawSucursal !== null && Number(rawSucursal) > 0) {
        const id_organizacion_sucursal = normalizeOrganizacionSucursalId(Number(rawSucursal))
        if (!id_organizacion_sucursal) {
          throw new Error("Sucursal inválida")
        }
        payload.id_organizacion_sucursal = id_organizacion_sucursal
      }

      if (!payload.id_organizacion_sucursal && !payload.id_organizacion) {
        throw new Error("Debes seleccionar una organización")
      }

      await createInstalacion(payload as any)
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

  const openEditDialog = (instalacion: InstalacionUI) => {
    const rawTipoUso = instalacion.tipo_uso ?? instalacion.tipo
    const normalizedTipoUso = rawTipoUso === "acuicultura" || rawTipoUso === "tratamiento" || rawTipoUso === "otros"
      ? rawTipoUso
      : "otros"
    const normalized: Instalacion = {
      id_instalacion: instalacion.id_instalacion,
      id_empresa_sucursal: Number(instalacion.id_empresa_sucursal ?? instalacion.id_sucursal ?? 0),
      id_organizacion: Number((instalacion as any).id_organizacion ?? 0) || undefined,
      nombre_instalacion: instalacion.nombre_instalacion ?? instalacion.nombre ?? "",
      codigo_instalacion: (instalacion as any).codigo_instalacion ?? (instalacion as any).codigo ?? "",
      fecha_instalacion: instalacion.fecha_instalacion ?? instalacion.created_at ?? new Date().toISOString().split("T")[0],
      estado_operativo: instalacion.estado_operativo ?? "activo",
      descripcion: instalacion.descripcion ?? "",
      tipo_uso: normalizedTipoUso,
      ubicacion: (instalacion as any).ubicacion,
      latitud: Number((instalacion as any).latitud) || undefined,
      longitud: Number((instalacion as any).longitud) || undefined,
      capacidad_maxima: Number((instalacion as any).capacidad_maxima) || undefined,
      capacidad_actual: Number((instalacion as any).capacidad_actual) || undefined,
      volumen_agua_m3: Number((instalacion as any).volumen_agua_m3) || undefined,
      profundidad_m: Number((instalacion as any).profundidad_m) || undefined,
      fecha_ultima_inspeccion: (instalacion as any).fecha_ultima_inspeccion,
      responsable_operativo: (instalacion as any).responsable_operativo,
      contacto_emergencia: (instalacion as any).contacto_emergencia,
      id_proceso: Number(instalacion.id_proceso ?? 1),
      nombre_empresa: instalacion.nombre_empresa,
      nombre_proceso: instalacion.nombre_proceso,
      nombre_especie: instalacion.nombre_especie,
      sucursal_nombre: (instalacion as any).sucursal_nombre,
    }
    setSelectedInstalacion(normalized)
    setIsEditDialogOpen(true)
  }

  const handleEditInstalacion = async (updated: Instalacion) => {
    try {
      const payload: Record<string, unknown> = {
        nombre_instalacion: updated.nombre_instalacion,
        codigo_instalacion: updated.codigo_instalacion,
        fecha_instalacion: updated.fecha_instalacion,
        estado_operativo: updated.estado_operativo,
        descripcion: updated.descripcion,
        tipo_uso: updated.tipo_uso,
        ubicacion: updated.ubicacion,
        latitud: updated.latitud,
        longitud: updated.longitud,
        capacidad_maxima: updated.capacidad_maxima,
        capacidad_actual: updated.capacidad_actual,
        volumen_agua_m3: updated.volumen_agua_m3,
        profundidad_m: updated.profundidad_m,
        fecha_ultima_inspeccion: updated.fecha_ultima_inspeccion,
        responsable_operativo: updated.responsable_operativo,
        contacto_emergencia: updated.contacto_emergencia,
        id_proceso: updated.id_proceso,
      }

      const idOrganizacion = Number(updated.id_organizacion ?? 0)
      if (Number.isFinite(idOrganizacion) && idOrganizacion > 0) {
        payload.id_organizacion = idOrganizacion
      }

      const rawSucursal = updated.id_empresa_sucursal
      if (rawSucursal !== undefined && rawSucursal !== null && Number(rawSucursal) > 0) {
        const id_organizacion_sucursal = normalizeOrganizacionSucursalId(Number(rawSucursal))
        if (!id_organizacion_sucursal) {
          throw new Error("Sucursal inválida")
        }
        payload.id_organizacion_sucursal = id_organizacion_sucursal
      }

      if (!payload.id_organizacion_sucursal && !payload.id_organizacion) {
        throw new Error("Debes seleccionar una organización")
      }

      await updateInstalacion(updated.id_instalacion, payload as any)

      toast({
        title: "Éxito",
        description: "Instalación actualizada correctamente",
      })
      setIsEditDialogOpen(false)
      setSelectedInstalacion(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar instalación",
        variant: "destructive",
      })
      throw error
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
          <div className="flex items-center gap-2">
            {canManageInstallaciones && user?.role === "superadmin" && (
              <Button variant="outline" onClick={() => setIsAddOrganizacionOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Organización
              </Button>
            )}
            {canManageInstallaciones && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Instalación
              </Button>
            )}
          </div>
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
                {!searchTerm && canManageInstallaciones && (
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
                      {canManageInstallaciones && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(instalacion)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteInstalacion(
                                instalacion.id_instalacion,
                                instalacion.nombre_instalacion ?? instalacion.nombre ?? "Instalación"
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getEstadoBadgeVariant(instalacion.estado_operativo ?? "activo")}>
                      {instalacion.estado_operativo ?? "activo"}
                    </Badge>
                    <Badge variant={getTipoUsoBadgeVariant(instalacion.tipo_uso ?? "otros")}>
                      {instalacion.tipo_uso ?? "otros"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{instalacion.descripcion}</p>
                      {!!(instalacion as any).codigo_instalacion && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Código:</span>
                          <span>{String((instalacion as any).codigo_instalacion)}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Instalada:</span>
                        <span>{new Date(instalacion.fecha_instalacion ?? instalacion.created_at ?? Date.now()).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Organización:</span>
                        <span>
                          {(instalacion as any).nombre_organizacion ||
                            (instalacion as InstalacionUI).nombre_empresa ||
                            `ID ${(instalacion as any).id_organizacion ?? "-"}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Sucursal:</span>
                        <span>
                          {(instalacion as InstalacionUI).sucursal_nombre ||
                            `ID ${instalacion.id_empresa_sucursal || instalacion.id_sucursal || "-"}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Proceso:</span>
                        <span>{(instalacion as InstalacionUI).nombre_proceso || `ID ${(instalacion as InstalacionUI).id_proceso || '-'}`}</span>
                      </div>

                      {!!(instalacion as any).ubicacion && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Ubicación:</span>
                          <span>{String((instalacion as any).ubicacion)}</span>
                        </div>
                      )}

                      {(((instalacion as any).capacidad_actual ?? null) !== null || ((instalacion as any).capacidad_maxima ?? null) !== null) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Capacidad:</span>
                          <span>
                            {String((instalacion as any).capacidad_actual ?? "-")} / {String((instalacion as any).capacidad_maxima ?? "-")}
                          </span>
                        </div>
                      )}

                      {((instalacion as any).porcentaje_ocupacion ?? null) !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Ocupación:</span>
                          <span>{String((instalacion as any).porcentaje_ocupacion)}%</span>
                        </div>
                      )}

                      {(((instalacion as any).volumen_agua_m3 ?? null) !== null || ((instalacion as any).profundidad_m ?? null) !== null) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Volumen/Prof.:</span>
                          <span>
                            {String((instalacion as any).volumen_agua_m3 ?? "-")} m³ / {String((instalacion as any).profundidad_m ?? "-")} m
                          </span>
                        </div>
                      )}

                      {!!(instalacion as any).fecha_ultima_inspeccion && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Última inspección:</span>
                          <span>{new Date((instalacion as any).fecha_ultima_inspeccion).toLocaleDateString()}</span>
                        </div>
                      )}

                      {(Number.isFinite(Number((instalacion as any).latitud)) && Number.isFinite(Number((instalacion as any).longitud))) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Coordenadas:</span>
                          <span>
                            {Number((instalacion as any).latitud).toFixed(5)}, {Number((instalacion as any).longitud).toFixed(5)}
                          </span>
                        </div>
                      )}

                      {!!(instalacion as any).responsable_operativo && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Responsable:</span>
                          <span>{String((instalacion as any).responsable_operativo)}</span>
                        </div>
                      )}

                      {!!(instalacion as any).contacto_emergencia && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Contacto emergencia:</span>
                          <span>{String((instalacion as any).contacto_emergencia)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Sensores:</span>
                        <span>{String((instalacion as any).total_sensores ?? 0)}</span>
                        {Array.isArray((instalacion as any).tipos_sensores) && (instalacion as any).tipos_sensores.length > 0 && (
                          <span className="text-muted-foreground truncate">
                            ({(instalacion as any).tipos_sensores.slice(0, 3).join(", ")}
                            {(instalacion as any).tipos_sensores.length > 3 ? "..." : ""})
                          </span>
                        )}
                      </div>

                      {(instalacion as InstalacionUI).nombre_especie && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Especie:</span>
                          <span>{(instalacion as InstalacionUI).nombre_especie}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {canManageInstallaciones && (
          <AddInstalacionDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddInstalacion={handleAddInstalacion} />
        )}

        {canManageInstallaciones && user?.role === "superadmin" && (
          <AddOrganizacionDialog
            open={isAddOrganizacionOpen}
            onOpenChange={setIsAddOrganizacionOpen}
            onSuccess={async () => {
              await refreshOrganizaciones()
              toast({
                title: "Éxito",
                description: "Organización creada y disponible para nuevas instalaciones",
              })
            }}
          />
        )}

        {canManageInstallaciones && (
          <EditInstalacionDialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open)
              if (!open) setSelectedInstalacion(null)
            }}
            instalacion={selectedInstalacion}
            onEditInstalacion={handleEditInstalacion}
          />
        )}
      </div>
    </div>
  )
}
