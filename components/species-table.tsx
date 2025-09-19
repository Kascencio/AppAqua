"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Trash2, Search } from "lucide-react"
import { useSpecies } from "@/hooks/use-species"
import { EditSpeciesDialog } from "./edit-species-dialog"
import { ParameterRangeDisplay } from "./parameter-range-display"
import type { Especie } from "@/types/especie"
import { toast } from "sonner"

interface SpeciesTableProps {
  onRefresh: () => Promise<void>
}

export function SpeciesTable({ onRefresh }: SpeciesTableProps) {
  const { species, parameters, speciesParameters, deleteSpecies, loading } = useSpecies()
  const [searchTerm, setSearchTerm] = useState("")
  const [editingSpecies, setEditingSpecies] = useState<Especie | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Filtrar especies por término de búsqueda
  const filteredSpecies = species.filter((especie) => {
    const nombreComun = (especie as any).nombre_comun ?? (especie as any).nombre ?? ""
    const nombreCientifico = (especie as any).nombre_cientifico ?? ""
    const term = (searchTerm || "").toLowerCase()
    return (
      String(nombreComun).toLowerCase().includes(term) ||
      String(nombreCientifico).toLowerCase().includes(term)
    )
  })

  // Obtener parámetros de una especie específica
  const getSpeciesParameters = (especieId: number) => {
    return speciesParameters.filter((sp) => sp.id_especie === especieId)
  }

  // Confirmar eliminación
  const confirmDelete = async (id: number) => {
    try {
      setDeletingId(id)
      await deleteSpecies(id)
      await onRefresh()
      toast.success("Especie eliminada correctamente")
    } catch (error) {
      console.error("Error eliminando especie:", error)
      toast.error("Error al eliminar la especie")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando especies...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar especies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabla de especies */}
      <Card>
        <CardHeader>
          <CardTitle>Especies Registradas ({filteredSpecies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSpecies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No se encontraron especies" : "No hay especies registradas"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Nombre Científico</TableHead>
                  <TableHead>Parámetros</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpecies.map((especie) => {
                  const nombreComun = (especie as any).nombre_comun ?? (especie as any).nombre ?? ""
                  const nombreCientifico = (especie as any).nombre_cientifico ?? "-"
                  const estado = (especie as any).estado ?? "activa"
                  const especieParams = getSpeciesParameters(especie.id_especie)

                  return (
                    <TableRow key={especie.id_especie}>
                      <TableCell className="font-medium">{nombreComun}</TableCell>
                      <TableCell className="italic">{nombreCientifico}</TableCell>
                      <TableCell>
                        <ParameterRangeDisplay parametros={especieParams} parameters={parameters} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={estado === "activa" ? "default" : "secondary"}>{estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingSpecies(especie as any)}>
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={deletingId === especie.id_especie}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar especie?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente la especie "
                                  {nombreComun}" y todos sus parámetros asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => confirmDelete(especie.id_especie)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      {editingSpecies && (
        <EditSpeciesDialog
          species={editingSpecies}
          open={!!editingSpecies}
          onOpenChange={(open) => !open && setEditingSpecies(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}
