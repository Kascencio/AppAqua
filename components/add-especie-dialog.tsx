"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import type { Especie } from "@/types/especie"

interface AddEspecieDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (especie: Omit<Especie, "id_especie">) => Promise<void>
}

export default function AddEspecieDialog({ open, onOpenChange, onAdd }: AddEspecieDialogProps) {
  const [form, setForm] = useState({
    nombre_comun: "",
    nombre_cientifico: "",
    parametros_optimos: "",
    descripcion: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const resetForm = () => {
    setForm({
      nombre_comun: "",
      nombre_cientifico: "",
      parametros_optimos: "",
      descripcion: "",
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!form.nombre_comun.trim()) {
      setError("El nombre común es obligatorio")
      return
    }

    if (form.nombre_comun.length > 80) {
      setError("El nombre común no puede exceder 80 caracteres")
      return
    }

    if (form.nombre_cientifico && form.nombre_cientifico.length > 80) {
      setError("El nombre científico no puede exceder 80 caracteres")
      return
    }

    if (form.parametros_optimos && form.parametros_optimos.length > 150) {
      setError("Los parámetros óptimos no pueden exceder 150 caracteres")
      return
    }

    if (form.descripcion && form.descripcion.length > 120) {
      setError("La descripción no puede exceder 120 caracteres")
      return
    }

    try {
      setLoading(true)
      setError(null)

      await onAdd({
        nombre_comun: form.nombre_comun.trim(),
        nombre_cientifico: form.nombre_cientifico.trim() || undefined,
        parametros_optimos: form.parametros_optimos.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
      })

      resetForm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar especie")
    } finally {
      setLoading(false)
    }
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
          <DialogTitle>Agregar Nueva Especie</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre_comun">
              Nombre común <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre_comun"
              name="nombre_comun"
              value={form.nombre_comun}
              onChange={handleChange}
              placeholder="Ej: Tilapia"
              maxLength={80}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">{form.nombre_comun.length}/80 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre_cientifico">Nombre científico</Label>
            <Input
              id="nombre_cientifico"
              name="nombre_cientifico"
              value={form.nombre_cientifico}
              onChange={handleChange}
              placeholder="Ej: Oreochromis niloticus"
              maxLength={80}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">{form.nombre_cientifico.length}/80 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parametros_optimos">Parámetros óptimos</Label>
            <Input
              id="parametros_optimos"
              name="parametros_optimos"
              value={form.parametros_optimos}
              onChange={handleChange}
              placeholder="Ej: pH 6.5-8.5, Temp 22-30°C, O2 >5mg/L"
              maxLength={150}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">{form.parametros_optimos.length}/150 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Descripción de la especie..."
              rows={3}
              maxLength={120}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">{form.descripcion.length}/120 caracteres</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Especie
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
