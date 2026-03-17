"use client"

import { useState, useEffect, useCallback } from "react"
import type { Proceso, ProcesoConCalculos } from "@/types/proceso"
import { calcularEstadoProceso, calcularProgresoProceso, calcularDiasProceso } from "@/types/proceso"
import { useToast } from "@/hooks/use-toast"
import { backendApi, type Proceso as BackendProceso } from "@/lib/backend-client"

function toUiStatus(status?: string): ProcesoConCalculos["estado"] {
  switch (status) {
    case "completado":
      return "completado"
    case "pausado":
    case "cancelado":
      return "pausado"
    default:
      return "activo"
  }
}

function toBackendStatus(status?: string): "planificado" | "en_progreso" | "pausado" | "completado" | "cancelado" {
  switch (status) {
    case "completado":
      return "completado"
    case "pausado":
      return "pausado"
    case "cancelado":
      return "cancelado"
    default:
      return "en_progreso"
  }
}

export function useProcesses() {
  const [processes, setProcesses] = useState<ProcesoConCalculos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchProcesses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await backendApi.getProcesos({ page: 1, limit: 1000 })
      const payload: any = response
      const rows: BackendProceso[] = Array.isArray(payload) ? payload : (payload?.data || [])

      const procesosConCalculos: ProcesoConCalculos[] = rows.map((row) => {
        const fechaInicio = row.fecha_inicio
        const fechaFinal = row.fecha_fin_esperada ?? row.fecha_fin_real ?? row.updated_at
        const estadoCalculado = calcularEstadoProceso(fechaInicio, fechaFinal)
        const estado = row.estado ? toUiStatus(row.estado) : estadoCalculado
        const progreso = typeof row.porcentaje_avance === "number"
          ? Math.max(0, Math.min(100, row.porcentaje_avance))
          : calcularProgresoProceso(fechaInicio, fechaFinal)
        const { diasOriginales, diasTotales } = calcularDiasProceso(fechaInicio, fechaFinal)

        return {
          id_proceso: row.id_proceso,
          id_especie: Number(row.id_especie ?? 0),
          id_instalacion: Number(row.id_instalacion ?? 0),
          nombre_proceso: row.nombre_proceso ?? row.nombre,
          fecha_inicio: fechaInicio,
          fecha_final: fechaFinal,
          codigo_proceso: `PROC-${row.id_proceso}`,
          descripcion: row.descripcion || row.nombre || `Proceso ${row.id_proceso}`,
          nombre_especie: (row as any).nombre_especie,
          nombre_instalacion: (row as any).nombre_instalacion,
          estado,
          progreso,
          dias_originales: diasOriginales,
          dias_totales: diasTotales,
          fecha_fin_real: row.fecha_fin_real,
          crecimiento_ostion: row.crecimiento_ostion ?? null,
        }
      })

      setProcesses(procesosConCalculos)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar procesos"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProcesses()
  }, [fetchProcesses])

  const createProcess = useCallback(async (procesoData: Omit<Proceso, "id_proceso">) => {
    try {
      setLoading(true)

      const raw = procesoData as any
      const payload = {
        id_especie: Number(procesoData.id_especie),
        id_instalacion: Number(procesoData.id_instalacion),
        fecha_inicio: procesoData.fecha_inicio,
        fecha_final: procesoData.fecha_final,
        nombre_proceso: raw.nombre_proceso ?? raw.nombre,
        descripcion: raw.descripcion,
        objetivos: raw.objetivos,
        crecimiento_ostion: raw.crecimiento_ostion,
      }

      await backendApi.createProceso(payload as any)

      toast({
        title: "Éxito",
        description: "Proceso creado correctamente",
      })

      await fetchProcesses()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear proceso"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchProcesses, toast])

  const updateProcess = useCallback(async (id: number, procesoData: Partial<Proceso>) => {
    try {
      setLoading(true)

      const raw = procesoData as any
      const payload = {
        ...(procesoData.id_especie !== undefined ? { id_especie: Number(procesoData.id_especie) } : {}),
        ...(procesoData.id_instalacion !== undefined ? { id_instalacion: Number(procesoData.id_instalacion) } : {}),
        ...(procesoData.fecha_inicio !== undefined ? { fecha_inicio: procesoData.fecha_inicio } : {}),
        ...(procesoData.fecha_final !== undefined ? { fecha_final: procesoData.fecha_final } : {}),
        ...(raw.nombre_proceso !== undefined ? { nombre_proceso: raw.nombre_proceso } : {}),
        ...(raw.descripcion !== undefined ? { descripcion: raw.descripcion } : {}),
        ...(raw.objetivos !== undefined ? { objetivos: raw.objetivos } : {}),
        ...(procesoData.estado !== undefined ? { estado: toBackendStatus(procesoData.estado) } : {}),
        ...(raw.crecimiento_ostion !== undefined ? { crecimiento_ostion: raw.crecimiento_ostion } : {}),
      }

      await backendApi.updateProceso(id, payload as any)

      toast({
        title: "Éxito",
        description: "Proceso actualizado correctamente",
      })

      await fetchProcesses()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar proceso"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchProcesses, toast])

  const deleteProcess = useCallback(async (id: number) => {
    try {
      setLoading(true)
      await backendApi.deleteProceso(id)

      toast({
        title: "Éxito",
        description: "Proceso eliminado correctamente",
      })

      await fetchProcesses()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar proceso"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchProcesses, toast])

  const updateProcessStatus = useCallback(async (id: number, status: string) => {
    try {
      setLoading(true)
      await backendApi.updateProceso(id, {
        estado: toBackendStatus(status),
      } as any)

      toast({
        title: "Éxito",
        description: "Estado del proceso actualizado correctamente",
      })

      await fetchProcesses()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar proceso"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchProcesses, toast])

  const extendProcess = useCallback(async (id: number, newEndDate: string, motivo: string) => {
    try {
      setLoading(true)
      await backendApi.updateProceso(id, {
        fecha_final: newEndDate,
        motivo_cierre: motivo,
        estado: "en_progreso",
      } as any)

      toast({
        title: "Éxito",
        description: "Proceso extendido correctamente",
      })

      await fetchProcesses()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al extender proceso"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchProcesses, toast])

  return {
    processes,
    loading,
    error,
    refetch: fetchProcesses,
    refresh: fetchProcesses,
    createProcess,
    updateProcess,
    deleteProcess,
    updateProcessStatus,
    extendProcess,
  }
}
