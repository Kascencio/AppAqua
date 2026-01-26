"use client"

import { useState, useEffect } from "react"
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

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [localAlerts, setLocalAlerts] = useState<any[]>([])
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Usar el contexto global
  const context = useAppContext()
  const contextAlerts = context?.alerts ?? []
  const isLoading = context?.isLoading ?? false
  
  // Sync context alerts to local state
  useEffect(() => {
    setLocalAlerts(contextAlerts)
  }, [contextAlerts])

  // Aplicar filtro de URL si existe
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

  const markAsRead = (id: number) => {
    const updatedAlerts = localAlerts.map((alert: any) => (alert.id_alertas === id ? { ...alert, read: true } : alert))
    setLocalAlerts(updatedAlerts)

    toast({
      title: "Notificación marcada como leída",
      description: "La notificación ha sido marcada como leída correctamente.",
      duration: 3000,
    })
  }

  const markAllAsRead = () => {
    const updatedAlerts = localAlerts.map((alert: any) => ({ ...alert, read: true }))
    setLocalAlerts(updatedAlerts)
    
    toast({
      title: "Todas las notificaciones marcadas como leídas",
      description: "Todas las notificaciones han sido marcadas como leídas correctamente.",
      duration: 3000,
    })
  }

  const deleteNotification = (id: number) => {
    const updatedAlerts = localAlerts.filter((alert: any) => alert.id_alertas !== id)
    setLocalAlerts(updatedAlerts)
    
    toast({
      title: "Notificación eliminada",
      description: "La notificación ha sido eliminada correctamente.",
      duration: 3000,
    })
  }

  const clearAllNotifications = () => {
    setLocalAlerts([])
    
    toast({
      title: "Todas las notificaciones eliminadas",
      description: "Todas las notificaciones han sido eliminadas correctamente.",
      duration: 3000,
    })
  }

  const filteredAlerts = localAlerts.filter((alert: any) => {
    if (filter === "all") return true
    if (filter === "unread") return !alert.read
    if (filter === "read") return alert.read
    return true
  })

  const unreadCount = localAlerts.filter((alert: any) => !alert.read).length

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
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Marcar todas como leídas
            </Button>
            <Button variant="destructive" size="sm" onClick={clearAllNotifications}>
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
                    className={`flex items-start gap-3 pb-4 border-b last:border-0 p-3 rounded-lg transition duration-300 ease-in-out hover:bg-muted`}
                  >
                    {getParameterIcon(alert.parameter)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title || "Alerta de Sistema"}</p>
                      <p className="text-sm text-muted-foreground">{alert.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        Recibida hace {formatTimeAgo(alert.fecha)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.read && (
                        <Button variant="outline" size="sm" onClick={() => markAsRead(alert.id_alertas)}>
                          Marcar como leída
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => deleteNotification(alert.id_alertas)}>
                        Eliminar
                      </Button>
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
                    className={`flex items-start gap-3 pb-4 border-b last:border-0 p-3 rounded-lg transition duration-300 ease-in-out hover:bg-muted`}
                  >
                    {getParameterIcon(alert.parameter)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title || "Alerta de Sistema"}</p>
                      <p className="text-sm text-muted-foreground">{alert.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        Recibida hace {formatTimeAgo(alert.fecha)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => markAsRead(alert.id_alertas)}>
                        Marcar como leída
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteNotification(alert.id_alertas)}>
                        Eliminar
                      </Button>
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
                    className={`flex items-start gap-3 pb-4 border-b last:border-0 p-3 rounded-lg transition duration-300 ease-in-out hover:bg-muted`}
                  >
                    {getParameterIcon(alert.parameter)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title || "Alerta de Sistema"}</p>
                      <p className="text-sm text-muted-foreground">{alert.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        Recibida hace {formatTimeAgo(alert.fecha)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="destructive" size="sm" onClick={() => deleteNotification(alert.id_alertas)}>
                        Eliminar
                      </Button>
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
