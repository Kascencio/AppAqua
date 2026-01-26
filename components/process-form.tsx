"use client"

import type React from "react"

import { useState } from "react"
import { useInstalaciones } from "@/hooks/use-instalaciones"
import { useEspecies } from "@/hooks/use-especies"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle } from "lucide-react"
import type { Proceso } from "@/types/proceso"

type ProcessFormInitialData = Partial<Proceso> & {
  nombre_proceso?: string
  descripcion?: string
  objetivos?: string
}

interface ProcessFormProps {
  onSubmit: (proceso: Omit<Proceso, "id_proceso">) => Promise<boolean>
  onCancel: () => void
  initialData?: ProcessFormInitialData
}

export function ProcessForm({ onSubmit, onCancel, initialData }: ProcessFormProps) {
  const { instalaciones, loading: loadingInstalaciones } = useInstalaciones()
  const { especies, loading: loadingEspecies } = useEspecies()

  const [formData, setFormData] = useState({
    nombre_proceso: initialData?.nombre_proceso || "",
    descripcion: initialData?.descripcion || "",
    id_especie: initialData?.id_especie || 0,
    id_instalacion: initialData?.id_instalacion || 0,
    fecha_inicio: initialData?.fecha_inicio || "",
    fecha_final: initialData?.fecha_final || "",
    objetivos: initialData?.objetivos || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre_proceso.trim()) {
      newErrors.nombre_proceso = "El nombre del proceso es requerido"
    }

    if (!formData.id_especie) {
      newErrors.id_especie = "Debe seleccionar una especie"
    }

    if (!formData.id_instalacion) {
      newErrors.id_instalacion = "Debe seleccionar una instalación"
    }

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = "La fecha de inicio es requerida"
    }

    if (!formData.fecha_final) {
      newErrors.fecha_final = "La fecha final es requerida"
    }

    if (formData.fecha_inicio && formData.fecha_final) {
      const inicio = new Date(formData.fecha_inicio)
      const fin = new Date(formData.fecha_final)

      if (fin <= inicio) {
        newErrors.fecha_final = "La fecha final debe ser posterior a la fecha de inicio"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const success = await onSubmit(formData as Omit<Proceso, "id_proceso">)
      if (success) {
        // Form will be closed by parent component
      }
    } catch (error) {
      console.error("Error al enviar formulario:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  if (loadingInstalaciones || loadingEspecies) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando datos...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Editar Proceso" : "Nuevo Proceso"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del proceso */}
          <div className="space-y-2">
            <Label htmlFor="nombre_proceso">Nombre del Proceso *</Label>
            <Input
              id="nombre_proceso"
              value={formData.nombre_proceso}
              onChange={(e) => handleInputChange("nombre_proceso", e.target.value)}
              placeholder="Ej: Cultivo de Tilapia - Estanque A"
            />
            {errors.nombre_proceso && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors.nombre_proceso}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Descripción detallada del proceso de cultivo"
              rows={3}
            />
          </div>

          {/* Selección de especie e instalación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id_especie">Especie *</Label>
              <Select
                value={formData.id_especie.toString()}
                onValueChange={(value) => handleInputChange("id_especie", Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar especie" />
                </SelectTrigger>
                <SelectContent>
                  {especies.map((especie) => (
                    <SelectItem key={especie.id_especie} value={especie.id_especie.toString()}>
                      {especie.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_especie && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errors.id_especie}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_instalacion">Instalación *</Label>
              <Select
                value={formData.id_instalacion.toString()}
                onValueChange={(value) => handleInputChange("id_instalacion", Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar instalación" />
                </SelectTrigger>
                <SelectContent>
                  {instalaciones.map((instalacion) => (
                    <SelectItem key={instalacion.id_instalacion} value={instalacion.id_instalacion.toString()}>
                      {String(instalacion.nombre_instalacion ?? instalacion.nombre ?? "")} - {String((instalacion as any).sucursal_nombre ?? "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_instalacion && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errors.id_instalacion}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => handleInputChange("fecha_inicio", e.target.value)}
              />
              {errors.fecha_inicio && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errors.fecha_inicio}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_final">Fecha Final *</Label>
              <Input
                id="fecha_final"
                type="date"
                value={formData.fecha_final}
                onChange={(e) => handleInputChange("fecha_final", e.target.value)}
              />
              {errors.fecha_final && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errors.fecha_final}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Objetivos */}
          <div className="space-y-2">
            <Label htmlFor="objetivos">Objetivos</Label>
            <Textarea
              id="objetivos"
              value={formData.objetivos}
              onChange={(e) => handleInputChange("objetivos", e.target.value)}
              placeholder="Ej: Alcanzar 500g de peso promedio con supervivencia del 95%"
              rows={2}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {initialData ? "Actualizar" : "Crear"} Proceso
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
