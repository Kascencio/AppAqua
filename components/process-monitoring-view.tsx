"use client"

import { useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ProcessParameterChart } from "@/components/process-parameter-chart"
import { ProcessDateFilter } from "@/components/process-date-filter"
import { Fish, Building2, Calendar, MapPin, RefreshCw, AlertTriangle, Activity, TrendingUp, Hash } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"

interface ProcessMonitoringViewProps {
  process: any
  species?: any
  facility?: any
  lastUpdated?: Date
  onRefresh?: () => void
  isLoading?: boolean
}

export function ProcessMonitoringView({
  process,
  species,
  facility,
  lastUpdated,
  onRefresh,
  isLoading = false,
}: ProcessMonitoringViewProps) {
  // Calcular rango de fechas del proceso
  const processDateRange = useMemo(() => {
    if (!process) return null
    return {
      from: new Date(process.fechaInicio),
      to: new Date(process.fechaFin),
    }
  }, [process?.fechaInicio, process?.fechaFin, process])

  // Estado para el filtro de fechas
  const [selectedDateFilter, setSelectedDateFilter] = useState("full")
  const [displayDateRange, setDisplayDateRange] = useState(processDateRange)

  // Calcular estadísticas del proceso
  const processStats = useMemo(() => {
    if (!process) return null

    const fechaInicio = new Date(process.fechaInicio)
    const fechaFin = new Date(process.fechaFin)
    const duracionTotal = differenceInDays(fechaFin, fechaInicio)
    const diasTranscurridos = Math.min(differenceInDays(new Date(), fechaInicio), duracionTotal)
    const progreso = duracionTotal > 0 ? (diasTranscurridos / duracionTotal) * 100 : 0

    return {
      duracionTotal,
      diasTranscurridos: Math.max(0, diasTranscurridos),
      progreso: Math.min(Math.max(progreso, 0), 100),
      fechaInicio,
      fechaFin,
    }
  }, [process])

  const handleRefresh = useCallback(() => {
    onRefresh?.()
  }, [onRefresh])

  const handleDateFilterChange = useCallback((filter: string, dateRange: { from: Date; to: Date }) => {
    setSelectedDateFilter(filter)
    setDisplayDateRange(dateRange)
  }, [])

  if (!process) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Activity className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">No hay proceso seleccionado</h3>
              <p className="text-muted-foreground">
                Selecciona un proceso del historial para ver su monitoreo detallado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!processDateRange || !displayDateRange) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">Error en las fechas del proceso</h3>
              <p className="text-muted-foreground">No se pueden cargar las fechas del proceso</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 🟦 Encabezado del proceso */}
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">{process.nombre || `Proceso ${process.id}`}</CardTitle>
                <Badge
                  variant={
                    process.estado === "activo" ? "default" : process.estado === "completado" ? "secondary" : "outline"
                  }
                  className="capitalize"
                >
                  {process.estado}
                </Badge>
                {processStats && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(processStats.progreso)}% completado
                  </Badge>
                )}
              </div>
              {process.descripcion && <CardDescription className="text-base">{process.descripcion}</CardDescription>}
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar Datos
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información básica del proceso */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Especie */}
            {species && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <Fish className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">{species.nombre}</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Especie</p>
                </div>
              </div>
            )}

            {/* ID del proceso */}
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <Hash className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900 dark:text-purple-100">{process.id}</p>
                <p className="text-sm text-purple-700 dark:text-purple-300">ID del Proceso</p>
              </div>
            </div>

            {/* Instalación */}
            {facility && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">{facility.name}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {facility.branch || "Instalación"}
                  </p>
                </div>
              </div>
            )}

            {/* Fechas de inicio y fin */}
            {processStats && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    {format(processStats.fechaInicio, "dd/MM/yyyy", { locale: es })} -{" "}
                    {format(processStats.fechaFin, "dd/MM/yyyy", { locale: es })}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {processStats.duracionTotal} días de cultivo
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Objetivos y notas del proceso */}
          {(process.objetivos || process.notas) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {process.objetivos && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Objetivos del Proceso
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{process.objetivos}</p>
                </div>
              )}

              {process.notas && (
                <div className="p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Notas Adicionales</h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{process.notas}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* 📆 Filtro de rango de fechas */}
      <ProcessDateFilter
        processDateRange={processDateRange}
        selectedFilter={selectedDateFilter}
        onFilterChange={handleDateFilterChange}
      />

      {/* 📈 Gráficas de monitoreo */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Monitoreo de Parámetros</h3>
            <p className="text-sm text-muted-foreground">
              Datos registrados por los sensores de la instalación durante el proceso
            </p>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Última actualización: {format(lastUpdated, "dd/MM/yyyy HH:mm", { locale: es })}
            </p>
          )}
        </div>

        {/* Gráficas de parámetros */}
        {facility ? (
          <ProcessParameterChart
            facilityId={facility.id}
            processDateRange={processDateRange}
            displayDateRange={displayDateRange}
            processId={process.id}
            showDetailedView={true}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">Información de instalación no disponible</h3>
                  <p className="text-muted-foreground">
                    No se puede cargar el monitoreo sin información de la instalación
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
