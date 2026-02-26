"use client"

import { useState, useEffect, useCallback } from "react"
import type { Especie } from "@/types/especie"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export function useEspecies() {
  const [especies, setEspecies] = useState<Especie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchEspecies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      let data: any[] = []
      try {
        data = await api.get<any[]>("/catalogo-especies")
      } catch {
        data = await api.get<any[]>("/especies")
      }

      const normalized = (Array.isArray(data) ? data : []).map((item) => ({
        ...item,
        nombre: item.nombre ?? item.nombre_comun ?? `Especie ${item.id_especie}`,
      })) as Especie[]

      setEspecies(normalized)
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
