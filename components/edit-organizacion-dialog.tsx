"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useOrganizaciones } from "@/hooks/use-organizaciones"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import type { Organizacion } from "@/lib/backend-client"

interface EditOrganizacionDialogProps {
  organizacion: Organizacion
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditOrganizacionDialog({ organizacion, open, onOpenChange, onSuccess }: EditOrganizacionDialogProps) {
  const { update } = useOrganizaciones({ auto: false })
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: organizacion.nombre,
    descripcion: organizacion.descripcion || "",
    activo: organizacion.activo,
  })

  useEffect(() => {
    setFormData({
      nombre: organizacion.nombre,
      descripcion: organizacion.descripcion || "",
      activo: organizacion.activo,
    })
  }, [organizacion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await update(organizacion.id_organizacion, formData)
      toast({
        title: "Éxito",
        description: "Organización actualizada correctamente",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error actualizando organización:", error)
      toast({
        title: "Error",
        description: "Error al actualizar la organización",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Organización</DialogTitle>
            <DialogDescription>Actualiza la información de la organización</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre de la organización"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label htmlFor="activo">Activa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
