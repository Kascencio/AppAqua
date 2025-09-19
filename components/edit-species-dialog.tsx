"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus } from "lucide-react"
import { useSpecies } from "@/hooks/use-species"
import type { Especie, EspecieUpdate } from "@/types/especie"
import type { EspecieParametroCreate } from "@/types/especie-parametro"
import { toast } from "sonner"

interface EditSpeciesDialogProps {
  species: Especie
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
}

interface ParameterConfig {
  id_parametro: number
  Rmin: number
  Rmax: number
  isExisting?: boolean
  id_especie_parametro?: number
}

export function EditSpeciesDialog({ species, open, onOpenChange, onSuccess }: EditSpeciesDialogProps) {
  const { parameters, speciesParameters, updateSpecies, loading } = useSpecies()
  const [formData, setFormData] = useState<EspecieUpdate>({})
  const [parameterConfigs, setParameterConfigs] = useState<ParameterConfig[]>([])
  const [selectedParameterId, setSelectedParameterId] = useState<string>("")
  const [parameterRange, setParameterRange] = useState({ Rmin: "", Rmax: "" })
  const [submitting, setSubmitting] = useState(false)

  // Inicializar formulario cuando cambia la especie o se abre el dialog
  useEffect(() => {
    if (open && species) {
      setFormData({
        nombre_comun: species.nombre_comun,
        nombre_cientifico: species.nombre_cientifico,
        descripcion: species.descripcion || "",
        tipo_cultivo: species.tipo_cultivo,
        estado: species.estado,
      })

      // Cargar parámetros existentes
      const existingParams = speciesParameters
        .filter((sp) => sp.id_especie === species.id_especie)
        .map((sp) => ({
          id_parametro: sp.id_parametro,
          Rmin: sp.Rmin,
          Rmax: sp.Rmax,
          isExisting: true,
          id_especie_parametro: sp.id_especie_parametro,
        }))

      setParameterConfigs(existingParams)
      setSelectedParameterId("")
      setParameterRange({ Rmin: "", Rmax: "" })
    }
  }, [open, species, speciesParameters])

  // Agregar configuración de parámetro
  const addParameterConfig = () => {
    if (!selectedParameterId || !parameterRange.Rmin || !parameterRange.Rmax) {
      toast.error("Complete todos los campos del parámetro")
      return
    }

    const idParametro = Number.parseInt(selectedParameterId)
    const Rmin = Number.parseFloat(parameterRange.Rmin)
    const Rmax = Number.parseFloat(parameterRange.Rmax)

    // Validaciones
    if (isNaN(Rmin) || isNaN(Rmax)) {
      toast.error("Los valores del rango deben ser números válidos")
      return
    }

    if (Rmin >= Rmax) {
      toast.error("El valor mínimo debe ser menor que el máximo")
      return
    }

    // Verificar que no esté duplicado
    if (parameterConfigs.some((config) => config.id_parametro === idParametro)) {
      toast.error("Este parámetro ya está configurado")
      return
    }

    setParameterConfigs([
      ...parameterConfigs,
      {
        id_parametro: idParametro,
        Rmin,
        Rmax,
        isExisting: false,
      },
    ])
    setSelectedParameterId("")
    setParameterRange({ Rmin: "", Rmax: "" })
  }

  // Remover configuración de parámetro
  const removeParameterConfig = (idParametro: number) => {
    setParameterConfigs(parameterConfigs.filter((config) => config.id_parametro !== idParametro))
  }

  // Obtener nombre del parámetro
  const getParameterName = (idParametro: number) => {
    const parameter = parameters.find((p) => p.id_parametro === idParametro)
    return parameter ? parameter.nombre_parametro : `Parámetro ${idParametro}`
  }

  // Obtener unidad del parámetro
  const getParameterUnit = (idParametro: number) => {
    const parameter = parameters.find((p) => p.id_parametro === idParametro)
    return parameter ? parameter.unidad_medida : ""
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre_comun?.trim() || !formData.nombre_cientifico?.trim()) {
      toast.error("Complete los campos obligatorios")
      return
    }

    if (parameterConfigs.length === 0) {
      toast.error("Configure al menos un parámetro para la especie")
      return
    }

    try {
      setSubmitting(true)

      // Preparar parámetros nuevos
      const nuevosParametros: EspecieParametroCreate[] = parameterConfigs
        .filter((config) => !config.isExisting)
        .map((config) => ({
          id_especie: species.id_especie,
          id_parametro: config.id_parametro,
          Rmin: config.Rmin,
          Rmax: config.Rmax,
        }))

      await updateSpecies(species.id_especie, formData, nuevosParametros)

      toast.success("Especie actualizada correctamente")
      onOpenChange(false)
      await onSuccess()
    } catch (error) {
      console.error("Error actualizando especie:", error)
      toast.error("Error al actualizar la especie")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Especie</DialogTitle>
          <DialogDescription>
            Modifica la información de la especie y sus parámetros de calidad del agua
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_comun">Nombre Común *</Label>
              <Input
                id="nombre_comun"
                value={formData.nombre_comun || ""}
                onChange={(e) => setFormData({ ...formData, nombre_comun: e.target.value })}
                placeholder="ej: Tilapia"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre_cientifico">Nombre Científico *</Label>
              <Input
                id="nombre_cientifico"
                value={formData.nombre_cientifico || ""}
                onChange={(e) => setFormData({ ...formData, nombre_cientifico: e.target.value })}
                placeholder="ej: Oreochromis niloticus"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_cultivo">Tipo de Cultivo</Label>
              <Select
                value={formData.tipo_cultivo}
                onValueChange={(value: "agua_dulce" | "agua_salada" | "agua_salobre") =>
                  setFormData({ ...formData, tipo_cultivo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agua_dulce">Agua Dulce</SelectItem>
                  <SelectItem value="agua_salada">Agua Salada</SelectItem>
                  <SelectItem value="agua_salobre">Agua Salobre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value: "activo" | "inactivo") => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion || ""}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción opcional de la especie..."
              rows={3}
            />
          </div>

          {/* Configuración de parámetros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parámetros de Calidad del Agua</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agregar nuevo parámetro */}
              <div className="grid grid-cols-4 gap-2 items-end">
                <div className="space-y-2">
                  <Label>Parámetro</Label>
                  <Select value={selectedParameterId} onValueChange={setSelectedParameterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {parameters
                        .filter((p) => !parameterConfigs.some((config) => config.id_parametro === p.id_parametro))
                        .map((parameter) => (
                          <SelectItem key={parameter.id_parametro} value={parameter.id_parametro.toString()}>
                            {parameter.nombre_parametro} ({parameter.unidad_medida})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mínimo</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={parameterRange.Rmin}
                    onChange={(e) => setParameterRange({ ...parameterRange, Rmin: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máximo</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={parameterRange.Rmax}
                    onChange={(e) => setParameterRange({ ...parameterRange, Rmax: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <Button
                  type="button"
                  onClick={addParameterConfig}
                  disabled={!selectedParameterId || !parameterRange.Rmin || !parameterRange.Rmax}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Lista de parámetros configurados */}
              {parameterConfigs.length > 0 && (
                <div className="space-y-2">
                  <Label>Parámetros Configurados:</Label>
                  <div className="space-y-2">
                    {parameterConfigs.map((config) => (
                      <div
                        key={config.id_parametro}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={config.isExisting ? "default" : "secondary"}>
                            {getParameterName(config.id_parametro)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {config.Rmin} – {config.Rmax} {getParameterUnit(config.id_parametro)}
                          </span>
                          {config.isExisting && (
                            <Badge variant="outline" className="text-xs">
                              Existente
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParameterConfig(config.id_parametro)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || loading}>
              {submitting ? "Actualizando..." : "Actualizar Especie"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
