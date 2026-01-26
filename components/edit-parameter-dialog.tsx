"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSpecies } from "@/hooks/use-species"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash } from "lucide-react"

interface EditParameterDialogProps {
  speciesId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditParameterDialog({ speciesId, open, onOpenChange }: EditParameterDialogProps) {
  const { species, parameters, speciesParameters, loadSpecies } = useSpecies()
  const [selectedParameter, setSelectedParameter] = useState<string>("")
  const [minValue, setMinValue] = useState<string>("")
  const [maxValue, setMaxValue] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createSpeciesParameter = async (data: { id_especie: number; id_parametro: number; Rmin: number; Rmax: number }) => {
    const resp = await fetch("/api/especie-parametros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!resp.ok) {
      throw new Error("Error al crear parámetro")
    }
  }

  const deleteSpeciesParameter = async (id_especie_parametro: number) => {
    const resp = await fetch(`/api/especie-parametros?id=${id_especie_parametro}`, {
      method: "DELETE",
    })
    if (!resp.ok) {
      throw new Error("Error al eliminar parámetro")
    }
  }

  // Limpiar el formulario cuando cambia el ID de la especie o se abre/cierra el diálogo
  useEffect(() => {
    setSelectedParameter("")
    setMinValue("")
    setMaxValue("")
  }, [speciesId, open])

  // Filtrar parámetros ya asignados a esta especie
  const assignedParameterIds = speciesParameters
    .filter((sp) => sp.id_especie === speciesId)
    .map((sp) => sp.id_parametro)

  const availableParameters = parameters.filter((param) => !assignedParameterIds.includes(param.id_parametro))

  const speciesName = species.find((s) => s.id_especie === speciesId)?.nombre || "Especie"

  // Obtener los parámetros asignados a esta especie con sus detalles
  const speciesParametersWithDetails = speciesParameters
    .filter((sp) => sp.id_especie === speciesId)
    .map((sp) => {
      const parameterDetails = parameters.find((p) => p.id_parametro === sp.id_parametro)
      return {
        ...sp,
        parameterName: parameterDetails?.nombre_parametro || "Desconocido",
        unit: parameterDetails?.unidad_medida || "",
      }
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParameter || !minValue || !maxValue || speciesId === null) return

    const paramId = Number.parseInt(selectedParameter)
    const min = Number.parseFloat(minValue)
    const max = Number.parseFloat(maxValue)

    if (isNaN(min) || isNaN(max) || min >= max) {
      alert("Los valores mínimo y máximo deben ser números válidos y el mínimo debe ser menor que el máximo.")
      return
    }

    setIsSubmitting(true)
    try {
      await createSpeciesParameter({
        id_especie: speciesId,
        id_parametro: paramId,
        Rmin: min,
        Rmax: max,
      })
      await loadSpecies()
      setSelectedParameter("")
      setMinValue("")
      setMaxValue("")
    } catch (error) {
      console.error("Error al añadir el parámetro:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este parámetro?")) {
      try {
        await deleteSpeciesParameter(id)
        await loadSpecies()
      } catch (error) {
        console.error("Error al eliminar el parámetro:", error)
      }
    }
  }

  // Calcular si el valor mínimo es mayor o igual al valor máximo
  const isInvalidRange =
    minValue !== "" && maxValue !== "" && Number.parseFloat(minValue) >= Number.parseFloat(maxValue)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Gestionar parámetros para {speciesName}
          </DialogTitle>
          <DialogDescription>
            Configura los rangos óptimos de parámetros de calidad del agua para esta especie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tabla de parámetros existentes */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="mr-2">📊</span> Parámetros configurados
            </h3>
            {speciesParametersWithDetails.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-md border border-dashed">
                No hay parámetros configurados para esta especie.
              </p>
            ) : (
              <div className="rounded-md border overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Parámetro</TableHead>
                      <TableHead>Valor mínimo</TableHead>
                      <TableHead>Valor máximo</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {speciesParametersWithDetails.map((param) => (
                      <TableRow key={param.id_especie_parametro} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{param.parameterName}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs">
                            {param.Rmin}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md text-xs">
                            {param.Rmax}
                          </span>
                        </TableCell>
                        <TableCell>{param.unit}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(param.id_especie_parametro)}
                            className="hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Formulario para añadir nuevo parámetro */}
          <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-card shadow-sm">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <span className="mr-2">➕</span> Añadir nuevo parámetro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parameter">Parámetro</Label>
                <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                  <SelectTrigger id="parameter" className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableParameters.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No hay parámetros disponibles
                      </SelectItem>
                    ) : (
                      availableParameters.map((param) => (
                        <SelectItem key={param.id_parametro} value={param.id_parametro.toString()}>
                          {param.nombre_parametro}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-value">Valor mínimo</Label>
                <Input
                  id="min-value"
                  type="number"
                  step="0.01"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="Ej: 6.5"
                  className={isInvalidRange ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-value">Valor máximo</Label>
                <Input
                  id="max-value"
                  type="number"
                  step="0.01"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  placeholder="Ej: 8.5"
                  className={isInvalidRange ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !selectedParameter ||
                    !minValue ||
                    !maxValue ||
                    availableParameters.length === 0 ||
                    isInvalidRange
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  {isSubmitting ? "Añadiendo..." : "Añadir parámetro"}
                </Button>
              </div>
            </div>

            {/* Vista previa del rango */}
            {selectedParameter && minValue && maxValue && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md border">
                <h4 className="font-medium mb-2 text-sm">Vista previa del rango</h4>
                <div className="relative pt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      {minValue}{" "}
                      {selectedParameter
                        ? parameters.find((p) => p.id_parametro === Number.parseInt(selectedParameter))?.unidad_medida
                        : ""}
                    </span>
                    <span>
                      {maxValue}{" "}
                      {selectedParameter
                        ? parameters.find((p) => p.id_parametro === Number.parseInt(selectedParameter))?.unidad_medida
                        : ""}
                    </span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full rounded ${isInvalidRange ? "bg-red-500" : "bg-blue-500"}`}
                      style={{ width: "100%", opacity: 0.3 }}
                    />
                  </div>
                </div>
                {isInvalidRange && (
                  <p className="text-red-500 text-xs mt-2">El valor máximo debe ser mayor que el valor mínimo</p>
                )}
              </div>
            )}
          </form>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Añadir exportación por defecto para compatibilidad
export default EditParameterDialog
