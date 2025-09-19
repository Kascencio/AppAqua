"use client"

import { useState, useEffect, useCallback } from "react"
import type { ProcesoDetallado } from "@/types/proceso"
import { useToast } from "@/hooks/use-toast"

export function useProcesses() {
  const [processes, setProcesses] = useState<ProcesoDetallado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchProcesses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/procesos")
      if (!response.ok) throw new Error("Error al cargar procesos")
      const data = await response.json()
      setProcesses(data)
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

  return {
    processes,
    loading,
    error,
    refetch: fetchProcesses,
  }
}
