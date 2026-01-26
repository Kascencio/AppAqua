"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useBranches } from "@/hooks/use-branches"
import type { Instalacion } from "@/types/instalacion"

interface EditInstalacionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instalacion: Instalacion | null
  onEditInstalacion: (instalacion: Instalacion) => Promise<void>
}

export function EditInstalacionDialog({ open, onOpenChange, instalacion, onEditInstalacion }: EditInstalacionDialogProps) {
  const { toast } = useToast()
  const { branches, loading: loadingBranches } = useBranches()
  const [loading, setLoading] = useState(false)

  const emptyForm: Instalacion = useMemo(
    () => ({
      id_instalacion: 0,
      id_empresa_sucursal: 1,
      nombre_instalacion: "",
      fecha_instalacion: new Date().toISOString().split("T")[0],
      estado_operativo: "activo",
      descripcion: "",
      tipo_uso: "acuicultura",
      id_proceso: 1,
    }),
    [],
  )

  const [formData, setFormData] = useState<Instalacion>(emptyForm)

  useEffect(() => {
    if (instalacion) {
      setFormData(instalacion)
    } else {
      setFormData(emptyForm)
    }
  }, [instalacion, emptyForm])

  const handleInputChange = (field: keyof Instalacion, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value as any,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instalacion) return

    if (!formData.nombre_instalacion.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la instalación es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (!formData.descripcion.trim()) {
      toast({
        title: "Error",
        description: "La descripción es obligatoria",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await onEditInstalacion(formData)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar instalación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Instalación</DialogTitle>
          <DialogDescription>Actualiza los datos de la instalación seleccionada.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-id_empresa_sucursal">Sucursal *</Label>
              <Select
                value={String(formData.id_empresa_sucursal)}
                onValueChange={(value) => handleInputChange("id_empresa_sucursal", Number(value))}
                disabled={!instalacion}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingBranches ? "Cargando sucursales..." : "Seleccionar sucursal"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(branches) && branches.length > 0 ? (
                    branches.filter((b: any) => b?.tipo === "sucursal").map((b: any) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.nombre || b.name || `Sucursal ${b.id}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={String(formData.id_empresa_sucursal)} disabled>
                      {loadingBranches ? "Cargando..." : "No hay sucursales"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-nombre_instalacion">Nombre de la Instalación *</Label>
              <Input
                id="edit-nombre_instalacion"
                value={formData.nombre_instalacion}
                onChange={(e) => handleInputChange("nombre_instalacion", e.target.value)}
                placeholder="Ej: Estanque Principal A1"
                required
                disabled={!instalacion}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-fecha_instalacion">Fecha de Instalación *</Label>
              <Input
                id="edit-fecha_instalacion"
                type="date"
                value={formData.fecha_instalacion}
                onChange={(e) => handleInputChange("fecha_instalacion", e.target.value)}
                required
                disabled={!instalacion}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-tipo_uso">Tipo de Uso *</Label>
              <Select
                value={formData.tipo_uso}
                onValueChange={(value) => handleInputChange("tipo_uso", value as any)}
                disabled={!instalacion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de uso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acuicultura">Acuicultura</SelectItem>
                  <SelectItem value="tratamiento">Tratamiento</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-estado_operativo">Estado Operativo *</Label>
              <Select
                value={formData.estado_operativo}
                onValueChange={(value) => handleInputChange("estado_operativo", value as any)}
                disabled={!instalacion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-id_proceso">Proceso *</Label>
              <Select
                value={String(formData.id_proceso)}
                onValueChange={(value) => handleInputChange("id_proceso", Number(value))}
                disabled={!instalacion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proceso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Proceso Cultivo Tilapia</SelectItem>
                  <SelectItem value="2">Proceso Alevinaje</SelectItem>
                  <SelectItem value="3">Proceso Tratamiento Agua</SelectItem>
                  <SelectItem value="4">Proceso Multipropósito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-descripcion">Descripción *</Label>
              <Textarea
                id="edit-descripcion"
                value={formData.descripcion}
                onChange={(e) => handleInputChange("descripcion", e.target.value)}
                placeholder="Descripción detallada de la instalación..."
                rows={3}
                required
                disabled={!instalacion}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !instalacion}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
