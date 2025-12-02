"use client"

import { useState } from "react"
import { useProcesses } from "@/hooks/use-processes"
import { ProcessCard } from "@/components/process-card"
import { ProcessForm } from "@/components/process-form"
import { ExtendProcessDialog } from "@/components/extend-process-dialog"
import { ProcessMonitoringDashboard } from "@/components/process-monitoring-dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, AlertTriangle, Fish } from "lucide-react"
import type { Proceso, ProcesoConCalculos } from "@/types/proceso"
import { GenerateProcessesButton } from "@/components/generate-processes-button"

export default function ProcesosPage() {
  const { processes, loading, error, createProcess, deleteProcess, updateProcessStatus, extendProcess, refresh } =
    useProcesses()

  const [showForm, setShowForm] = useState(false)
  const [editingProcess, setEditingProcess] = useState<ProcesoConCalculos | null>(null)
  const [monitoringProcess, setMonitoringProcess] = useState<ProcesoConCalculos | null>(null)
  const [extendingProcess, setExtendingProcess] = useState<ProcesoConCalculos | null>(null)

  const handleCreateProcess = async (procesoData: Omit<Proceso, "id_proceso">) => {
    const success = await createProcess(procesoData)
    if (success) {
      setShowForm(false)
      refresh()
    }
    return success
  }

  const handleEditProcess = (process: ProcesoConCalculos) => {
    setEditingProcess(process)
    setShowForm(true)
  }

  const handleDeleteProcess = async (process: ProcesoConCalculos) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el proceso "${process.id_proceso}"?`)) {
      const success = await deleteProcess(process.id_proceso)
      if (success) {
        refresh()
      }
    }
  }

  const handleStatusChange = async (process: ProcesoConCalculos, newStatus: string) => {
    const success = await updateProcessStatus(process.id_proceso, newStatus || "activo")
    if (success) {
      refresh()
    }
  }

  const handleViewMonitoring = (process: ProcesoConCalculos) => {
    setMonitoringProcess(process)
  }

  const handleExtendProcess = (process: ProcesoConCalculos) => {
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
        <ProcessMonitoringDashboard proceso={monitoringProcess} />
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
          <GenerateProcessesButton onGenerate={refresh} />
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proceso
          </Button>
        </div>
      </div>

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
      ) : processes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {processes.map((process) => (
            <ProcessCard
              key={process.id_proceso}
              process={process}
              onView={handleViewMonitoring}
              onEdit={handleEditProcess}
              onDelete={handleDeleteProcess}
              onStatusChange={handleStatusChange}
              onExtend={handleExtendProcess}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Fish className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay procesos registrados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza creando tu primer proceso de cultivo acuícola
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Proceso
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog para formulario */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProcess ? "Editar Proceso" : "Nuevo Proceso"}</DialogTitle>
          </DialogHeader>
          <ProcessForm
            onSubmit={handleCreateProcess}
            onCancel={handleCloseForm}
            initialData={editingProcess || undefined}
          />
        </DialogContent>
      </Dialog>

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
