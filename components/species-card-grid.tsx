"use client"

import { useState } from "react"
import { useSpecies } from "@/hooks/use-species"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Fish, Activity, Edit, Trash, Plus } from "lucide-react"
import { EditSpeciesDialog } from "@/components/edit-species-dialog"
import { EditParameterDialog } from "@/components/edit-parameter-dialog"
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog"
import { Progress } from "@/components/ui/progress"

export function SpeciesCardGrid() {
  const { species, parameters, speciesParameters, loading, error, loadSpecies, deleteSpecies } = useSpecies()
  const [speciesIdToDelete, setSpeciesIdToDelete] = useState<number | null>(null)
  const [speciesIdToEdit, setSpeciesIdToEdit] = useState<number | null>(null)
  const [speciesIdForParameters, setSpeciesIdForParameters] = useState<number | null>(null)
  const speciesToEdit = speciesIdToEdit != null ? species.find((s) => s.id_especie === speciesIdToEdit) : null

  // Obtener los parámetros para una especie específica
  const getSpeciesParametersDetails = (speciesId: number) => {
    return speciesParameters
      .filter((sp) => sp.id_especie === speciesId)
      .map((sp) => {
        const parameter = parameters.find((p) => p.id_parametro === sp.id_parametro)
        return {
          name: parameter?.nombre_parametro || "Desconocido",
          min: sp.Rmin,
          max: sp.Rmax,
          unit: parameter?.unidad_medida || "",
        }
      })
  }

  const handleDeleteConfirm = async () => {
    if (speciesIdToDelete !== null) {
      try {
        await deleteSpecies(speciesIdToDelete)
        setSpeciesIdToDelete(null)
      } catch (error) {
        console.error("Error al eliminar la especie:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-9 bg-muted rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {species.map((species) => {
          const isActive = species.estado === "activa"
          const speciesParams = getSpeciesParametersDetails(species.id_especie)

          return (
            <Card
              key={species.id_especie}
              className={`overflow-hidden transition-all duration-300 hover:shadow-md ${
                isActive ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-gray-300"
              }`}
            >
              <CardHeader className={`pb-2 ${isActive ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}`}>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <Fish className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-gray-500"}`} />
                    {species.nombre}
                  </CardTitle>
                  <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Activo" : "Inactivo"}</Badge>
                </div>
                <CardDescription>
                  ID: {species.id_especie} {isActive && "• Con procesos activos"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Parámetros configurados
                  </h4>

                  {speciesParams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay parámetros configurados para esta especie.</p>
                  ) : (
                    <div className="space-y-3">
                      {speciesParams.map((param, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{param.name}</span>
                            <span>
                              {param.min} - {param.max} {param.unit}
                            </span>
                          </div>
                          <div className="relative pt-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>{param.min}</span>
                              <span>{param.max}</span>
                            </div>
                            <Progress value={50} className="h-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={() => setSpeciesIdToEdit(species.id_especie)}>
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSpeciesIdForParameters(species.id_especie)}>
                  <Plus className="h-4 w-4 mr-1" /> Parámetros
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setSpeciesIdToDelete(species.id_especie)}
                >
                  <Trash className="h-4 w-4 mr-1" /> Eliminar
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Diálogos para editar y eliminar */}
      {speciesToEdit && (
        <EditSpeciesDialog
          species={speciesToEdit}
          open={speciesIdToEdit !== null}
          onOpenChange={(open) => {
            if (!open) setSpeciesIdToEdit(null)
          }}
          onSuccess={loadSpecies}
        />
      )}

      {speciesIdToDelete !== null && (
        <DeleteConfirmationDialog
          title="Eliminar especie"
          description="¿Estás seguro de que deseas eliminar esta especie? Esta acción no se puede deshacer y eliminará todos los parámetros asociados."
          open={speciesIdToDelete !== null}
          onOpenChange={(open) => {
            if (!open) setSpeciesIdToDelete(null)
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {speciesIdForParameters !== null && (
        <EditParameterDialog
          speciesId={speciesIdForParameters}
          open={speciesIdForParameters !== null}
          onOpenChange={(open) => {
            if (!open) setSpeciesIdForParameters(null)
          }}
        />
      )}
    </>
  )
}
