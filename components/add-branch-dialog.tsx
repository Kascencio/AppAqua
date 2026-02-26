"use client"

import type React from "react"
import { useState } from "react"
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

interface AddBranchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBranch: (branch: Omit<EmpresaSucursal, "id_empresa_sucursal" | "fecha_registro">) => void
}

export default function AddBranchDialog({ open, onOpenChange, onAddBranch }: AddBranchDialogProps) {
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<"empresa" | "sucursal">("sucursal")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [calle, setCalle] = useState("")
  const [numeroIntExt, setNumeroIntExt] = useState("")
  const [referencia, setReferencia] = useState("")
  const [latitud, setLatitud] = useState("")
  const [longitud, setLongitud] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newBranch: Omit<EmpresaSucursal, "id_empresa_sucursal" | "fecha_registro"> = {
      id_padre: tipo === "sucursal" ? 1 : null,
      nombre,
      tipo,
      telefono: telefono || null,
      email: email || null,
      estado_operativo: "activa",
      // Estos IDs deben existir en tu base; usamos valores seed por defecto
      id_estado: 1,
      id_cp: 1,
      id_colonia: 1,
      calle,
      numero_int_ext: numeroIntExt || null,
      referencia: referencia || null,
      latitud: latitud ? Number(latitud) : null,
      longitud: longitud ? Number(longitud) : null,
    }

    onAddBranch(newBranch)

    // Reset form
    setNombre("")
    setTipo("sucursal")
    setTelefono("")
    setEmail("")
    setCalle("")
    setNumeroIntExt("")
    setReferencia("")
    setLatitud("")
    setLongitud("")
    onOpenChange(false)
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
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="add-tipo">Tipo *</Label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="add-telefono">Teléfono</Label>
              <Input
                id="add-telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +52 993 123 4567"
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
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="add-numero">Número Interior/Exterior</Label>
            <Input
              id="add-numero"
              value={numeroIntExt}
              onChange={(e) => setNumeroIntExt(e.target.value)}
              placeholder="Ej: Local 2, Edificio A"
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
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
