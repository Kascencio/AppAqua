"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useOrganizaciones } from "@/hooks/use-organizaciones"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface AddOrganizacionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddOrganizacionDialog({ open, onOpenChange, onSuccess }: AddOrganizacionDialogProps) {
  const { create } = useOrganizaciones({ auto: false })
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  })

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
      await create(formData)
      toast({
        title: "Éxito",
        description: "Organización creada correctamente",
      })
      onSuccess()
      onOpenChange(false)
      setFormData({ nombre: "", descripcion: "", activo: true })
    } catch (error) {
      console.error("Error creando organización:", error)
      toast({
        title: "Error",
        description: "Error al crear la organización",
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
            <DialogTitle>Nueva Organización</DialogTitle>
            <DialogDescription>Crea una nueva organización en el sistema</DialogDescription>
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
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
