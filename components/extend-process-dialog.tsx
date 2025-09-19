"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, Clock, Plus, ArrowRight } from "lucide-react"
import type { ProcesoExtendido } from "@/types/proceso"
import { calculateProcessDuration } from "@/types/proceso"

interface ExtendProcessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proceso: ProcesoExtendido | null
  onConfirm: (extension: { dias_adicionales: number; motivo_extension: string }) => void
}

export function ExtendProcessDialog({ open, onOpenChange, proceso, onConfirm }: ExtendProcessDialogProps) {
  const [diasAdicionales, setDiasAdicionales] = useState<number>(7)
  const [motivoExtension, setMotivoExtension] = useState<string>("")
  const [errors, setErrors] = useState<string[]>([])

  if (!proceso) {
    return null
  }

  const duracionOriginal = calculateProcessDuration(
    proceso.fecha_inicio,
    proceso.fecha_final_original || proceso.fecha_final,
  )
  const duracionActual = calculateProcessDuration(proceso.fecha_inicio, proceso.fecha_final)
  const nuevaDuracion = duracionActual + diasAdicionales

  // Calculate new end date
  const fechaFinalActual = new Date(proceso.fecha_final)
  const nuevaFechaFinal = new Date(fechaFinalActual)
  nuevaFechaFinal.setDate(nuevaFechaFinal.getDate() + diasAdicionales)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleConfirm = () => {
    const validationErrors: string[] = []

    if (diasAdicionales <= 0) {
      validationErrors.push("Los días adicionales deben ser mayor a 0")
    }

    if (diasAdicionales > 180) {
      validationErrors.push("Los días adicionales no pueden exceder 180 días")
    }

    if (!motivoExtension.trim()) {
      validationErrors.push("Debe proporcionar un motivo para la extensión")
    }

    if (motivoExtension.length > 200) {
      validationErrors.push("El motivo no puede exceder 200 caracteres")
    }

    setErrors(validationErrors)

    if (validationErrors.length === 0) {
      onConfirm({
        dias_adicionales: diasAdicionales,
        motivo_extension: motivoExtension.trim(),
      })
      // Reset form
      setDiasAdicionales(7)
      setMotivoExtension("")
      setErrors([])
    }
  }

  const handleCancel = () => {
    setDiasAdicionales(7)
    setMotivoExtension("")
    setErrors([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-purple-500" />
            Extender Proceso
          </DialogTitle>
          <DialogDescription>
            Agregue días adicionales al proceso {proceso.codigo_proceso} de {proceso.nombre_especie}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Process Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Duración Original:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <Badge variant="outline">{duracionOriginal} días</Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Duración Actual:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-green-500" />
                    <Badge variant="outline">{duracionActual} días</Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Fecha Final Actual:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <CalendarDays className="h-4 w-4 text-blue-500" />
                    <span>{formatDate(fechaFinalActual)}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Nueva Fecha Final:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <CalendarDays className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold">{formatDate(nuevaFechaFinal)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extension Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dias_adicionales">Días Adicionales *</Label>
              <Input
                id="dias_adicionales"
                type="number"
                min="1"
                max="180"
                value={diasAdicionales}
                onChange={(e) => setDiasAdicionales(Number.parseInt(e.target.value) || 0)}
                placeholder="Número de días a agregar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo_extension">Motivo de la Extensión *</Label>
              <Textarea
                id="motivo_extension"
                value={motivoExtension}
                onChange={(e) => setMotivoExtension(e.target.value)}
                placeholder="Explique el motivo de la extensión del proceso..."
                rows={3}
                maxLength={200}
              />
              <div className="text-xs text-muted-foreground text-right">{motivoExtension.length}/200 caracteres</div>
            </div>
          </div>

          {/* Duration Comparison */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">Duración Actual</div>
                  <Badge variant="outline" className="mt-1">
                    {duracionActual} días
                  </Badge>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center">
                  <div className="font-medium">Nueva Duración</div>
                  <Badge variant="outline" className="mt-1 bg-purple-50 text-purple-700 border-purple-200">
                    {nuevaDuracion} días
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {errors.length > 0 && (
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <div className="text-sm text-destructive space-y-1">
                  {errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-purple-600 hover:bg-purple-700">
            Extender Proceso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
