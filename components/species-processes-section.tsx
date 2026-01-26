"use client"

import { useProcesses } from "@/hooks/use-processes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Calendar, Building2, Eye } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import type { Especie } from "@/types/especie"
import type { ProcesoConCalculos } from "@/types/proceso"

interface SpeciesProcessesSectionProps {
  species: Especie
}

export function SpeciesProcessesSection({ species }: SpeciesProcessesSectionProps) {
  const { processes, loading } = useProcesses()

  const speciesProcesses: ProcesoConCalculos[] = processes.filter((p) => p.id_especie === species.id_especie)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Procesos de Cultivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando procesos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (speciesProcesses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Procesos de Cultivo
          </CardTitle>
          <CardDescription>Historial de procesos para {species.nombre}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay procesos registrados para esta especie</p>
            <p className="text-sm mt-2">Los procesos aparecerán aquí cuando se creen.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeProcesses = speciesProcesses.filter((p) => p.estado === "activo")
  const completedProcesses = speciesProcesses.filter((p) => p.estado === "completado")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Procesos de Cultivo
            </CardTitle>
            <CardDescription>
              {speciesProcesses.length} proceso{speciesProcesses.length !== 1 ? "s" : ""} registrado
              {speciesProcesses.length !== 1 ? "s" : ""} para {species.nombre}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {activeProcesses.length > 0 && (
              <Badge variant="default" className="bg-green-500">
                {activeProcesses.length} activo{activeProcesses.length !== 1 ? "s" : ""}
              </Badge>
            )}
            {completedProcesses.length > 0 && (
              <Badge variant="secondary">
                {completedProcesses.length} completado{completedProcesses.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {speciesProcesses.slice(0, 5).map((process) => {
            const duracionDias = differenceInDays(new Date(process.fecha_final), new Date(process.fecha_inicio))
            const diasTranscurridos = differenceInDays(new Date(), new Date(process.fecha_inicio))
            const progreso = Math.min(Math.max((diasTranscurridos / duracionDias) * 100, 0), 100)

            return (
              <div
                key={process.id_proceso}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{process.codigo_proceso || `Proceso ${process.id_proceso}`}</h4>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        process.estado === "activo"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : process.estado === "completado"
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            : process.estado === "pausado"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      }`}
                    >
                      {process.estado === "activo"
                        ? "Activo"
                        : process.estado === "completado"
                          ? "Completado"
                          : process.estado === "pausado"
                            ? "Pausado"
                            : "Extendido"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span>{process.nombre_instalacion || "Instalación no especificada"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(process.fecha_inicio), "MMM yyyy", { locale: es })} -{" "}
                        {format(new Date(process.fecha_final), "MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    <span>{duracionDias} días</span>
                  </div>

                  {process.estado === "activo" && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progreso</span>
                        <span>{Math.round(progreso)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progreso}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = `/procesos/${process.id_proceso}`)}
                  className="ml-4"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </div>
            )
          })}

          {speciesProcesses.length > 5 && (
            <div className="text-center pt-4 border-t">
              <Button variant="outline" onClick={() => (window.location.href = "/procesos")}>
                Ver todos los procesos ({speciesProcesses.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
