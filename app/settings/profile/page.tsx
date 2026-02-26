"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Shield, Save } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function ProfileSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    notes: "",
  })

  const roleLabel = useMemo(() => {
    switch (user?.role) {
      case "superadmin":
        return "Superadmin"
      case "admin":
        return "Administrador"
      default:
        return "Operador / Usuario"
    }
  }, [user?.role])

  const handleSave = () => {
    toast({
      title: "Perfil actualizado",
      description: "Los cambios locales fueron guardados. Puedes conectar persistencia API después.",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Perfil</h1>
        <p className="text-muted-foreground">Actualiza datos de contacto y preferencias del usuario actual.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Datos de Usuario
          </CardTitle>
          <CardDescription>Información visible en paneles y reportes operativos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3.5 w-3.5" />
              {roleLabel}
            </Badge>
            {user?.status && <Badge variant="outline">Estado: {user.status}</Badge>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nombre completo</Label>
              <Input
                id="profile-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Correo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="profile-email"
                  className="pl-9"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@dominio.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="profile-phone"
                  className="pl-9"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+52 999 000 0000"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-notes">Notas operativas</Label>
            <Textarea
              id="profile-notes"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas para coordinación entre administradores y operación"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
