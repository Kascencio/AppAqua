"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Building2Icon, MapPinIcon, HashIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { useEspecies } from "@/hooks/use-especies"
import { useInstalaciones } from "@/hooks/use-instalaciones"
import { generarCodigoProceso } from "@/types/proceso"

// Esquema de validación para el formulario
const formSchema = z.object({
  id_especie: z.coerce.number({
    required_error: "Selecciona una especie",
  }),
  id_instalacion: z.coerce.number({
    required_error: "Selecciona una instalación",
  }),
  id_empresa_sucursal: z.coerce.number({
    required_error: "Selecciona una sucursal",
  }),
  fecha_inicio: z.date({
    required_error: "Selecciona una fecha de inicio",
  }),
  fecha_final: z.date({
    required_error: "Selecciona una fecha de finalización",
  }),
  codigo_proceso: z.string().optional(),
})

interface ProcesoFormProps {
  onSubmit: (data: any) => void
  initialData?: any
  isLoading?: boolean
}

export function ProcesoForm({ onSubmit, initialData, isLoading = false }: ProcesoFormProps) {
  const { toast } = useToast()
  const { data: especies, isLoading: loadingEspecies } = useEspecies()
  const { data: instalaciones, isLoading: loadingInstalaciones } = useInstalaciones()

  const [selectedEspecie, setSelectedEspecie] = useState<string>("")
  const [selectedInstalacion, setSelectedInstalacion] = useState<number | null>(null)
  const [instalacionesFiltradas, setInstalacionesFiltradas] = useState<any[]>([])
  const [diasDuracion, setDiasDuracion] = useState<number>(0)
  const [codigoProceso, setCodigoProceso] = useState<string>("")

  // Inicializar el formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          fecha_inicio: initialData.fecha_inicio ? new Date(initialData.fecha_inicio) : undefined,
          fecha_final: initialData.fecha_final ? new Date(initialData.fecha_final) : undefined,
        }
      : {
          id_especie: undefined,
          id_instalacion: undefined,
          id_empresa_sucursal: undefined,
          fecha_inicio: undefined,
          fecha_final: undefined,
          codigo_proceso: "",
        },
  })

  // Observar cambios en fechas para calcular duración
  const fechaInicio = form.watch("fecha_inicio")
  const fechaFinal = form.watch("fecha_final")
  const especieId = form.watch("id_especie")
  const sucursalId = form.watch("id_empresa_sucursal")

  // Calcular duración cuando cambien las fechas
  useEffect(() => {
    if (fechaInicio && fechaFinal) {
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFinal)
      const diffTime = Math.abs(fin.getTime() - inicio.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDiasDuracion(diffDays)
    }
  }, [fechaInicio, fechaFinal])

  // Generar código de proceso cuando cambie la especie o fecha de inicio
  useEffect(() => {
    if (especieId && fechaInicio) {
      const especie = especies?.find((e) => e.id_especie === especieId)
      if (especie) {
        setSelectedEspecie(especie.nombre)
        const codigo = generarCodigoProceso(new Date(fechaInicio), especie.nombre)
        setCodigoProceso(codigo)
        form.setValue("codigo_proceso", codigo)
      }
    }
  }, [especieId, fechaInicio, especies, form])

  // Filtrar instalaciones por sucursal seleccionada
  useEffect(() => {
    if (sucursalId && instalaciones) {
      const filtradas = instalaciones.filter((inst) => inst.id_empresa_sucursal === sucursalId)
      setInstalacionesFiltradas(filtradas)

      // Si la instalación actual no pertenece a la sucursal, resetear
      const instalacionActual = form.getValues("id_instalacion")
      if (instalacionActual) {
        const pertenece = filtradas.some((inst) => inst.id_instalacion === instalacionActual)
        if (!pertenece) {
          form.setValue("id_instalacion", undefined as any)
        }
      }
    } else {
      setInstalacionesFiltradas([])
    }
  }, [sucursalId, instalaciones, form])

  // Actualizar información de instalación seleccionada
  useEffect(() => {
    const instalacionId = form.getValues("id_instalacion")
    if (instalacionId) {
      setSelectedInstalacion(instalacionId)
    }
  }, [form])

  // Manejar envío del formulario
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Validar que la fecha final sea posterior a la inicial
    if (values.fecha_final < values.fecha_inicio) {
      toast({
        title: "Error de validación",
        description: "La fecha de finalización debe ser posterior a la fecha de inicio",
        variant: "destructive",
      })
      return
    }

    // Formatear fechas a ISO string
    const formattedData = {
      ...values,
      fecha_inicio: format(values.fecha_inicio, "yyyy-MM-dd"),
      fecha_final: format(values.fecha_final, "yyyy-MM-dd"),
      codigo_proceso: codigoProceso,
    }

    onSubmit(formattedData)
  }

  // Obtener detalles de la instalación seleccionada
  const getInstalacionDetails = () => {
    if (!selectedInstalacion || !instalaciones) return null

    const instalacion = instalaciones.find((i) => i.id_instalacion === selectedInstalacion)
    if (!instalacion) return null

    // Encontrar la sucursal asociada
    const sucursal = instalaciones.find((i) => i.id_instalacion === selectedInstalacion)?.id_empresa_sucursal
    const sucursalData = instalaciones.find((i) => i.id_instalacion === selectedInstalacion)?.id_empresa_sucursal

    return {
      nombre: instalacion.nombre_instalacion,
      descripcion: instalacion.descripcion,
      tipo: instalacion.tipo_uso,
      sucursal: sucursalData?.nombre || "Desconocida",
    }
  }

  const instalacionDetails = getInstalacionDetails()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Sección de identificación del proceso */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HashIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Identificación del Proceso</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código del proceso */}
            <FormField
              control={form.control}
              name="codigo_proceso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código del Proceso</FormLabel>
                  <FormControl>
                    <Input {...field} value={codigoProceso} disabled className="font-mono" />
                  </FormControl>
                  <FormDescription>Código generado automáticamente</FormDescription>
                </FormItem>
              )}
            />

            {/* Especie */}
            <FormField
              control={form.control}
              name="id_especie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especie</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(Number.parseInt(value))
                    }}
                    value={field.value?.toString()}
                    disabled={loadingEspecies || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una especie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {especies?.map((especie) => (
                        <SelectItem key={especie.id_especie} value={especie.id_especie.toString()}>
                          {especie.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Sección de ubicación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2Icon className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Ubicación</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sucursal */}
            <FormField
              control={form.control}
              name="id_empresa_sucursal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(Number.parseInt(value))
                    }}
                    value={field.value?.toString()}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una sucursal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instalaciones?.map((sucursal) => (
                        <SelectItem key={sucursal.id_empresa_sucursal} value={sucursal.id_empresa_sucursal.toString()}>
                          {sucursal.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instalación */}
            <FormField
              control={form.control}
              name="id_instalacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instalación</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(Number.parseInt(value))
                      setSelectedInstalacion(Number.parseInt(value))
                    }}
                    value={field.value?.toString()}
                    disabled={loadingInstalaciones || isLoading || !sucursalId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={!sucursalId ? "Selecciona primero una sucursal" : "Selecciona una instalación"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instalacionesFiltradas?.map((instalacion) => (
                        <SelectItem key={instalacion.id_instalacion} value={instalacion.id_instalacion.toString()}>
                          {instalacion.nombre_instalacion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Detalles de la instalación seleccionada */}
          {instalacionDetails && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <MapPinIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">{instalacionDetails.nombre}</h4>
                    <p className="text-sm text-muted-foreground">{instalacionDetails.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {instalacionDetails.tipo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <Building2Icon className="h-3 w-3 inline mr-1" />
                        {instalacionDetails.sucursal}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Sección de fechas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Periodo del Proceso</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de inicio */}
            <FormField
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de inicio</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          disabled={isLoading}
                        >
                          {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("2023-01-01")}
                        locale={es}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha de finalización */}
            <FormField
              control={form.control}
              name="fecha_final"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de finalización</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          disabled={isLoading || !fechaInicio}
                        >
                          {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(fechaInicio) || date < new Date("2023-01-01")}
                        locale={es}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Información de duración */}
          {fechaInicio && fechaFinal && (
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Duración del proceso:</span> {diasDuracion} días
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {initialData ? "Actualizar Proceso" : "Crear Proceso"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
