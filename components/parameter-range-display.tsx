"use client"

import { Badge } from "@/components/ui/badge"
import type { EspecieParametro } from "@/types/especie-parametro"
import type { Parametro } from "@/types/parametro"

interface ParameterRangeDisplayProps {
  parametros: EspecieParametro[]
  parameters: Parametro[]
}

/**
 * COMPONENTE PARA MOSTRAR RANGOS DE PARÁMETROS DE ESPECIES
 *
 * Responsabilidades:
 * - Mostrar nombre, rango (Rmin-Rmax) y unidad de cada parámetro
 * - Recibir lista de parámetros configurados para una especie
 * - Renderizado simple y claro, sin lógica interactiva
 * - Manejo de casos edge (sin parámetros, parámetro no encontrado)
 *
 * Props:
 * - parametros: Lista de EspecieParametro para mostrar
 * - parameters: Lista completa de parámetros para obtener nombres y unidades
 */
export function ParameterRangeDisplay({ parametros, parameters }: ParameterRangeDisplayProps) {
  // Función para obtener información completa del parámetro
  const getParameterInfo = (idParametro: number) => {
    return parameters.find((p) => p.id_parametro === idParametro)
  }

  // Función para formatear valores numéricos
  const formatValue = (value: number): string => {
    return Number(value).toFixed(1)
  }

  // Si no hay parámetros configurados
  if (!parametros || parametros.length === 0) {
    return <span className="text-sm text-muted-foreground italic">Sin parámetros definidos</span>
  }

  return (
    <div className="space-y-1">
      {parametros.map((param) => {
        const parameterInfo = getParameterInfo(param.id_parametro)

        // Si no se encuentra la información del parámetro
        if (!parameterInfo) {
          return (
            <div key={param.id_parametro} className="text-xs text-muted-foreground">
              Parámetro no encontrado (ID: {param.id_parametro})
            </div>
          )
        }

        return (
          <div key={param.id_parametro} className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs font-medium">
              {parameterInfo.nombre_parametro}
            </Badge>
            <span className="text-muted-foreground">
              {formatValue(param.Rmin)} – {formatValue(param.Rmax)}
            </span>
            <span className="text-xs text-muted-foreground">{parameterInfo.unidad_medida}</span>
          </div>
        )
      })}
    </div>
  )
}
