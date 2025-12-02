"use client"

import { useState, useEffect, useCallback } from "react"
import type { Proceso, ProcesoConCalculos } from "@/types/proceso"
import { calcularEstadoProceso, calcularProgresoProceso, calcularDiasProceso } from "@/types/proceso"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export function useProcesses() {
  const [processes, setProcesses] = useState<ProcesoConCalculos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchProcesses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<Proceso[]>("/procesos")

      // Calcular campos adicionales para cada proceso
      const procesosConCalculos: ProcesoConCalculos[] = data.map((proceso) => {
        const estado = calcularEstadoProceso(proceso.fecha_inicio, proceso.fecha_final)
        const progreso = calcularProgresoProceso(proceso.fecha_inicio, proceso.fecha_final)
        const { diasOriginales, diasTotales } = calcularDiasProceso(proceso.fecha_inicio, proceso.fecha_final)

        return {
          ...proceso,
          estado,
          progreso,
          dias_originales: diasOriginales,
          dias_totales: diasTotales,
          codigo_proceso: `PROC-${proceso.id_proceso}`,
          descripcion: `Proceso de cultivo ${proceso.id_proceso}`,
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
      await api.post("/procesos", procesoData)

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

  const deleteProcess = useCallback(async (id: number) => {
    try {
      setLoading(true)
      await api.delete(`/procesos/${id}`)

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
      await api.put(`/procesos/${id}`, { estado: status })

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
      await api.put(`/procesos/${id}`, {
        fecha_final: newEndDate,
        motivo_extension: motivo,
        estado: "extendido"
      })

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
    deleteProcess,
    updateProcessStatus,
    extendProcess,
  }
}
