"use client"
import { useState, useEffect } from "react"
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
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSpecies } from "@/hooks/use-species"
import type { Facility } from "@/types/facility"
import type { Branch } from "@/types/branch"
import { CheckCircle, AlertCircle, Building2, Droplets, AlertTriangle } from "lucide-react"

const formSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "El nombre debe tener al menos 2 caracteres.",
    })
    .max(50, {
      message: "El nombre no puede exceder 50 caracteres.",
    }),
  type: z.enum(["estanque", "purificacion", "criadero", "laboratorio", "almacen"], {
    required_error: "Debe seleccionar un tipo de instalación.",
  }),
  branchId: z.string().min(1, {
    message: "Debe seleccionar una sucursal.",
  }),
  capacity: z
    .number({
      invalid_type_error: "La capacidad debe ser un número válido",
    })
    .min(1, {
      message: "La capacidad debe ser mayor a 0.",
    })
    .max(10000, {
      message: "La capacidad no puede exceder 10,000 m³.",
    }),
  description: z.string().optional(),
  speciesId: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface FacilityWithBranch extends Facility {
  branchId: string
  branchName: string
  branchLocation: string
  capacity?: number
  description?: string
  speciesId?: string
}

interface EditFacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateFacility: (facility: FacilityWithBranch) => void
  facility: FacilityWithBranch | null
  branches: Branch[]
}

export default function EditFacilityDialog({
  open,
  onOpenChange,
  onUpdateFacility,
  facility,
  branches,
}: EditFacilityDialogProps) {
  const { toast } = useToast()
  const { species: speciesList, loading: speciesLoading } = useSpecies()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [originalBranchId, setOriginalBranchId] = useState<string>("")

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  })

  const watchedType = watch("type")
  const watchedBranchId = watch("branchId")
  const watchedName = watch("name")

  // Load facility data when facility changes
  useEffect(() => {
    if (facility) {
      reset({
        name: facility.name,
        type: facility.type as any,
        branchId: facility.branchId,
        capacity: facility.capacity || 1000,
        description: facility.description || "",
        speciesId: facility.speciesId || undefined,
      })
      setOriginalBranchId(facility.branchId)
    }
  }, [facility, reset])

  // Get selected branch info
  const selectedBranch = branches.find((b) => b.id === watchedBranchId)
  const originalBranch = branches.find((b) => b.id === originalBranchId)

  // Filter active branches only
  const activeBranches = branches.filter((branch) => branch.status === "active")

  // Check if branch has changed
  const branchChanged = watchedBranchId !== originalBranchId

  const onSubmit = async (data: FormData) => {
    if (!facility) return

    setIsSubmitting(true)

    try {
      // Validate branch exists and is active
      const selectedBranch = branches.find((b) => b.id === data.branchId)
      if (!selectedBranch) {
        toast({
          title: "Error de validación",
          description: "La sucursal seleccionada no existe.",
          variant: "destructive",
        })
        return
      }

      if (selectedBranch.status !== "active") {
        toast({
          title: "Error de validación",
          description: "No se pueden asignar instalaciones a sucursales inactivas.",
          variant: "destructive",
        })
        return
      }

      // Check if facility name already exists in the branch (excluding current facility)
      const nameExists = selectedBranch.facilities.some(
        (f) => f.name.toLowerCase() === data.name.toLowerCase() && f.id !== facility.id,
      )

      if (nameExists) {
        toast({
          title: "Error de validación",
          description: "Ya existe una instalación con este nombre en la sucursal seleccionada.",
          variant: "destructive",
        })
        return
      }

      const updatedFacility: FacilityWithBranch = {
        ...facility,
        name: data.name,
        type: data.type,
        branchId: data.branchId,
        branchName: selectedBranch.name,
        branchLocation: selectedBranch.location,
        capacity: data.capacity,
        description: data.description || "",
        speciesId: data.speciesId,
      }

      onUpdateFacility(updatedFacility)

      toast({
        title: "Instalación actualizada",
        description: `La instalación "${data.name}" ha sido actualizada exitosamente.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error updating facility:", error)
      toast({
        title: "Error",
        description: "Hubo un error al actualizar la instalación. Inténtelo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (facility) {
      reset({
        name: facility.name,
        type: facility.type as any,
        branchId: facility.branchId,
        capacity: facility.capacity || 1000,
        description: facility.description || "",
        speciesId: facility.speciesId || undefined,
      })
    }
    onOpenChange(false)
  }

  // Get facility type icon and description
  const getFacilityTypeInfo = (type: string) => {
    switch (type) {
      case "estanque":
        return {
          icon: <Droplets className="h-4 w-4 text-blue-500" />,
          description: "Instalación para cultivo de especies acuáticas",
        }
      case "purificacion":
        return {
          icon: <Building2 className="h-4 w-4 text-green-500" />,
          description: "Sistema de tratamiento y purificación de agua",
        }
      case "criadero":
        return {
          icon: <Droplets className="h-4 w-4 text-purple-500" />,
          description: "Instalación para reproducción y cría",
        }
      case "laboratorio":
        return {
          icon: <Building2 className="h-4 w-4 text-orange-500" />,
          description: "Laboratorio de análisis y control de calidad",
        }
      case "almacen":
        return {
          icon: <Building2 className="h-4 w-4 text-gray-500" />,
          description: "Almacén de equipos y suministros",
        }
      default:
        return {
          icon: <Building2 className="h-4 w-4 text-gray-500" />,
          description: "",
        }
    }
  }

  if (!facility) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Editar Instalación
          </DialogTitle>
          <DialogDescription>Modifique los datos de la instalación "{facility.name}".</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4">
            {/* Facility Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre de la Instalación *
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="Ej: Estanque Principal A1"
                  className={`pr-8 ${errors.name ? "border-red-500" : watchedName && watchedName.length >= 2 ? "border-green-500" : ""}`}
                  {...register("name")}
                />
                {watchedName && watchedName.length >= 2 && !errors.name && (
                  <CheckCircle className="absolute right-2 top-2.5 h-4 w-4 text-green-500" />
                )}
                {errors.name && <AlertCircle className="absolute right-2 top-2.5 h-4 w-4 text-red-500" />}
              </div>
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Branch Selection */}
            <div className="space-y-2">
              <Label htmlFor="branchId" className="text-sm font-medium">
                Sucursal *
              </Label>
              <Select
                value={watchedBranchId}
                onValueChange={(value) => setValue("branchId", value, { shouldValidate: true })}
              >
                <SelectTrigger
                  className={errors.branchId ? "border-red-500" : watchedBranchId ? "border-green-500" : ""}
                >
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {activeBranches.length === 0 ? (
                    <SelectItem value="no-branches" disabled>
                      No hay sucursales activas disponibles
                    </SelectItem>
                  ) : (
                    activeBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{branch.name}</div>
                            <div className="text-xs text-muted-foreground">{branch.location}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.branchId && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.branchId.message}
                </p>
              )}

              {/* Branch change warning */}
              {branchChanged && originalBranch && selectedBranch && (
                <div className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <strong>Cambio de sucursal detectado</strong>
                  </div>
                  <div className="mt-1 text-amber-700 dark:text-amber-300">
                    <div>Anterior: {originalBranch.name}</div>
                    <div>Nueva: {selectedBranch.name}</div>
                    <div className="text-xs mt-1">Los sensores asociados podrían requerir reconfiguración.</div>
                  </div>
                </div>
              )}

              {selectedBranch && !branchChanged && (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <strong>Sucursal actual:</strong> {selectedBranch.name} - {selectedBranch.location}
                </div>
              )}
            </div>

            {/* Facility Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Tipo de Instalación *
              </Label>
              <Select
                value={watchedType}
                onValueChange={(value) => setValue("type", value as any, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.type ? "border-red-500" : watchedType ? "border-green-500" : ""}>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estanque">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      Estanque
                    </div>
                  </SelectItem>
                  <SelectItem value="purificacion">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-green-500" />
                      Purificación
                    </div>
                  </SelectItem>
                  <SelectItem value="criadero">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-purple-500" />
                      Criadero
                    </div>
                  </SelectItem>
                  <SelectItem value="laboratorio">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-orange-500" />
                      Laboratorio
                    </div>
                  </SelectItem>
                  <SelectItem value="almacen">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Almacén
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.type.message}
                </p>
              )}
              {watchedType && (
                <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900/20 p-2 rounded flex items-center gap-2">
                  {getFacilityTypeInfo(watchedType).icon}
                  {getFacilityTypeInfo(watchedType).description}
                </div>
              )}
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-sm font-medium">
                Capacidad (m³) *
              </Label>
              <div className="relative">
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="10000"
                  step="0.1"
                  placeholder="Ej: 1000"
                  className={`pr-8 ${errors.capacity ? "border-red-500" : watch("capacity") && watch("capacity") > 0 ? "border-green-500" : ""}`}
                  {...register("capacity", { valueAsNumber: true })}
                />
                {watch("capacity") && watch("capacity") > 0 && !errors.capacity && (
                  <CheckCircle className="absolute right-2 top-2.5 h-4 w-4 text-green-500" />
                )}
                {errors.capacity && <AlertCircle className="absolute right-2 top-2.5 h-4 w-4 text-red-500" />}
              </div>
              {errors.capacity && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.capacity.message}
                </p>
              )}
            </div>

            {/* Species Selection (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="speciesId" className="text-sm font-medium">
                Especie Asignada (Opcional)
              </Label>
              <Select
                value={watch("speciesId") || "no-species"}
                onValueChange={(value) => setValue("speciesId", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar especie (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-species">Sin especie asignada</SelectItem>
                  {speciesLoading ? (
                    <SelectItem value="loading" disabled>
                      Cargando especies...
                    </SelectItem>
                  ) : speciesList.length === 0 ? (
                    <SelectItem value="no-species" disabled>
                      No hay especies disponibles
                    </SelectItem>
                  ) : (
                    speciesList.map((species) => (
                      <SelectItem key={species.id_especie} value={species.id_especie.toString()}>
                        <div>
                          <div className="font-medium">{species.nombre_comun}</div>
                          {species.nombre_cientifico && (
                            <div className="text-xs text-muted-foreground italic">{species.nombre_cientifico}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción (Opcional)
              </Label>
              <Textarea
                id="description"
                placeholder="Descripción adicional de la instalación..."
                className="min-h-[80px]"
                {...register("description")}
              />
            </div>

            {/* Current sensors info */}
            {facility.sensors && facility.sensors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sensores Asociados</Label>
                <div className="text-sm bg-gray-50 dark:bg-gray-900/20 p-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{facility.sensors.length} sensores conectados</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Los sensores se mantendrán asociados a esta instalación después de la edición.
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || !isDirty || isSubmitting || activeBranches.length === 0}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
