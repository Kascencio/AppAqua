"use client"

import type React from "react"
import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useBranches } from "@/hooks/use-branches"
import type { Instalacion } from "@/types/instalacion"

// Local form type - aligned with real BD schema
interface InstalacionFormData {
  id_empresa_sucursal: number
  nombre_instalacion: string
  descripcion: string
}

interface AddInstalacionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddInstalacion: (instalacion: Omit<Instalacion, "id_instalacion">) => Promise<void>
}

export function AddInstalacionDialog({ open, onOpenChange, onAddInstalacion }: AddInstalacionDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { branches, loading: loadingBranches } = useBranches()

  // Formulario basado en estructura REAL de BD (solo campos existentes)
  const [formData, setFormData] = useState<InstalacionFormData>({
    id_empresa_sucursal: 1,
    nombre_instalacion: "",
    descripcion: "",
  })

  const resetForm = () => {
    setFormData({
      id_empresa_sucursal: 1,
      nombre_instalacion: "",
      descripcion: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones según campos requeridos de BD
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
      await onAddInstalacion(formData as unknown as Omit<Instalacion, "id_instalacion">)

      toast({
        title: "Éxito",
        description: "Instalación creada correctamente",
      })

      resetForm()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof InstalacionFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      if (!newOpen) {
        resetForm()
      }
      onOpenChange(newOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Instalación</DialogTitle>
          <DialogDescription>Complete los datos para crear una nueva instalación acuícola.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="id_empresa_sucursal">Sucursal *</Label>
              <Select
                value={formData.id_empresa_sucursal.toString()}
                onValueChange={(value) => handleInputChange("id_empresa_sucursal", Number(value))}
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
              <Label htmlFor="nombre_instalacion">Nombre de la Instalación *</Label>
              <Input
                id="nombre_instalacion"
                value={formData.nombre_instalacion}
                onChange={(e) => handleInputChange("nombre_instalacion", e.target.value)}
                placeholder="Ej: Estanque Principal A1"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleInputChange("descripcion", e.target.value)}
                placeholder="Descripción de la instalación..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Instalación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
