"use client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react"

interface ConnectionErrorProps {
  message: string
  onRetry?: () => void
  type?: "connection" | "data" | "sensor"
  showRetry?: boolean
}

export function ConnectionError({ message, onRetry, type = "connection", showRetry = true }: ConnectionErrorProps) {
  const getIcon = () => {
    switch (type) {
      case "connection":
        return <WifiOff className="h-4 w-4" />
      case "sensor":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getTitle = () => {
    switch (type) {
      case "connection":
        return "Error de Conexión"
      case "sensor":
        return "Error de Sensor"
      case "data":
        return "Error de Datos"
      default:
        return "Error"
    }
  }

  return (
    <Alert variant="destructive" className="mb-4">
      {getIcon()}
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex items-center justify-between">
          <span>{message}</span>
          {showRetry && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
              <RefreshCw className="h-3 w-3 mr-1" />
              Reintentar
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
