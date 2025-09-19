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
import { X } from "lucide-react"
import type { EmpresaSucursal } from "@/types/empresa-sucursal"

interface EditBranchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditBranch: (branch: EmpresaSucursal) => void
  branch: EmpresaSucursal | null
}

export default function EditBranchDialog({ open, onOpenChange, onEditBranch, branch }: EditBranchDialogProps) {
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<"empresa" | "sucursal">("sucursal")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [calle, setCalle] = useState("")
  const [numeroIntExt, setNumeroIntExt] = useState("")
  const [referencia, setReferencia] = useState("")
  const [estadoOperativo, setEstadoOperativo] = useState<"activa" | "inactiva">("activa")

  useEffect(() => {
    if (branch) {
      setNombre(branch.nombre)
      setTipo(branch.tipo)
      setTelefono(branch.telefono || "")
      setEmail(branch.email || "")
      setCalle(branch.calle)
      setNumeroIntExt(branch.numero_int_ext || "")
      setReferencia(branch.referencia || "")
      setEstadoOperativo(branch.estado_operativo)
    }
  }, [branch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!branch) {
      return
    }

    const updatedBranch: EmpresaSucursal = {
      ...branch,
      nombre,
      tipo,
      telefono: telefono || null,
      email: email || null,
      calle,
      numero_int_ext: numeroIntExt || null,
      referencia: referencia || null,
      estado_operativo: estadoOperativo,
    }

    onEditBranch(updatedBranch)
    onOpenChange(false)
  }

  if (!branch) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Editar {branch.tipo === "empresa" ? "Empresa" : "Sucursal"}</DialogTitle>
              <DialogDescription>Modifique los datos según sea necesario.</DialogDescription>
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
            <Label htmlFor="edit-nombre">Nombre *</Label>
            <Input
              id="edit-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Sucursal Norte"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-tipo">Tipo *</Label>
            <Select value={tipo} onValueChange={(value) => setTipo(value as "empresa" | "sucursal")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="sucursal">Sucursal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-estado">Estado Operativo *</Label>
            <Select
              value={estadoOperativo}
              onValueChange={(value) => setEstadoOperativo(value as "activa" | "inactiva")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="inactiva">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +52 993 123 4567"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej: contacto@empresa.com"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-calle">Dirección *</Label>
            <Input
              id="edit-calle"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Ej: Av. Principal 123"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-numero">Número Interior/Exterior</Label>
            <Input
              id="edit-numero"
              value={numeroIntExt}
              onChange={(e) => setNumeroIntExt(e.target.value)}
              placeholder="Ej: Local 2, Edificio A"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-referencia">Referencia</Label>
            <Textarea
              id="edit-referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: Frente al parque central"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
