"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useProcesses } from "@/hooks/use-processes"
import { useAppContext } from "@/context/app-context"
import { ProcessCard } from "@/components/process-card"
import { ProcessForm } from "@/components/process-form"
import { ExtendProcessDialog } from "@/components/extend-process-dialog"
import { ProcessMonitoringDashboard } from "@/components/process-monitoring-dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, AlertTriangle, Fish, X, Search, RefreshCw, PlayCircle, PauseCircle, CheckCircle2 } from "lucide-react"
import type { Proceso, ProcesoConCalculos, ProcesoDetallado } from "@/types/proceso"
import { GenerateProcessesButton } from "@/components/generate-processes-button"
import { useRolePermissions } from "@/hooks/use-role-permissions"
import { useAuth } from "@/context/auth-context"

export default function ProcesosPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const appContext = useAppContext()
  const { user } = useAuth()
  const { processes, loading, error, createProcess, updateProcess, deleteProcess, updateProcessStatus, extendProcess, refresh } =
    useProcesses()
  const instalaciones = appContext?.instalaciones ?? []
  const especies = appContext?.especies ?? []
  const permissions = useRolePermissions()
  const canManageProcesses = permissions.canCreateData || permissions.canEditData
  const isSimpleOperatorView = user?.role === "standard" || user?.role === "operator"

  const [showForm, setShowForm] = useState(false)
  const [editingProcess, setEditingProcess] = useState<ProcesoConCalculos | null>(null)
  const [monitoringProcess, setMonitoringProcess] = useState<ProcesoConCalculos | null>(null)
  const [extendingProcess, setExtendingProcess] = useState<ProcesoConCalculos | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "activo" | "pausado" | "completado">("all")
  const [installationFilter, setInstallationFilter] = useState<string>("all")

  const especieFilterId = Number(searchParams.get("especie"))
  const especieFilterName = searchParams.get("especieNombre")
  const isSpeciesFilterActive = Number.isFinite(especieFilterId) && especieFilterId > 0

  const speciesScopedProcesses = useMemo(() => {
    if (!isSpeciesFilterActive) return processes
    return processes.filter((process) => Number(process.id_especie) === especieFilterId)
  }, [isSpeciesFilterActive, especieFilterId, processes])

  const installationNameById = useMemo(
    () =>
      new Map<number, string>(
        instalaciones.map((instalacion: any) => [
          Number(instalacion.id_instalacion),
          String(instalacion.nombre_instalacion ?? `Instalación ${instalacion.id_instalacion}`),
        ]),
      ),
    [instalaciones],
  )

  const speciesNameById = useMemo(
    () => new Map<number, string>(especies.map((item: any) => [Number(item.id_especie), String(item.nombre || "")])),
    [especies],
  )

  const enrichedProcesses = useMemo(
    () =>
      speciesScopedProcesses.map((process) => ({
        ...process,
        nombre_instalacion:
          process.nombre_instalacion ||
          installationNameById.get(Number(process.id_instalacion)) ||
          `Instalación ${process.id_instalacion}`,
        nombre_especie:
          process.nombre_especie || speciesNameById.get(Number(process.id_especie)) || `Especie ${process.id_especie}`,
      })),
    [installationNameById, speciesNameById, speciesScopedProcesses],
  )

  const installationOptions = useMemo(() => {
    const map = new Map<number, string>()
    for (const process of enrichedProcesses) {
      const idInst = Number(process.id_instalacion || 0)
      if (!idInst) continue
      if (!map.has(idInst)) {
        map.set(idInst, process.nombre_instalacion || `Instalación ${idInst}`)
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"))
  }, [enrichedProcesses])

  const filteredProcesses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return enrichedProcesses.filter((process) => {
      if (statusFilter !== "all" && process.estado !== statusFilter) return false
      if (installationFilter !== "all" && String(process.id_instalacion) !== installationFilter) return false
      if (!term) return true

      const text = [
        process.nombre_proceso,
        process.descripcion,
        process.nombre_especie,
        process.nombre_instalacion,
        process.codigo_proceso,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return text.includes(term) || String(process.id_proceso).includes(term)
    })
  }, [enrichedProcesses, searchTerm, statusFilter, installationFilter])

  const processStats = useMemo(() => {
    const total = enrichedProcesses.length
    const activos = enrichedProcesses.filter((process) => process.estado === "activo").length
    const pausados = enrichedProcesses.filter((process) => process.estado === "pausado").length
    const completados = enrichedProcesses.filter((process) => process.estado === "completado").length
    return { total, activos, pausados, completados }
  }, [enrichedProcesses])

  const handleCreateProcess = async (procesoData: Omit<Proceso, "id_proceso">) => {
    if (!canManageProcesses) return false

    const success = editingProcess
      ? await updateProcess(editingProcess.id_proceso, procesoData)
      : await createProcess(procesoData)

    if (success) {
      setShowForm(false)
      setEditingProcess(null)
      refresh()
    }
    return success
  }

  const handleEditProcess = (process: ProcesoConCalculos) => {
    if (!canManageProcesses) return
    setEditingProcess(process)
    setShowForm(true)
  }

  const handleDeleteProcess = async (process: ProcesoConCalculos) => {
    if (!canManageProcesses) return

    if (confirm(`¿Estás seguro de que deseas eliminar el proceso "${process.id_proceso}"?`)) {
      const success = await deleteProcess(process.id_proceso)
      if (success) {
        refresh()
      }
    }
  }

  const handleStatusChange = async (process: ProcesoConCalculos, newStatus: string) => {
    if (!canManageProcesses) return

    const success = await updateProcessStatus(process.id_proceso, newStatus || "activo")
    if (success) {
      refresh()
    }
  }

  const handleViewMonitoring = (process: ProcesoConCalculos) => {
    setMonitoringProcess(process)
  }

  const toProcesoDetallado = (process: ProcesoConCalculos): ProcesoDetallado => {
    return {
      ...process,
      codigo_proceso: process.codigo_proceso || `PROC-${process.id_proceso}`,
      estado: process.estado || "activo",
      progreso: process.progreso ?? 0,
      descripcion: process.descripcion || "",
      dias_originales: process.dias_originales ?? 0,
      dias_totales: process.dias_totales ?? 0,
    }
  }

  const handleExtendProcess = (process: ProcesoConCalculos) => {
    if (!canManageProcesses) return
    setExtendingProcess(process)
  }

  const handleConfirmExtension = async (extension: { dias_adicionales: number; motivo_extension: string }) => {
    if (!extendingProcess) return false

    const newEndDate = new Date(extendingProcess.fecha_final)
    newEndDate.setDate(newEndDate.getDate() + extension.dias_adicionales)

    const success = await extendProcess(
      extendingProcess.id_proceso,
      newEndDate.toISOString().split("T")[0],
      extension.motivo_extension,
    )
    if (success) {
      setExtendingProcess(null)
      refresh()
    }
    return success
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProcess(null)
  }

  const handleCloseMonitoring = () => {
    setMonitoringProcess(null)
  }

  const processFormInitialData = editingProcess || (isSpeciesFilterActive ? ({ id_especie: especieFilterId } as Partial<Proceso>) : undefined)

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Error al cargar procesos: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Vista de monitoreo
  if (monitoringProcess) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleCloseMonitoring}>
            ← Volver a Procesos
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Proceso {monitoringProcess.id_proceso}
            </h1>
            <p className="text-muted-foreground">Monitoreo en tiempo real</p>
          </div>
        </div>
        <ProcessMonitoringDashboard proceso={toProcesoDetallado(monitoringProcess)} />
      </div>
    )
  }

  if (isSimpleOperatorView) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Procesos</h1>
            <p className="text-muted-foreground">Consulta el estado de cada proceso y entra directo al seguimiento.</p>
          </div>
          <Button variant="outline" onClick={() => refresh()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-green-600" />
                Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{processStats.activos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PauseCircle className="h-4 w-4 text-amber-600" />
                Pausados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{processStats.pausados}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Completados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{processStats.completados}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, especie, instalación o ID"
                className="pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {filteredProcesses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay procesos que coincidan con la búsqueda actual.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProcesses.map((process) => (
              <Card key={process.id_proceso}>
                <CardContent className="p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold">
                        {process.nombre_proceso || `Proceso ${process.id_proceso}`}
                      </h2>
                      <span className="text-sm text-muted-foreground">#{process.id_proceso}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {process.nombre_especie || "Sin especie"} · {process.nombre_instalacion || "Sin instalación"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Del {process.fecha_inicio} al {process.fecha_final}
                    </p>
                    {process.crecimiento_ostion && (
                      <p className="text-sm text-cyan-700">
                        Crecimiento del Ostión: {process.crecimiento_ostion.capturas_requeridas} captura(s),{" "}
                        {process.crecimiento_ostion.lotes_por_captura} lote(s) por captura
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleViewMonitoring(process)}>Abrir seguimiento</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de Procesos</h1>
          <p className="text-muted-foreground">Administra y monitorea los procesos de cultivo acuícola</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refresh()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {canManageProcesses && (
            <>
              <GenerateProcessesButton onGenerate={refresh} />
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {isSpeciesFilterActive ? "Nuevo Proceso de Especie" : "Nuevo Proceso"}
              </Button>
            </>
          )}
        </div>
      </div>

      {isSpeciesFilterActive && (
        <Alert className="border-cyan-200 bg-cyan-50/60 dark:bg-cyan-950/20">
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Filtrando por especie: <strong>{especieFilterName || `ID ${especieFilterId}`}</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={() => router.push("/procesos")}>
              <X className="h-4 w-4 mr-1" />
              Quitar filtro
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{processStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{processStats.activos}</p>
            <PlayCircle className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pausados</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{processStats.pausados}</p>
            <PauseCircle className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{processStats.completados}</p>
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por proceso, especie, instalación o código..."
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="pausado">Pausados</SelectItem>
                  <SelectItem value="completado">Completados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={installationFilter} onValueChange={setInstallationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Instalación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Instalaciones</SelectItem>
                  {installationOptions.map(([id, name]) => (
                    <SelectItem key={id} value={String(id)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de procesos */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-16" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProcesses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProcesses.map((process) => (
            <ProcessCard
              key={process.id_proceso}
              proceso={process}
              onEdit={canManageProcesses ? handleEditProcess : undefined}
              onViewMonitoring={handleViewMonitoring}
              onStatusChange={canManageProcesses ? handleStatusChange : undefined}
              onDelete={
                canManageProcesses
                  ? (id) => {
                      const proc = filteredProcesses.find((p) => p.id_proceso === id)
                      if (proc) {
                        handleDeleteProcess(proc)
                      }
                    }
                  : undefined
              }
              onExtend={canManageProcesses ? handleExtendProcess : undefined}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Fish className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {isSpeciesFilterActive ? "No hay procesos para esta especie" : "No hay procesos registrados"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {isSpeciesFilterActive
                ? "Crea el primer proceso para esta especie desde aquí."
                : "Comienza creando tu primer proceso de cultivo acuícola"}
            </p>
            {canManageProcesses && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {isSpeciesFilterActive ? "Crear Proceso de Especie" : "Crear Primer Proceso"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog para formulario */}
      {canManageProcesses && (
        <Dialog open={showForm} onOpenChange={handleCloseForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProcess ? "Editar Proceso" : "Nuevo Proceso"}</DialogTitle>
            </DialogHeader>
            <ProcessForm
              onSubmit={handleCreateProcess}
              onCancel={handleCloseForm}
              initialData={processFormInitialData || undefined}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para extender proceso */}
      <ExtendProcessDialog
        proceso={extendingProcess}
        open={!!extendingProcess}
        onOpenChange={(open) => !open && setExtendingProcess(null)}
        onConfirm={handleConfirmExtension}
      />
    </div>
  )
}
