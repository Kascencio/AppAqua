"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
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

interface EditInstalacionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instalacion: Instalacion | null
  onEditInstalacion: (instalacion: Instalacion) => Promise<void>
}

function toStringOrEmpty(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value)
}

export function EditInstalacionDialog({ open, onOpenChange, instalacion, onEditInstalacion }: EditInstalacionDialogProps) {
  const { toast } = useToast()
  const { branches, loading: loadingBranches, reload } = useBranches()
  const [loading, setLoading] = useState(false)
  const [loadingProcesos, setLoadingProcesos] = useState(false)
  const [procesos, setProcesos] = useState<ProcesoOption[]>([])

  const organizaciones = useMemo(
    () => (Array.isArray(branches) ? branches.filter((b: any) => b?.tipo === "empresa") : []),
    [branches],
  )

  const sucursales = useMemo(
    () => (Array.isArray(branches) ? branches.filter((b: any) => b?.tipo === "sucursal") : []),
    [branches],
  )

  const emptyForm: Instalacion = useMemo(
    () => ({
      id_instalacion: 0,
      id_empresa_sucursal: undefined,
      id_organizacion: undefined,
      nombre_instalacion: "",
      codigo_instalacion: "",
      fecha_instalacion: new Date().toISOString().split("T")[0],
      estado_operativo: "activo",
      descripcion: "",
      tipo_uso: "acuicultura",
      id_proceso: 1,
      ubicacion: "",
      latitud: undefined,
      longitud: undefined,
      capacidad_maxima: undefined,
      capacidad_actual: undefined,
      responsable_operativo: "",
      contacto_emergencia: "",
    }),
    [],
  )

  const [formData, setFormData] = useState<Instalacion>(emptyForm)

  useEffect(() => {
    if (instalacion) {
      setFormData({
        ...emptyForm,
        ...instalacion,
        codigo_instalacion: instalacion.codigo_instalacion || (instalacion as any).codigo || "",
        id_organizacion:
          instalacion.id_organizacion ??
          (branches.find((b: any) => Number(b.id) === Number(instalacion.id_empresa_sucursal)) as any)?.id_padre ??
          undefined,
      })
    } else {
      setFormData(emptyForm)
    }
  }, [instalacion, emptyForm, branches])

  useEffect(() => {
    if (!open) return

    let isMounted = true
    const loadProcesos = async () => {
      try {
        await reload()
      } catch {
        // No bloquea la edición de instalación.
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
    const currentBranchId = Number(formData.id_empresa_sucursal ?? 0)
    if (!currentBranchId || currentBranchId >= 10000) return

    const mapped = sucursales.find((b: any) => Number(b.id) - 10000 === currentBranchId)
    if (!mapped) return

    setFormData((prev) => ({
      ...prev,
      id_empresa_sucursal: Number((mapped as any).id),
    }))
  }, [formData.id_empresa_sucursal, sucursales])

  const sucursalesDeOrganizacion = useMemo(() => {
    const orgId = Number(formData.id_organizacion ?? 0)
    if (!orgId) return []
    return sucursales.filter((b: any) => Number(b?.id_padre ?? 0) === orgId)
  }, [sucursales, formData.id_organizacion])

  useEffect(() => {
    if (!open) return
    if (formData.id_organizacion && formData.id_organizacion > 0) return

    const inferredOrg = sucursales.find(
      (b: any) =>
        Number(b.id) === Number(formData.id_empresa_sucursal ?? 0) ||
        Number(b.id) - 10000 === Number(formData.id_empresa_sucursal ?? 0),
    )?.id_padre

    if (Number(inferredOrg) > 0) {
      setFormData((prev) => ({ ...prev, id_organizacion: Number(inferredOrg) }))
      return
    }

    if (organizaciones.length > 0) {
      setFormData((prev) => ({ ...prev, id_organizacion: Number((organizaciones[0] as any).id) }))
    }
  }, [open, formData.id_organizacion, formData.id_empresa_sucursal, sucursales, organizaciones])

  useEffect(() => {
    const orgId = Number(formData.id_organizacion ?? 0)
    if (!orgId) return

    if (sucursalesDeOrganizacion.length === 0) {
      if (formData.id_empresa_sucursal !== undefined) {
        setFormData((prev) => ({ ...prev, id_empresa_sucursal: undefined }))
      }
      return
    }

    const hasCurrent = sucursalesDeOrganizacion.some(
      (b: any) =>
        Number(b.id) === Number(formData.id_empresa_sucursal ?? 0) ||
        Number(b.id) - 10000 === Number(formData.id_empresa_sucursal ?? 0),
    )
    if (!hasCurrent) {
      setFormData((prev) => ({
        ...prev,
        id_empresa_sucursal: Number((sucursalesDeOrganizacion[0] as any).id),
      }))
    }
  }, [formData.id_organizacion, formData.id_empresa_sucursal, sucursalesDeOrganizacion])

  const handleInputChange = <K extends keyof Instalacion>(field: K, value: Instalacion[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNumberChange = (field: keyof Instalacion, value: string) => {
    const parsed = value.trim() === "" ? undefined : Number(value)
    handleInputChange(field, Number.isFinite(parsed as number) ? (parsed as any) : (undefined as any))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instalacion) return

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
      await onEditInstalacion(formData)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar instalación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Instalación</DialogTitle>
          <DialogDescription>Actualiza información operativa, ubicación y capacidad de la instalación.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-id_organizacion">Organización *</Label>
                <Select
                  value={formData.id_organizacion && formData.id_organizacion > 0 ? String(formData.id_organizacion) : "none"}
                  onValueChange={(value) => handleInputChange("id_organizacion", Number(value))}
                  disabled={!instalacion}
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
                <Label htmlFor="edit-id_proceso">Proceso *</Label>
                <Select
                  value={formData.id_proceso > 0 ? String(formData.id_proceso) : "none"}
                  onValueChange={(value) => handleInputChange("id_proceso", Number(value))}
                  disabled={!instalacion}
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
              <Label htmlFor="edit-id_empresa_sucursal">Sucursal (opcional)</Label>
              <Select
                value={formData.id_empresa_sucursal ? String(formData.id_empresa_sucursal) : "auto"}
                onValueChange={(value) =>
                  handleInputChange("id_empresa_sucursal", value === "auto" ? undefined : Number(value))
                }
                disabled={!instalacion}
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
                Si no seleccionas sucursal, se usará la principal de la organización.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-nombre_instalacion">Nombre de la Instalación *</Label>
                <Input
                  id="edit-nombre_instalacion"
                  value={formData.nombre_instalacion}
                  onChange={(e) => handleInputChange("nombre_instalacion", e.target.value)}
                  required
                  disabled={!instalacion}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-codigo_instalacion">Código interno</Label>
                <Input
                  id="edit-codigo_instalacion"
                  value={toStringOrEmpty(formData.codigo_instalacion)}
                  onChange={(e) => handleInputChange("codigo_instalacion", e.target.value)}
                  disabled={!instalacion}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-fecha_instalacion">Fecha de Instalación *</Label>
                <Input
                  id="edit-fecha_instalacion"
                  type="date"
                  value={formData.fecha_instalacion}
                  onChange={(e) => handleInputChange("fecha_instalacion", e.target.value)}
                  required
                  disabled={!instalacion}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-tipo_uso">Tipo de Uso *</Label>
                <Select
                  value={formData.tipo_uso}
                  onValueChange={(value) => handleInputChange("tipo_uso", value as any)}
                  disabled={!instalacion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de uso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acuicultura">Acuicultura</SelectItem>
                    <SelectItem value="tratamiento">Tratamiento</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-estado_operativo">Estado Operativo *</Label>
                <Select
                  value={formData.estado_operativo}
                  onValueChange={(value) => handleInputChange("estado_operativo", value as any)}
                  disabled={!instalacion}
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-descripcion">Descripción *</Label>
              <Textarea
                id="edit-descripcion"
                value={formData.descripcion}
                onChange={(e) => handleInputChange("descripcion", e.target.value)}
                rows={3}
                required
                disabled={!instalacion}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-ubicacion">Ubicación / dirección</Label>
                <Input
                  id="edit-ubicacion"
                  value={toStringOrEmpty(formData.ubicacion)}
                  onChange={(e) => handleInputChange("ubicacion", e.target.value)}
                  disabled={!instalacion}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-latitud">Latitud</Label>
                  <Input
                    id="edit-latitud"
                    type="number"
                    step="0.0000001"
                    value={toStringOrEmpty(formData.latitud)}
                    onChange={(e) => handleNumberChange("latitud", e.target.value)}
                    disabled={!instalacion}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-longitud">Longitud</Label>
                  <Input
                    id="edit-longitud"
                    type="number"
                    step="0.0000001"
                    value={toStringOrEmpty(formData.longitud)}
                    onChange={(e) => handleNumberChange("longitud", e.target.value)}
                    disabled={!instalacion}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-capacidad_maxima">Capacidad máxima</Label>
                <Input
                  id="edit-capacidad_maxima"
                  type="number"
                  step="0.01"
                  value={toStringOrEmpty(formData.capacidad_maxima)}
                  onChange={(e) => handleNumberChange("capacidad_maxima", e.target.value)}
                  disabled={!instalacion}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-capacidad_actual">Capacidad actual</Label>
                <Input
                  id="edit-capacidad_actual"
                  type="number"
                  step="0.01"
                  value={toStringOrEmpty(formData.capacidad_actual)}
                  onChange={(e) => handleNumberChange("capacidad_actual", e.target.value)}
                  disabled={!instalacion}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-responsable_operativo">Responsable operativo</Label>
                <Input
                  id="edit-responsable_operativo"
                  value={toStringOrEmpty(formData.responsable_operativo)}
                  onChange={(e) => handleInputChange("responsable_operativo", e.target.value)}
                  disabled={!instalacion}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-contacto_emergencia">Contacto de emergencia</Label>
                <Input
                  id="edit-contacto_emergencia"
                  value={toStringOrEmpty(formData.contacto_emergencia)}
                  onChange={(e) => handleInputChange("contacto_emergencia", e.target.value)}
                  disabled={!instalacion}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !instalacion}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
