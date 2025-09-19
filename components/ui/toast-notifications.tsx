"use client"

import * as React from "react"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { CheckCircle, AlertCircle, XCircle, Info, Wifi, WifiOff } from "lucide-react"

// Tipos de notificaciones personalizadas
export const notifications = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="h-4 w-4" />,
      duration: 4000,
    })
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: <XCircle className="h-4 w-4" />,
      duration: 6000,
    })
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: <AlertCircle className="h-4 w-4" />,
      duration: 5000,
    })
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <Info className="h-4 w-4" />,
      duration: 4000,
    })
  },

  // Notificaciones específicas para AquaMonitor
  sensorAlert: (sensorName: string, parameter: string, value: number, unit: string) => {
    toast.error("Alerta de Sensor", {
      description: `${sensorName}: ${parameter} fuera de rango (${value}${unit})`,
      icon: <AlertCircle className="h-4 w-4" />,
      duration: 8000,
      action: {
        label: "Ver detalles",
        onClick: () => {
          // Navegar a la página del sensor
          window.location.href = `/sensors/${sensorName}`
        },
      },
    })
  },

  connectionStatus: (isConnected: boolean, sensorName?: string) => {
    if (isConnected) {
      toast.success("Conexión establecida", {
        description: sensorName ? `Sensor ${sensorName} conectado` : "Conexión en tiempo real activa",
        icon: <Wifi className="h-4 w-4" />,
        duration: 3000,
      })
    } else {
      toast.error("Conexión perdida", {
        description: sensorName ? `Sensor ${sensorName} desconectado` : "Conexión en tiempo real perdida",
        icon: <WifiOff className="h-4 w-4" />,
        duration: 5000,
      })
    }
  },

  dataExport: (format: string, recordCount: number) => {
    toast.success("Exportación completada", {
      description: `${recordCount} registros exportados en formato ${format.toUpperCase()}`,
      icon: <CheckCircle className="h-4 w-4" />,
      duration: 4000,
    })
  },

  processUpdate: (processName: string, status: string) => {
    toast.info("Proceso actualizado", {
      description: `${processName} cambió a estado: ${status}`,
      icon: <Info className="h-4 w-4" />,
      duration: 4000,
    })
  },

  // Notificación persistente para alertas críticas
  criticalAlert: (message: string, description: string, onAction?: () => void) => {
    toast.error(message, {
      description,
      icon: <XCircle className="h-4 w-4" />,
      duration: Number.POSITIVE_INFINITY, // No se cierra automáticamente
      action: onAction
        ? {
            label: "Atender",
            onClick: onAction,
          }
        : undefined,
    })
  },
}

// Hook para notificaciones del sistema
export function useSystemNotifications() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      notifications.connectionStatus(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      notifications.connectionStatus(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return {
    isOnline,
    notifications,
  }
}

// Componente de Toaster personalizado
export function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        },
        className:
          "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
      }}
    />
  )
}
