"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Clock, Droplets, Thermometer, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/app-context"

export function RecentAlerts() {
  const router = useRouter()
  const { alerts, isLoading } = useAppContext()

  // Verificar que alerts existe y es un array antes de filtrar
  const safeAlerts = Array.isArray(alerts) ? alerts : []

  // Filtrar solo alertas activas y ordenar por fecha (más recientes primero)
  const activeAlerts = safeAlerts
    .filter((alert) => alert.estado_alerta === "activa")
    .sort((a, b) => b.fecha_hora_alerta.getTime() - a.fecha_hora_alerta.getTime())
    .slice(0, 5) // Mostrar solo las 5 más recientes

  const getParameterIcon = (parametroId: number) => {
    switch (parametroId) {
      case 1: // Temperatura
        return <Thermometer className="h-4 w-4 text-red-500" />
      case 2: // pH
        return <Droplets className="h-4 w-4 text-blue-500" />
      case 3: // Oxígeno disuelto
        return <Activity className="h-4 w-4 text-green-500" />
      default:
        return <Droplets className="h-4 w-4 text-gray-500" />
    }
  }

  const getParameterName = (parametroId: number) => {
    switch (parametroId) {
      case 1:
        return "Temperatura"
      case 2:
        return "pH"
      case 3:
        return "Oxígeno Disuelto"
      default:
        return "Parámetro"
    }
  }

  const formatTimeAgo = (date: Date) => {
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
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activeAlerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mb-2 opacity-20" />
            <p>No hay alertas activas en este momento</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id_alerta}
              className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0 p-3 rounded-lg transition-colors bg-muted/30 hover:bg-muted/50"
            >
              <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-full shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-medium text-sm">{getParameterName(alert.id_parametro)} fuera de rango</h4>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(alert.fecha_hora_alerta)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{alert.mensaje_alerta}</p>
                <div className="flex items-center mt-2 text-sm">
                  {getParameterIcon(alert.id_parametro)}
                  <span className="ml-1 font-medium text-destructive">{alert.valor_medido.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (Rango: {alert.valor_minimo_esperado?.toFixed(1)} - {alert.valor_maximo_esperado?.toFixed(1)})
                  </span>
                </div>
                <div className="mt-1">
                  <Badge variant={alert.tipo_alerta === "critica" ? "destructive" : "secondary"} className="text-xs">
                    {alert.tipo_alerta === "critica" ? "Crítica" : "Advertencia"}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 bg-transparent"
            onClick={() => router.push("/notifications")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Ver todas las alertas
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
