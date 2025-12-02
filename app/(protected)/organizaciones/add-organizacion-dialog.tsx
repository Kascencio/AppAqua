"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  nombre: z.string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  razon_social: z.string()
    .min(1, "La razón social es requerida")
    .max(255, "La razón social no puede exceder 255 caracteres"),
  rfc: z.string()
    .min(12, "El RFC debe tener al menos 12 caracteres")
    .max(13, "El RFC no puede exceder 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "Formato de RFC inválido"),
  email: z.string()
    .email("Email inválido")
    .min(1, "El email es requerido"),
  telefono: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede exceder 15 dígitos")
    .regex(/^[0-9+\-\s()]+$/, "Formato de teléfono inválido"),
  direccion: z.string()
    .min(1, "La dirección es requerida")
    .max(255, "La dirección no puede exceder 255 caracteres"),
  estado: z.enum(["activa", "inactiva"], {
    required_error: "El estado es requerido",
  }),
  descripcion: z.string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddOrganizacionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddOrganizacionDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddOrganizacionDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      razon_social: "",
      rfc: "",
      email: "",
      telefono: "",
      direccion: "",
      estado: "activa",
      descripcion: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true)

      const response = await fetch("/api/organizaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al crear organización")
      }

      toast.success("Organización creada exitosamente")
      form.reset()
      onSuccess()

    } catch (error) {
      console.error("Error creating organizacion:", error)
      toast.error(error instanceof Error ? error.message : "Error al crear organización")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Organización</DialogTitle>
          <DialogDescription>
            Ingresa los datos de la nueva organización. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nombre de la organización" 
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="activa">Activa</SelectItem>
                        <SelectItem value="inactiva">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="razon_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón Social *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Razón social de la organización" 
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rfc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFC *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="XAXX010101000" 
                        {...field}
                        disabled={loading}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="5555555555" 
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="contacto@organizacion.com" 
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Dirección completa de la organización"
                      className="resize-none"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción opcional de la organización"
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Organización
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}