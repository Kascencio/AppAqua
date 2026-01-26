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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSpecies } from "@/hooks/use-species"
import type { Branch } from "@/types/branch"
import type { Facility } from "@/types/facility"
import { CheckCircle, AlertCircle, Building2, Droplets } from "lucide-react"

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

interface AddFacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddFacility: (facility: Omit<Facility, "id" | "sensors" | "waterQuality">) => void
  branches: Branch[]
}

export default function AddFacilityDialog({ open, onOpenChange, onAddFacility, branches }: AddFacilityDialogProps) {
  const { toast } = useToast()
  const { species: speciesList, loading: speciesLoading } = useSpecies()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "estanque",
      branchId: "defaultBranchId", // Updated default value to be a non-empty string
      capacity: 1,
      description: "",
      speciesId: undefined,
    },
    mode: "onChange",
  })

  const watchedType = watch("type")
  const watchedBranchId = watch("branchId")
  const watchedName = watch("name")

  // Get selected branch info
  const selectedBranch = branches.find((b) => String(b.id) === watchedBranchId)

  // Filter active branches only
  const activeBranches = branches.filter((branch) => branch.status === "active")

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      // Validate branch exists and is active
      const selectedBranch = branches.find((b) => String(b.id) === data.branchId)
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
          description: "No se pueden crear instalaciones en sucursales inactivas.",
          variant: "destructive",
        })
        return
      }

      // Check if facility name already exists in the branch
      const nameExists = (selectedBranch.facilities || []).some(
        (facility) => facility.name.toLowerCase() === data.name.toLowerCase(),
      )

      if (nameExists) {
        toast({
          title: "Error de validación",
          description: "Ya existe una instalación con este nombre en la sucursal seleccionada.",
          variant: "destructive",
        })
        return
      }

      const newFacility = {
        name: data.name,
        type: data.type,
        branchId: data.branchId,
        capacity: data.capacity,
        description: data.description || "",
        speciesId: data.speciesId,
      }

      onAddFacility(newFacility)

      toast({
        title: "Instalación creada",
        description: `La instalación "${data.name}" ha sido creada exitosamente.`,
      })

      reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating facility:", error)
      toast({
        title: "Error",
        description: "Hubo un error al crear la instalación. Inténtelo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Agregar Nueva Instalación
          </DialogTitle>
          <DialogDescription>Complete los datos para crear una nueva instalación en el sistema.</DialogDescription>
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
                      <SelectItem key={String(branch.id)} value={String(branch.id)}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{branch.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {typeof branch.location === 'string' ? branch.location :
                               branch.location ? `${branch.location.lat}, ${branch.location.lng}` :
                               branch.address?.street || ''}
                            </div>
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
              {selectedBranch && (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <strong>Sucursal seleccionada:</strong> {selectedBranch.name} - {
                    typeof selectedBranch.location === 'string' ? selectedBranch.location :
                    selectedBranch.location ? `${selectedBranch.location.lat}, ${selectedBranch.location.lng}` :
                    selectedBranch.address?.street || ''
                  }
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
                value={watch("speciesId") || "defaultSpeciesId"} // Updated default value to be a non-empty string
                onValueChange={(value) => setValue("speciesId", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar especie (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin especie asignada</SelectItem>
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
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || activeBranches.length === 0}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Creando..." : "Crear Instalación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
