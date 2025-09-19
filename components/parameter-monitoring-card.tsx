"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ParametroMonitoreo } from "@/types/lectura"
import { Thermometer, Droplets, Zap, Eye, Download, RefreshCw } from "lucide-react"

interface ParameterMonitoringCardProps {
  parametro: ParametroMonitoreo
}

const getParameterIcon = (nombre: string) => {
  switch (nombre.toLowerCase()) {
    case "temperatura":
      return <Thermometer className="h-4 w-4" />
    case "ph":
      return <Droplets className="h-4 w-4" />
    case "oxígeno disuelto":
    case "oxigeno":
      return <Droplets className="h-4 w-4" />
    case "turbidez":
      return <Eye className="h-4 w-4" />
    case "conductividad":
      return <Zap className="h-4 w-4" />
    default:
      return <Droplets className="h-4 w-4" />
  }
}

const getStatusColor = (estado: string) => {
  switch (estado) {
    case "normal":
      return "bg-green-100 text-green-800 border-green-200"
    case "advertencia":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "critico":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getChartColor = (estado: string) => {
  switch (estado) {
    case "normal":
      return "#22c55e"
    case "advertencia":
      return "#f59e0b"
    case "critico":
      return "#ef4444"
    default:
      return "#6b7280"
  }
}

export function ParameterMonitoringCard({ parametro }: ParameterMonitoringCardProps) {
  const [isRealTime, setIsRealTime] = useState(false)
  const [lecturas, setLecturas] = useState(parametro.lecturas)
  const [loading, setLoading] = useState(false)

  // Refetch de datos reales cada 30s en modo tiempo real
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    if (isRealTime) {
      const fetchLecturas = async () => {
        setLoading(true)
        try {
          const res = await fetch(`/api/lecturas?parametro=${parametro.id_parametro}&instalacion=${parametro.id_instalacion}`)
          if (!res.ok) throw new Error("Error al obtener lecturas")
          const data = await res.json()
          setLecturas(data.lecturas || [])
        } catch {
          // Mantener lecturas previas si hay error
        } finally {
          setLoading(false)
        }
      }
      fetchLecturas()
      interval = setInterval(fetchLecturas, 30000)
    } else {
      setLecturas(parametro.lecturas)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRealTime, parametro])

  // Preparar datos para la gráfica
  const chartData = useMemo(() => {
    return lecturas.map((lectura) => ({
      time: new Date(lectura.timestamp).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      valor: lectura.valor,
      timestamp: lectura.timestamp,
      estado: lectura.estado || "normal",
    }))
  }, [lecturas])

  const downloadCSV = () => {
    if (chartData.length === 0) return
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += `Tiempo,${parametro.nombre} (${parametro.unidad})\n`
    for (let i = 0; i < chartData.length; i++) {
      csvContent += `${chartData[i].time},${chartData[i].valor}\n`
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${parametro.nombre.toLowerCase().replace(/\s+/g, "_")}_data.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleRealTime = () => {
    setIsRealTime(!isRealTime)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getParameterIcon(parametro.nombre)}
            <span className="font-medium text-sm">{parametro.nombre}</span>
            <span className="text-xs text-muted-foreground">{parametro.unidad}</span>
          </div>
          <div className="flex items-center gap-2">
            {parametro.alertas_count > 0 && (
              <Badge variant="destructive" className="text-xs">
                {parametro.alertas_count}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRealTime}
              className={`text-xs ${isRealTime ? "bg-green-50 border-green-200 text-green-700" : ""}`}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRealTime ? "animate-spin" : ""}`} />
              {isRealTime ? "Tiempo Real" : "Histórico"}
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCSV}>
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {isRealTime
            ? `Tiempo real • Rango: ${parametro.rango_min} - ${parametro.rango_max}`
            : `Promedio: ${parametro.promedio.toFixed(1)} ${parametro.unidad} • Rango: ${parametro.rango_min} - ${parametro.rango_max}`}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-48 mb-3">
          {/* Aquí iría la gráfica, usando chartData */}
          {/* Puedes integrar Chart.js, Recharts, etc. */}
        </div>
        {/* Estado actual */}
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(parametro.estado)}`}
          >
            {parametro.estado === "normal" && "✓ Normal"}
            {parametro.estado === "advertencia" && "⚠️ Advertencia"}
            {parametro.estado === "critico" && "🚨 Crítico"}
          </div>
          {isRealTime && (
            <div className="text-xs text-muted-foreground">
              Actualizando cada 30s • {chartData.length} puntos
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
