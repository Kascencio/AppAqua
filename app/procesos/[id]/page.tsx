"use client"

import { useParams, useRouter } from "next/navigation"
import { useProcesses } from "@/hooks/use-processes"
import { ProcessMonitoringDashboard } from "@/components/process-monitoring-dashboard"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, AlertTriangle } from "lucide-react"

export default function ProcessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const processId = Number.parseInt(params.id as string)

  const { processes, loading, error } = useProcesses()
  const process = processes.find((p) => p.id_proceso === processId)

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Error al cargar el proceso: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!process) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No se encontró el proceso con ID: {processId}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/procesos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Procesos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push("/procesos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {process.nombre_proceso || `Proceso ${process.id_proceso}`}
          </h1>
          <p className="text-muted-foreground">Monitoreo detallado del proceso de cultivo</p>
        </div>
      </div>

      {/* Dashboard de monitoreo */}
      <ProcessMonitoringDashboard proceso={process} />
    </div>
  )
}
