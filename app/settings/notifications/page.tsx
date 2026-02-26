"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Bell, MessageSquare, Send, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NotificationSettingsPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState({
    realtimeWebsocket: true,
    emailEnabled: false,
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
    minSeverity: "media",
  })

  const handleSave = () => {
    toast({
      title: "Configuración guardada",
      description: "Notificaciones actualizadas para esta sesión.",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Notificaciones</h1>
        <p className="text-muted-foreground">Controla canales en tiempo real y reglas para alertas críticas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canales Activos
          </CardTitle>
          <CardDescription>Activa los canales que usará el sistema para emitir alertas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>WebSocket en tiempo real</Label>
              <p className="text-sm text-muted-foreground">Notificaciones instantáneas dentro del dashboard.</p>
            </div>
            <Switch
              checked={config.realtimeWebsocket}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, realtimeWebsocket: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">Resumen de alertas por correo.</p>
            </div>
            <Switch
              checked={config.emailEnabled}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, emailEnabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Telegram Bot
              </Label>
              <p className="text-sm text-muted-foreground">Enviar alertas a un chat de operaciones.</p>
            </div>
            <Switch
              checked={config.telegramEnabled}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, telegramEnabled: checked }))}
            />
          </div>

          {config.telegramEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="telegram-token">Bot token</Label>
                <Input
                  id="telegram-token"
                  value={config.telegramBotToken}
                  onChange={(e) => setConfig((prev) => ({ ...prev, telegramBotToken: e.target.value }))}
                  placeholder="123456:ABC..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram-chat-id">Chat ID</Label>
                <Input
                  id="telegram-chat-id"
                  value={config.telegramChatId}
                  onChange={(e) => setConfig((prev) => ({ ...prev, telegramChatId: e.target.value }))}
                  placeholder="-1001234567890"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notification-severity" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Severidad mínima para disparar aviso
            </Label>
            <Input
              id="notification-severity"
              value={config.minSeverity}
              onChange={(e) => setConfig((prev) => ({ ...prev, minSeverity: e.target.value }))}
              placeholder="baja | media | alta | crítica"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar configuración
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
