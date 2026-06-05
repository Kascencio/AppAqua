"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogClose,
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
import { X, Loader2 } from "lucide-react"
import type { EmpresaSucursal } from "@/types/empresa-sucursal"
import { api } from "@/lib/api"

interface AddBranchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBranch: (branch: Omit<EmpresaSucursal, "id_empresa_sucursal" | "fecha_registro">) => void | Promise<void>
}

export default function AddBranchDialog({ open, onOpenChange, onAddBranch }: AddBranchDialogProps) {
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<"empresa" | "sucursal">("sucursal")
  const [idPadre, setIdPadre] = useState<string>("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [calle, setCalle] = useState("")
  const [numeroIntExt, setNumeroIntExt] = useState("")
  const [referencia, setReferencia] = useState("")
  const [latitud, setLatitud] = useState("")
  const [longitud, setLongitud] = useState("")
  const [saving, setSaving] = useState(false)
  const [organizaciones, setOrganizaciones] = useState<Array<{ id_organizacion: number; nombre: string }>>([])

  // Cargar organizaciones cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      api.get<any[]>('/api/organizaciones')
        .then((orgs) => {
          const mapped = orgs.map((org: any) => ({
            id_organizacion: org.id_organizacion,
            nombre: org.nombre,
          }))
          setOrganizaciones(mapped)
          // Auto-seleccionar la primera organización si hay alguna
          if (mapped.length > 0 && !idPadre) {
            setIdPadre(String(mapped[0].id_organizacion))
          }
        })
        .catch(() => {
          setOrganizaciones([])
        })
    }
  }, [open])

  const resetForm = () => {
    setNombre("")
    setTipo("sucursal")
    setIdPadre("")
    setTelefono("")
    setEmail("")
    setCalle("")
    setNumeroIntExt("")
    setReferencia("")
    setLatitud("")
    setLongitud("")
    setSaving(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const newBranch: Omit<EmpresaSucursal, "id_empresa_sucursal" | "fecha_registro"> = {
      id_padre: tipo === "sucursal" ? (idPadre ? Number(idPadre) : null) : null,
      nombre,
      tipo,
      telefono: telefono || null,
      email: email || null,
      estado_operativo: "activa",
      id_estado: 0,
      id_cp: 0,
      id_colonia: 0,
      calle,
      numero_int_ext: numeroIntExt || null,
      referencia: referencia || null,
      latitud: latitud ? Number(latitud) : null,
      longitud: longitud ? Number(longitud) : null,
    }

    try {
      await onAddBranch(newBranch)
      resetForm()
      onOpenChange(false)
    } catch {
      // Error ya manejado por toast en el hook
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Agregar Nueva Empresa/Sucursal</DialogTitle>
              <DialogDescription>Complete los datos para registrar una nueva empresa o sucursal.</DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="add-nombre">Nombre *</Label>
            <Input
              id="add-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Sucursal Norte"
              required
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="add-tipo">Tipo *</Label>
            <Select value={tipo} onValueChange={(value) => setTipo(value as "empresa" | "sucursal")} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="sucursal">Sucursal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipo === "sucursal" && (
            <div className="grid gap-2">
              <Label htmlFor="add-organizacion">Organización Padre *</Label>
              {organizaciones.length > 0 ? (
                <Select value={idPadre} onValueChange={setIdPadre} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizaciones.map((org) => (
                      <SelectItem key={org.id_organizacion} value={String(org.id_organizacion)}>
                        {org.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay organizaciones disponibles. Cree primero una empresa.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="add-telefono">Teléfono</Label>
              <Input
                id="add-telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +52 993 123 4567"
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej: contacto@empresa.com"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="add-calle">Dirección *</Label>
            <Input
              id="add-calle"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Ej: Av. Principal 123"
              required
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="add-numero">Número Interior/Exterior</Label>
            <Input
              id="add-numero"
              value={numeroIntExt}
              onChange={(e) => setNumeroIntExt(e.target.value)}
              placeholder="Ej: Local 2, Edificio A"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="add-referencia">Referencia</Label>
            <Textarea
              id="add-referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: Frente al parque central"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="add-latitud">Latitud</Label>
              <Input
                id="add-latitud"
                type="number"
                step="0.0000001"
                value={latitud}
                onChange={(e) => setLatitud(e.target.value)}
                placeholder="17.9869000"
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add-longitud">Longitud</Label>
              <Input
                id="add-longitud"
                type="number"
                step="0.0000001"
                value={longitud}
                onChange={(e) => setLongitud(e.target.value)}
                placeholder="-92.9303000"
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || (tipo === "sucursal" && (!idPadre || organizaciones.length === 0))}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
