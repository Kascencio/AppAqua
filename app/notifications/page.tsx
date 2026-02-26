"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Droplets, Filter, Thermometer, Activity } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAppContext } from "@/context/app-context"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [processingIds, setProcessingIds] = useState<number[]>([])
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const context = useAppContext()
  const contextAlerts = context?.alerts ?? []
  const isLoading = context?.isLoading ?? false
  const refreshData = context?.refreshData

  const canDeleteAlerts = user?.role === "superadmin" || user?.role === "admin"

  useEffect(() => {
    const statusFilter = searchParams.get("status")
    if (statusFilter === "unread") {
      setFilter("unread")
    } else if (statusFilter === "read") {
      setFilter("read")
    } else {
      setFilter("all")
    }
  }, [searchParams])

  const localAlerts = useMemo(() => {
    const dedup = new Map<number, any>()

    for (const rawAlert of contextAlerts) {
      const id = Number((rawAlert as any)?.id_alertas ?? (rawAlert as any)?.id_alerta)
      if (!Number.isFinite(id) || id <= 0) continue

      const current = dedup.get(id)
      const read = typeof (rawAlert as any)?.read === "boolean"
        ? Boolean((rawAlert as any).read)
        : Boolean((rawAlert as any)?.leida)

      const next = {
        ...(current || {}),
        ...(rawAlert as any),
        id_alertas: id,
        id_alerta: id,
        read,
        leida: read,
      }
      dedup.set(id, next)
    }

    return Array.from(dedup.values()).sort((a, b) => Number(b.id_alertas) - Number(a.id_alertas))
  }, [contextAlerts])

  const filteredAlerts = useMemo(
    () =>
      localAlerts.filter((alert: any) => {
        if (filter === "all") return true
        if (filter === "unread") return !alert.read
        if (filter === "read") return alert.read
        return true
      }),
    [filter, localAlerts],
  )

  const unreadCount = useMemo(
    () => localAlerts.filter((alert: any) => !alert.read).length,
    [localAlerts],
  )

  const markIdAsProcessing = (id: number) => {
    setProcessingIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const unmarkIdAsProcessing = (id: number) => {
    setProcessingIds((prev) => prev.filter((item) => item !== id))
  }

  const refreshAlerts = async () => {
    await refreshData?.({ silent: true, force: true })
  }

  const markAsRead = async (id: number) => {
    if (processingIds.includes(id)) return

    markIdAsProcessing(id)
    try {
      await api.put(`/alertas/${id}/read`, { read: true })
      await refreshAlerts()

      toast({
        title: "Notificación marcada como leída",
        description: "La notificación se guardó como leída en la base de datos.",
        duration: 2500,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo marcar la notificación como leída.",
        variant: "destructive",
      })
    } finally {
      unmarkIdAsProcessing(id)
    }
  }

  const markAllAsRead = async () => {
    const ids = localAlerts
      .filter((alert: any) => !alert.read)
      .map((alert: any) => Number(alert.id_alertas))
      .filter((id: number) => Number.isFinite(id) && id > 0)

    if (ids.length === 0) return

    setIsBulkProcessing(true)
    try {
      await api.put("/alertas/read-all", { read: true, ids })
      await refreshAlerts()

      toast({
        title: "Notificaciones actualizadas",
        description: "Todas las notificaciones quedaron marcadas como leídas en la base de datos.",
        duration: 2500,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudieron marcar todas como leídas.",
        variant: "destructive",
      })
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const deleteNotification = async (id: number) => {
    if (!canDeleteAlerts) {
      toast({
        title: "Sin permisos",
        description: "Tu rol no tiene permiso para eliminar alertas.",
        variant: "destructive",
      })
      return
    }

    if (processingIds.includes(id)) return

    markIdAsProcessing(id)
    try {
      await api.delete(`/alertas/${id}`)
      await refreshAlerts()

      toast({
        title: "Notificación eliminada",
        description: "La alerta fue eliminada de forma persistente en la base de datos.",
        duration: 2500,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar la notificación.",
        variant: "destructive",
      })
    } finally {
      unmarkIdAsProcessing(id)
    }
  }

  const clearAllNotifications = async () => {
    if (!canDeleteAlerts) {
      toast({
        title: "Sin permisos",
        description: "Tu rol no tiene permiso para eliminar alertas.",
        variant: "destructive",
      })
      return
    }

    const ids = localAlerts
      .map((alert: any) => Number(alert.id_alertas))
      .filter((id: number) => Number.isFinite(id) && id > 0)

    if (ids.length === 0) return

    setIsBulkProcessing(true)
    try {
      await api.post("/alertas/delete-all", { ids })
      await refreshAlerts()

      toast({
        title: "Notificaciones eliminadas",
        description: "Todas las notificaciones fueron eliminadas de forma persistente.",
        duration: 2500,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudieron eliminar todas las notificaciones.",
        variant: "destructive",
      })
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const getParameterIcon = (parameter?: string) => {
    if (!parameter) return <Droplets className="h-4 w-4 text-gray-500" />
    switch (parameter.toLowerCase()) {
      case "ph":
        return <Droplets className="h-4 w-4 text-blue-500" />
      case "temperature":
      case "temperatura":
        return <Thermometer className="h-4 w-4 text-red-500" />
      case "oxygen":
      case "oxigeno":
      case "oxígeno":
        return <Activity className="h-4 w-4 text-green-500" />
      case "salinity":
      case "salinidad":
        return <Droplets className="h-4 w-4 text-cyan-500" />
      default:
        return <Droplets className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "hace un momento"
    const date = new Date(dateStr)
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " años"

    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " meses"

    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " días"

    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " horas"

    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " minutos"

    return Math.floor(seconds) + " segundos"
  }

  if (isLoading) {
    return (
      <div className="container py-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <PageHeader
        title="Notificaciones"
        description="Centro de alertas y notificaciones del sistema de monitoreo"
        icon={Bell}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1 bg-transparent">
                  <Filter className="h-4 w-4" />
                  Filtrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("all")}>Todas las notificaciones</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("unread")}>No leídas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("read")}>Leídas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => void markAllAsRead()} disabled={isBulkProcessing || unreadCount === 0}>
              Marcar todas como leídas
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void clearAllNotifications()}
              disabled={isBulkProcessing || localAlerts.length === 0 || !canDeleteAlerts}
            >
              Borrar todas
            </Button>
          </div>
        }
      >
        {unreadCount > 0 && (
          <Badge variant="destructive" className="mt-2">
            {unreadCount} sin leer
          </Badge>
        )}
      </PageHeader>

      <Tabs defaultValue={filter} value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="all" className="flex-1 sm:flex-initial">
            Todas
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex-1 sm:flex-initial">
            No leídas ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read" className="flex-1 sm:flex-initial">
            Leídas ({localAlerts.length - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Centro de Notificaciones</CardTitle>
              <CardDescription>Gestiona todas las alertas y notificaciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                  <Bell className="h-12 w-12 mb-2 text-muted-foreground/50" />
                  <p>No hay notificaciones {filter !== "all" ? "con este filtro" : ""}</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id_alertas}
                    className="flex items-start gap-3 pb-4 border-b last:border-0 p-3 rounded-lg transition duration-300 ease-in-out hover:bg-muted"
                  >
                    {getParameterIcon(alert.parameter)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title || "Alerta de Sistema"}</p>
                      <p className="text-sm text-muted-foreground">{alert.descripcion}</p>
                      <p className="text-xs text-muted-foreground">Recibida hace {formatTimeAgo(alert.fecha)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void markAsRead(alert.id_alertas)}
                          disabled={processingIds.includes(Number(alert.id_alertas)) || isBulkProcessing}
                        >
                          Marcar como leída
                        </Button>
                      )}
                      {canDeleteAlerts && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void deleteNotification(alert.id_alertas)}
                          disabled={processingIds.includes(Number(alert.id_alertas)) || isBulkProcessing}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones No Leídas</CardTitle>
              <CardDescription>Gestiona las alertas y notificaciones no leídas del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                  <Bell className="h-12 w-12 mb-2 text-muted-foreground/50" />
                  <p>No hay notificaciones no leídas {filter !== "unread" ? "con este filtro" : ""}</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id_alertas}
                    className="flex items-start gap-3 pb-4 border-b last:border-0 p-3 rounded-lg transition duration-300 ease-in-out hover:bg-muted"
                  >
                    {getParameterIcon(alert.parameter)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title || "Alerta de Sistema"}</p>
                      <p className="text-sm text-muted-foreground">{alert.descripcion}</p>
                      <p className="text-xs text-muted-foreground">Recibida hace {formatTimeAgo(alert.fecha)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void markAsRead(alert.id_alertas)}
                        disabled={processingIds.includes(Number(alert.id_alertas)) || isBulkProcessing}
                      >
                        Marcar como leída
                      </Button>
                      {canDeleteAlerts && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void deleteNotification(alert.id_alertas)}
                          disabled={processingIds.includes(Number(alert.id_alertas)) || isBulkProcessing}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="read" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones Leídas</CardTitle>
              <CardDescription>Gestiona las alertas y notificaciones leídas del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                  <Bell className="h-12 w-12 mb-2 text-muted-foreground/50" />
                  <p>No hay notificaciones leídas {filter !== "read" ? "con este filtro" : ""}</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id_alertas}
                    className="flex items-start gap-3 pb-4 border-b last:border-0 p-3 rounded-lg transition duration-300 ease-in-out hover:bg-muted"
                  >
                    {getParameterIcon(alert.parameter)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title || "Alerta de Sistema"}</p>
                      <p className="text-sm text-muted-foreground">{alert.descripcion}</p>
                      <p className="text-xs text-muted-foreground">Recibida hace {formatTimeAgo(alert.fecha)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canDeleteAlerts && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void deleteNotification(alert.id_alertas)}
                          disabled={processingIds.includes(Number(alert.id_alertas)) || isBulkProcessing}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
