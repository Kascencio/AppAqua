"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldAlert, Settings2, Database, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"

export default function SystemSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [config, setConfig] = useState({
    mantenimiento: false,
    retencionDias: "90",
    frecuenciaLecturaSegundos: "30",
    permitirRegistroPublico: false,
  })

  if (user?.role !== "superadmin") {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>Solo superadmin puede modificar configuración global del sistema.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleSave = () => {
    toast({
      title: "Parámetros guardados",
      description: "La configuración global fue actualizada para esta sesión.",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground">Ajustes globales para operación, retención de datos y disponibilidad.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Operación General
          </CardTitle>
          <CardDescription>Controles aplicados a todo el ecosistema de monitoreo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Modo mantenimiento</Label>
              <p className="text-sm text-muted-foreground">Restringe operaciones de escritura para mantenimiento.</p>
            </div>
            <Switch
              checked={config.mantenimiento}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, mantenimiento: checked }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retencion-dias" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Retención de lecturas (días)
              </Label>
              <Input
                id="retencion-dias"
                type="number"
                min={1}
                value={config.retencionDias}
                onChange={(e) => setConfig((prev) => ({ ...prev, retencionDias: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frecuencia-lectura">Frecuencia ingestión (segundos)</Label>
              <Input
                id="frecuencia-lectura"
                type="number"
                min={1}
                value={config.frecuenciaLecturaSegundos}
                onChange={(e) => setConfig((prev) => ({ ...prev, frecuenciaLecturaSegundos: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Permitir registro público</Label>
              <p className="text-sm text-muted-foreground">Habilita auto-registro de usuarios externos.</p>
            </div>
            <Switch
              checked={config.permitirRegistroPublico}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, permitirRegistroPublico: checked }))}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar parámetros
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
