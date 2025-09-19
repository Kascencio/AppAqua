"use client"

import { useState, useEffect, useCallback } from "react"
import type { EspecieDetallada } from "@/types/especie"
import { useToast } from "@/hooks/use-toast"

export function useEspecies() {
  const [especies, setEspecies] = useState<EspecieDetallada[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchEspecies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/especies")
      if (!response.ok) throw new Error("Error al cargar especies")
      const data = await response.json()
      setEspecies(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar especies"
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
    fetchEspecies()
  }, [fetchEspecies])

  return {
    especies,
    loading,
    error,
    refetch: fetchEspecies,
  }
}
