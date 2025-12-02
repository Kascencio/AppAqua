"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarIcon,
  ClockIcon,
  HashIcon,
  Building2Icon,
  MapPinIcon,
  MoreVerticalIcon,
  ClipboardEditIcon,
  TrashIcon,
  CalendarPlusIcon,
} from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { calcularEstadoProceso, calcularProgresoProceso, calcularDiasProceso } from "@/types/proceso"
import { ExtendProcessDialog } from "./extend-process-dialog"
import type { ProcesoConCalculos } from "@/types/proceso"

interface ProcessCardProps {
  proceso: ProcesoConCalculos
  onEdit?: (proceso: ProcesoConCalculos) => void
  onDelete?: (id: number) => void
  onExtend?: (data: ProcesoConCalculos) => void
}

export function ProcessCard({ proceso, onEdit, onDelete, onExtend }: ProcessCardProps) {
  const [showExtendDialog, setShowExtendDialog] = useState(false)

  if (!proceso) {
    return null
  }

  // Extraer datos del proceso
  const {
    id_proceso,
    fecha_inicio,
    fecha_final,
    codigo_proceso,
    dias_extension = 0,
    motivo_extension,
    nombre_especie,
    nombre_instalacion,
    nombre_sucursal,
  } = proceso

  // Calcular estado y progreso
  const estado = calcularEstadoProceso(fecha_inicio, fecha_final, dias_extension)
  const progreso = calcularProgresoProceso(fecha_inicio, fecha_final, dias_extension)
  const { dias_totales, dias_transcurridos } = calcularDiasProceso(fecha_inicio, fecha_final, dias_extension)

  // Determinar color del estado
  const getEstadoColor = () => {
    switch (estado) {
      case "activo":
        return "bg-green-500"
      case "completado":
        return "bg-blue-500"
      case "extendido":
        return "bg-purple-500"
      case "cancelado":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Formatear fechas
  const fechaInicioFormateada = format(new Date(fecha_inicio), "dd MMM yyyy", { locale: es })
  const fechaFinalFormateada = format(new Date(fecha_final), "dd MMM yyyy", { locale: es })

  // Calcular fecha final con extensión
  const fechaFinalConExtension = () => {
    if (!dias_extension) return null

    const fechaFinalOriginal = new Date(fecha_final)
    const fechaExtendida = new Date(fechaFinalOriginal)
    fechaExtendida.setDate(fechaFinalOriginal.getDate() + dias_extension)

    return format(fechaExtendida, "dd MMM yyyy", { locale: es })
  }

  // Manejar extensión del proceso
  const handleExtend = (data: any) => {
    if (onExtend) {
      onExtend({
        id_proceso,
        ...data,
      })
    }
    setShowExtendDialog(false)
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getEstadoColor()}`} />
            <h3 className="font-medium text-base">{nombre_especie}</h3>
            <Badge variant="outline" className="ml-1">
              {estado === "extendido" ? "Extendido" : estado === "activo" ? "Activo" : "Completado"}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVerticalIcon className="h-4 w-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(proceso)}>
                  <ClipboardEditIcon className="mr-2 h-4 w-4" />
                  Editar proceso
                </DropdownMenuItem>
              )}
              {estado === "completado" && onExtend && (
                <DropdownMenuItem onClick={() => setShowExtendDialog(true)}>
                  <CalendarPlusIcon className="mr-2 h-4 w-4" />
                  Extender proceso
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(id_proceso)} className="text-red-600">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Eliminar proceso
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {/* Código del proceso */}
          <div className="flex items-center gap-2 mb-3">
            <HashIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono">{codigo_proceso || `PROC-${id_proceso}`}</span>
          </div>

          {/* Ubicación */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <Building2Icon className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{nombre_sucursal || "Sucursal no especificada"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm">{nombre_instalacion || "Instalación no especificada"}</span>
            </div>
          </div>

          {/* Fechas */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {fechaInicioFormateada} - {fechaFinalFormateada}
              </span>
            </div>

            {/* Mostrar extensión si existe */}
            {dias_extension > 0 && (
              <div className="flex items-center gap-2">
                <CalendarPlusIcon className="h-4 w-4 text-purple-500" />
                <span className="text-sm">
                  Extendido hasta: {fechaFinalConExtension()}
                  <Badge variant="outline" className="ml-2 text-xs">
                    +{dias_extension} días
                  </Badge>
                </span>
              </div>
            )}

            {/* Motivo de extensión */}
            {motivo_extension && (
              <div className="text-xs text-muted-foreground ml-6 italic">Motivo: {motivo_extension}</div>
            )}
          </div>

          {/* Progreso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {dias_transcurridos} de {dias_totales} días
                </span>
              </div>
              <span className="text-sm font-medium">{progreso}%</span>
            </div>
            <Progress value={progreso} className="h-2" />
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>ID: {id_proceso}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Identificador interno del proceso</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {dias_extension > 0 && (
            <Badge variant="secondary" className="text-xs">
              <span className="text-purple-500 mr-1">•</span> Proceso extendido
            </Badge>
          )}
        </CardFooter>
      </Card>

      {/* Diálogo para extender proceso */}
      <ExtendProcessDialog
        open={showExtendDialog}
        onOpenChange={setShowExtendDialog}
        onConfirm={handleExtend}
        proceso={proceso}
      />
    </>
  )
}
