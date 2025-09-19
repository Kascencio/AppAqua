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
import { Plus, Trash2, Loader2, Fish } from "lucide-react"
import { useSpecies } from "@/hooks/use-species"
import type { EspecieCreate } from "@/types/especie"
import type { EspecieParametroCreate } from "@/types/especie-parametro"
import { toast } from "sonner"

interface AddSpeciesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
}

interface ParameterConfig {
  id_parametro: number
  Rmin: number
  Rmax: number
}

export function AddSpeciesDialog({ open, onOpenChange, onSuccess }: AddSpeciesDialogProps) {
  const { parameters, createSpecies, loading } = useSpecies()
  const [formData, setFormData] = useState<EspecieCreate>({
    nombre: "",
    nombre_cientifico: "",
    tipo_cultivo: "agua_dulce",
    estado: "activa",
  })
  const [parameterConfigs, setParameterConfigs] = useState<ParameterConfig[]>([])
  const [selectedParameterId, setSelectedParameterId] = useState<string>("")
  const [parameterRange, setParameterRange] = useState({ Rmin: "", Rmax: "" })
  const [submitting, setSubmitting] = useState(false)

  // Resetear formulario cuando se abre/cierra el dialog
  useEffect(() => {
    if (open) {
      setFormData({
        nombre: "",
        nombre_cientifico: "",
        tipo_cultivo: "agua_dulce",
        estado: "activa",
      })
      setParameterConfigs([])
      setSelectedParameterId("")
      setParameterRange({ Rmin: "", Rmax: "" })
    }
  }, [open])

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

    setParameterConfigs([...parameterConfigs, { id_parametro: idParametro, Rmin, Rmax }])
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

    if (!formData.nombre.trim()) {
      toast.error("Complete los campos obligatorios")
      return
    }

    if (parameterConfigs.length === 0) {
      toast.error("Configure al menos un parámetro para la especie")
      return
    }

    try {
      setSubmitting(true)

      // Crear la especie con sus parámetros
      const especieParametros: EspecieParametroCreate[] = parameterConfigs.map((config) => ({
        id_especie: 0, // Se asignará automáticamente
        id_parametro: config.id_parametro,
        Rmin: config.Rmin,
        Rmax: config.Rmax,
      }))

      await createSpecies({
        nombre: formData.nombre,
        nombre_cientifico: formData.nombre_cientifico,
        tipo_cultivo: formData.tipo_cultivo,
        estado: formData.estado,
        parametros: parameterConfigs.map((c) => ({
          id_parametro: c.id_parametro,
          rango_min: c.Rmin,
          rango_max: c.Rmax,
        })),
      })

      toast.success("Especie creada correctamente")
      onOpenChange(false)
      await onSuccess()
    } catch (error) {
      console.error("Error creando especie:", error)
      toast.error("Error al crear la especie")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fish className="h-5 w-5 text-cyan-600" />
            Agregar Nueva Especie
          </DialogTitle>
          <DialogDescription>
            Completa la información de la especie y configura sus parámetros de cultivo
          </DialogDescription>
        </DialogHeader>

        <form id="add-species-form" onSubmit={handleSubmit} className="space-y-6">
          {/* INFORMACIÓN BÁSICA DE LA ESPECIE */}
          <Card>
          <CardHeader>
              <CardTitle className="text-lg">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_comun">
                    Nombre Común <span className="text-red-500">*</span>
                  </Label>
                  <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Tilapia"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre_cientifico">Nombre Científico</Label>
                  <Input
                    id="nombre_cientifico"
                    value={formData.nombre_cientifico}
                    onChange={(e) => setFormData({ ...formData, nombre_cientifico: e.target.value })}
                    placeholder="Ej: Oreochromis niloticus"
                    
                  />
                </div>
              </div>

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
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion || ""}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción opcional de la especie..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* CONFIGURACIÓN DE PARÁMETROS */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Parámetros de Cultivo</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addParameterConfig}
                  disabled={!selectedParameterId || !parameterRange.Rmin || !parameterRange.Rmax}
                >
                  <Plus className="h-4 w-4" />
                  Agregar Parámetro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
            {/* Selector y rango */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="space-y-2">
                <Label>Parámetro</Label>
                <Select value={selectedParameterId} onValueChange={setSelectedParameterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameters.map((p) => (
                      <SelectItem key={p.id_parametro} value={String(p.id_parametro)}>
                        {p.nombre_parametro} {p.unidad_medida ? `(${p.unidad_medida})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mínimo</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={parameterRange.Rmin}
                  onChange={(e) => setParameterRange({ ...parameterRange, Rmin: e.target.value })}
                  placeholder="Rmin"
                />
              </div>
              <div className="space-y-2">
                <Label>Máximo</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={parameterRange.Rmax}
                  onChange={(e) => setParameterRange({ ...parameterRange, Rmax: e.target.value })}
                  placeholder="Rmax"
                />
              </div>
            </div>
              {parameterConfigs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Fish className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay parámetros configurados</p>
                  <p className="text-sm">Agrega parámetros para definir las condiciones de cultivo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parameterConfigs.map((config) => (
                    <div key={config.id_parametro} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getParameterName(config.id_parametro)}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {config.Rmin} – {config.Rmax} {getParameterUnit(config.id_parametro)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParameterConfig(config.id_parametro)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting || loading}>
            Cancelar
          </Button>
          <Button type="submit" form="add-species-form" disabled={submitting || loading}>
            {submitting || loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Especie"
            )}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
