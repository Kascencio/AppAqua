import type React from "react"
import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SensorCardProps {
  title: string
  value: string
  unit?: string
  icon?: React.ReactNode
  footer?: React.ReactNode
  status?: "normal" | "warning" | "critical" | "offline"
  isRealtime?: boolean
  lastUpdated?: Date
}

const SensorCard: React.FC<SensorCardProps> = memo(
  ({ title, value, unit, icon, footer, status = "normal", isRealtime = false, lastUpdated }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "normal":
          return "bg-green-500"
        case "warning":
          return "bg-yellow-500"
        case "critical":
          return "bg-red-500"
        case "offline":
          return "bg-gray-500"
        default:
          return "bg-gray-500"
      }
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case "normal":
          return "Normal"
        case "warning":
          return "Advertencia"
        case "critical":
          return "Crítico"
        case "offline":
          return "Desconectado"
        default:
          return "Desconocido"
      }
    }

    return (
      <Card
        className={cn(
          "transition-all duration-300 hover:shadow-md",
          status === "critical" && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
          status === "warning" && "border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20",
          status === "offline" && "border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-sm font-medium">
              {icon && <div className="text-gray-500">{icon}</div>}
              <span>{title}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {isRealtime && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">En vivo</span>
                </div>
              )}
              <Badge variant="secondary" className={cn("text-white text-xs", getStatusColor(status))}>
                {getStatusText(status)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
              {unit && <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
            </div>

            {lastUpdated && (
              <div className="text-xs text-muted-foreground">Actualizado: {lastUpdated.toLocaleTimeString()}</div>
            )}
          </div>

          {footer && <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">{footer}</div>}
        </CardContent>
      </Card>
    )
  },
)

SensorCard.displayName = "SensorCard"

export default SensorCard
