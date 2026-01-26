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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Trash2, Search, RefreshCw } from "lucide-react"
import { useOrganizaciones, type UseOrganizacionesResult } from "@/hooks/use-organizaciones"
import { EditOrganizacionDialog } from "./edit-organizacion-dialog"
import type { Organizacion } from "@/lib/backend-client"
import { toast } from "@/hooks/use-toast"

interface OrganizacionesTableProps {
  organizaciones: Organizacion[]
  loading: boolean
  onRefresh: () => Promise<void>
  page: number
  onPageChange: (page: number) => void
}

export function OrganizacionesTable({ organizaciones, loading, onRefresh, page, onPageChange }: OrganizacionesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingOrg, setEditingOrg] = useState<Organizacion | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { remove } = useOrganizaciones({ auto: false })

  // Filtrar organizaciones por término de búsqueda
  const filteredOrganizaciones = organizaciones.filter((org) =>
    org.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.descripcion || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (!deletingId) return
    
    try {
      await remove(deletingId)
      await onRefresh()
      toast({
        title: "Éxito",
        description: "Organización eliminada correctamente",
      })
    } catch (error) {
      console.error("Error eliminando organización:", error)
      toast({
        title: "Error",
        description: "Error al eliminar la organización",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando organizaciones...</CardTitle>
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
            placeholder="Buscar organizaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabla de organizaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Organizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No se encontraron organizaciones
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizaciones.map((org) => (
                  <TableRow key={org.id_organizacion}>
                    <TableCell className="font-medium">{org.id_organizacion}</TableCell>
                    <TableCell className="font-semibold">{org.nombre}</TableCell>
                    <TableCell className="max-w-xs truncate">{org.descripcion || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={org.activo ? "default" : "secondary"}>
                        {org.activo ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(org.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingOrg(org)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingId(org.id_organizacion)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      {editingOrg && (
        <EditOrganizacionDialog
          organizacion={editingOrg}
          open={!!editingOrg}
          onOpenChange={(open) => !open && setEditingOrg(null)}
          onSuccess={onRefresh}
        />
      )}

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la organización.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
