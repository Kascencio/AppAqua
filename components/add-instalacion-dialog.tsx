"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
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
import { backendApi } from "@/lib/backend-client"
import type { Instalacion } from "@/types/instalacion"

interface ProcesoOption {
  id_proceso: number
  nombre?: string
  nombre_proceso?: string
  nombre_especie?: string
}

interface InstalacionFormData {
  id_organizacion: number
  id_empresa_sucursal: number | null
  nombre_instalacion: string
  codigo_instalacion: string
  fecha_instalacion: string
  estado_operativo: "activo" | "inactivo"
  descripcion: string
  tipo_uso: "acuicultura" | "tratamiento" | "otros"
  id_proceso: number
  ubicacion: string
  latitud: string
  longitud: string
  capacidad_maxima: string
  capacidad_actual: string
  responsable_operativo: string
  contacto_emergencia: string
}

interface AddInstalacionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddInstalacion: (instalacion: Omit<Instalacion, "id_instalacion">) => Promise<void>
}

const todayISO = () => new Date().toISOString().split("T")[0]

const defaultFormData = (): InstalacionFormData => ({
  id_organizacion: 0,
  id_empresa_sucursal: null,
  nombre_instalacion: "",
  codigo_instalacion: "",
  fecha_instalacion: todayISO(),
  estado_operativo: "activo",
  descripcion: "",
  tipo_uso: "acuicultura",
  id_proceso: 0,
  ubicacion: "",
  latitud: "",
  longitud: "",
  capacidad_maxima: "",
  capacidad_actual: "",
  responsable_operativo: "",
  contacto_emergencia: "",
})

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function AddInstalacionDialog({ open, onOpenChange, onAddInstalacion }: AddInstalacionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingProcesos, setLoadingProcesos] = useState(false)
  const [procesos, setProcesos] = useState<ProcesoOption[]>([])
  const { toast } = useToast()
  const { branches, loading: loadingBranches, reload } = useBranches()

  const [formData, setFormData] = useState<InstalacionFormData>(defaultFormData)

  const organizaciones = useMemo(
    () => (Array.isArray(branches) ? branches.filter((b: any) => b?.tipo === "empresa") : []),
    [branches],
  )

  const sucursales = useMemo(
    () => (Array.isArray(branches) ? branches.filter((b: any) => b?.tipo === "sucursal") : []),
    [branches],
  )

  const sucursalesDeOrganizacion = useMemo(
    () =>
      sucursales.filter(
        (b: any) => Number(b?.id_padre ?? 0) === Number(formData.id_organizacion),
      ),
    [sucursales, formData.id_organizacion],
  )

  useEffect(() => {
    if (!open) return

    let isMounted = true
    const loadProcesos = async () => {
      try {
        await reload()
      } catch {
        // No bloquea la creación de instalación.
      }
      setLoadingProcesos(true)
      try {
        const response = await backendApi.getProcesos({ page: 1, limit: 300 })
        const payload: any = response
        const rows = Array.isArray(payload) ? payload : payload?.data || []
        if (isMounted) setProcesos(rows)
      } catch {
        if (isMounted) setProcesos([])
      } finally {
        if (isMounted) setLoadingProcesos(false)
      }
    }

    loadProcesos()
    return () => {
      isMounted = false
    }
  }, [open, reload])

  useEffect(() => {
    if (formData.id_proceso > 0) return
    if (procesos.length === 0) return
    setFormData((prev) => ({ ...prev, id_proceso: procesos[0].id_proceso }))
  }, [procesos, formData.id_proceso])

  useEffect(() => {
    if (!open) return
    if (formData.id_organizacion > 0) return
    if (organizaciones.length === 0) return
    setFormData((prev) => ({
      ...prev,
      id_organizacion: Number((organizaciones[0] as any).id),
      id_empresa_sucursal: null,
    }))
  }, [open, organizaciones, formData.id_organizacion])

  useEffect(() => {
    if (formData.id_organizacion <= 0) return

    if (sucursalesDeOrganizacion.length === 0) {
      if (formData.id_empresa_sucursal !== null) {
        setFormData((prev) => ({ ...prev, id_empresa_sucursal: null }))
      }
      return
    }

    const hasCurrent = sucursalesDeOrganizacion.some(
      (b: any) => Number(b.id) === Number(formData.id_empresa_sucursal),
    )

    if (!hasCurrent) {
      setFormData((prev) => ({
        ...prev,
        id_empresa_sucursal: Number((sucursalesDeOrganizacion[0] as any).id),
      }))
    }
  }, [formData.id_organizacion, formData.id_empresa_sucursal, sucursalesDeOrganizacion])

  const resetForm = () => {
    setFormData(defaultFormData())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre_instalacion.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la instalación es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (!formData.id_organizacion || formData.id_organizacion <= 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar una organización",
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

    if (!formData.id_proceso || formData.id_proceso <= 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar un proceso",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const payload: Omit<Instalacion, "id_instalacion"> = {
        id_empresa_sucursal: formData.id_empresa_sucursal ?? undefined,
        id_organizacion: formData.id_organizacion,
        nombre_instalacion: formData.nombre_instalacion.trim(),
        codigo_instalacion: formData.codigo_instalacion.trim() || undefined,
        fecha_instalacion: formData.fecha_instalacion,
        estado_operativo: formData.estado_operativo,
        descripcion: formData.descripcion.trim(),
        tipo_uso: formData.tipo_uso,
        id_proceso: formData.id_proceso,
        ubicacion: formData.ubicacion.trim() || undefined,
        latitud: parseOptionalNumber(formData.latitud),
        longitud: parseOptionalNumber(formData.longitud),
        capacidad_maxima: parseOptionalNumber(formData.capacidad_maxima),
        capacidad_actual: parseOptionalNumber(formData.capacidad_actual),
        responsable_operativo: formData.responsable_operativo.trim() || undefined,
        contacto_emergencia: formData.contacto_emergencia.trim() || undefined,
      }

      await onAddInstalacion(payload)

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

  const handleInputChange = <K extends keyof InstalacionFormData>(field: K, value: InstalacionFormData[K]) => {
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
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Instalación</DialogTitle>
          <DialogDescription>Completa los datos operativos para crear una instalación conectada al monitoreo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="id_organizacion">Organización *</Label>
                <Select
                  value={formData.id_organizacion > 0 ? String(formData.id_organizacion) : "none"}
                  onValueChange={(value) => handleInputChange("id_organizacion", Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBranches ? "Cargando organizaciones..." : "Seleccionar organización"} />
                  </SelectTrigger>
                  <SelectContent>
                    {organizaciones.length > 0 ? (
                      organizaciones.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.nombre || b.name || `Organización ${b.id}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {loadingBranches ? "Cargando..." : "No hay organizaciones"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="id_proceso">Proceso *</Label>
                <Select
                  value={formData.id_proceso > 0 ? String(formData.id_proceso) : "none"}
                  onValueChange={(value) => handleInputChange("id_proceso", Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProcesos ? "Cargando procesos..." : "Seleccionar proceso"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProcesos ? (
                      <SelectItem value="none" disabled>
                        Cargando...
                      </SelectItem>
                    ) : procesos.length > 0 ? (
                      procesos.map((proceso) => (
                        <SelectItem key={proceso.id_proceso} value={String(proceso.id_proceso)}>
                          {proceso.nombre_proceso || proceso.nombre || `Proceso ${proceso.id_proceso}`}
                          {proceso.nombre_especie ? ` • ${proceso.nombre_especie}` : ""}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No hay procesos disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="id_empresa_sucursal">Sucursal (opcional)</Label>
              <Select
                value={formData.id_empresa_sucursal != null ? String(formData.id_empresa_sucursal) : "auto"}
                onValueChange={(value) =>
                  handleInputChange("id_empresa_sucursal", value === "auto" ? null : Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Asignar automáticamente</SelectItem>
                  {sucursalesDeOrganizacion.map((b: any) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.nombre || b.name || `Sucursal ${b.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si no seleccionas sucursal, la instalación usará la principal de la organización.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="codigo_instalacion">Código interno</Label>
                <Input
                  id="codigo_instalacion"
                  value={formData.codigo_instalacion}
                  onChange={(e) => handleInputChange("codigo_instalacion", e.target.value)}
                  placeholder="Ej: INS-A1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha_instalacion">Fecha de instalación *</Label>
                <Input
                  id="fecha_instalacion"
                  type="date"
                  value={formData.fecha_instalacion}
                  onChange={(e) => handleInputChange("fecha_instalacion", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="estado_operativo">Estado *</Label>
                <Select
                  value={formData.estado_operativo}
                  onValueChange={(value) => handleInputChange("estado_operativo", value as "activo" | "inactivo")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tipo_uso">Tipo de uso *</Label>
                <Select
                  value={formData.tipo_uso}
                  onValueChange={(value) => handleInputChange("tipo_uso", value as "acuicultura" | "tratamiento" | "otros")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acuicultura">Acuicultura</SelectItem>
                    <SelectItem value="tratamiento">Tratamiento</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleInputChange("descripcion", e.target.value)}
                placeholder="Descripción de la instalación y su uso operativo"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ubicacion">Ubicación / dirección</Label>
                <Input
                  id="ubicacion"
                  value={formData.ubicacion}
                  onChange={(e) => handleInputChange("ubicacion", e.target.value)}
                  placeholder="Ej: Nave 2, zona norte"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="latitud">Latitud</Label>
                  <Input
                    id="latitud"
                    type="number"
                    step="0.0000001"
                    value={formData.latitud}
                    onChange={(e) => handleInputChange("latitud", e.target.value)}
                    placeholder="17.9869000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitud">Longitud</Label>
                  <Input
                    id="longitud"
                    type="number"
                    step="0.0000001"
                    value={formData.longitud}
                    onChange={(e) => handleInputChange("longitud", e.target.value)}
                    placeholder="-92.9303000"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="capacidad_maxima">Capacidad máxima</Label>
                <Input
                  id="capacidad_maxima"
                  type="number"
                  step="0.01"
                  value={formData.capacidad_maxima}
                  onChange={(e) => handleInputChange("capacidad_maxima", e.target.value)}
                  placeholder="Ej: 1200"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="capacidad_actual">Capacidad actual</Label>
                <Input
                  id="capacidad_actual"
                  type="number"
                  step="0.01"
                  value={formData.capacidad_actual}
                  onChange={(e) => handleInputChange("capacidad_actual", e.target.value)}
                  placeholder="Ej: 860"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="responsable_operativo">Responsable operativo</Label>
                <Input
                  id="responsable_operativo"
                  value={formData.responsable_operativo}
                  onChange={(e) => handleInputChange("responsable_operativo", e.target.value)}
                  placeholder="Nombre del responsable"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contacto_emergencia">Contacto de emergencia</Label>
                <Input
                  id="contacto_emergencia"
                  value={formData.contacto_emergencia}
                  onChange={(e) => handleInputChange("contacto_emergencia", e.target.value)}
                  placeholder="Teléfono o extensión"
                />
              </div>
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
