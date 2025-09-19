"use client"

import { useCallback, useEffect, useState } from "react"
import type { AlertStatus } from "@/types"
import { useToast } from "@/components/ui/use-toast"

export function useAlerts(status?: AlertStatus) {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar alertas
  const loadAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = status ? `/api/alertas?status=${status}` : "/api/alertas"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Error al cargar alertas")
      const data = await res.json()
      setAlerts(data)
    } catch (err) {
      setError("Error al cargar alertas")
      toast({
        title: "Error",
        description: "No se pudieron cargar las alertas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [status, toast])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  // Reconocer una alerta
  const acknowledgeAlert = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/alertas?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "acknowledged" }),
      })
      if (!res.ok) throw new Error("Error al reconocer alerta")
      toast({ title: "Alerta reconocida", description: "La alerta ha sido reconocida exitosamente" })
      await loadAlerts()
      return true
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Error al reconocer alerta",
      })
      return false
    }
  }, [toast, loadAlerts])

  // Resolver una alerta
  const resolveAlert = useCallback(async (id: string, notes?: string) => {
    try {
      const res = await fetch(`/api/alertas?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", notes }),
      })
      if (!res.ok) throw new Error("Error al resolver alerta")
      toast({ title: "Alerta resuelta", description: "La alerta ha sido resuelta exitosamente" })
      await loadAlerts()
      return true
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Error al resolver alerta",
      })
      return false
    }
  }, [toast, loadAlerts])

  return {
    alerts,
    loading,
    error,
    loadAlerts,
    acknowledgeAlert,
    resolveAlert,
  }
}
