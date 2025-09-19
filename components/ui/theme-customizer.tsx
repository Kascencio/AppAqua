"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Palette, Monitor, Smartphone, Tablet, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeConfig {
  primaryColor: string
  accentColor: string
  borderRadius: number
  fontSize: number
  density: "compact" | "comfortable" | "spacious"
  animations: boolean
  reducedMotion: boolean
  highContrast: boolean
  colorBlindFriendly: boolean
}

const colorPresets = [
  { name: "Azul Océano", primary: "#0ea5e9", accent: "#06b6d4" },
  { name: "Verde Aqua", primary: "#10b981", accent: "#059669" },
  { name: "Púrpura", primary: "#8b5cf6", accent: "#7c3aed" },
  { name: "Naranja", primary: "#f59e0b", accent: "#d97706" },
  { name: "Rosa", primary: "#ec4899", accent: "#db2777" },
  { name: "Índigo", primary: "#6366f1", accent: "#4f46e5" },
]

export function ThemeCustomizer() {
  const [config, setConfig] = React.useState<ThemeConfig>({
    primaryColor: "#0ea5e9",
    accentColor: "#06b6d4",
    borderRadius: 8,
    fontSize: 14,
    density: "comfortable",
    animations: true,
    reducedMotion: false,
    highContrast: false,
    colorBlindFriendly: false,
  })

  const [previewDevice, setPreviewDevice] = React.useState<"desktop" | "tablet" | "mobile">("desktop")

  // Aplicar configuración al documento
  React.useEffect(() => {
    const root = document.documentElement

    // Colores
    root.style.setProperty("--primary", config.primaryColor)
    root.style.setProperty("--accent", config.accentColor)

    // Border radius
    root.style.setProperty("--radius", `${config.borderRadius}px`)

    // Font size
    root.style.setProperty("--font-size-base", `${config.fontSize}px`)

    // Density
    const densityMap = {
      compact: "0.75",
      comfortable: "1",
      spacious: "1.25",
    }
    root.style.setProperty("--spacing-scale", densityMap[config.density])

    // Animations
    root.style.setProperty("--animation-duration", config.animations ? "0.2s" : "0s")

    // Reduced motion
    if (config.reducedMotion) {
      root.style.setProperty("--animation-duration", "0s")
      root.style.setProperty("--transition-duration", "0s")
    }

    // High contrast
    if (config.highContrast) {
      root.style.setProperty("--contrast-multiplier", "1.5")
    } else {
      root.style.setProperty("--contrast-multiplier", "1")
    }

    // Color blind friendly
    if (config.colorBlindFriendly) {
      root.classList.add("colorblind-friendly")
    } else {
      root.classList.remove("colorblind-friendly")
    }
  }, [config])

  // Guardar configuración en localStorage
  React.useEffect(() => {
    localStorage.setItem("aquamonitor-theme-config", JSON.stringify(config))
  }, [config])

  // Cargar configuración guardada
  React.useEffect(() => {
    const saved = localStorage.getItem("aquamonitor-theme-config")
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading theme config:", error)
      }
    }
  }, [])

  const updateConfig = (updates: Partial<ThemeConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  const resetToDefaults = () => {
    setConfig({
      primaryColor: "#0ea5e9",
      accentColor: "#06b6d4",
      borderRadius: 8,
      fontSize: 14,
      density: "comfortable",
      animations: true,
      reducedMotion: false,
      highContrast: false,
      colorBlindFriendly: false,
    })
  }

  const getDevicePreviewClass = () => {
    switch (previewDevice) {
      case "mobile":
        return "max-w-sm mx-auto"
      case "tablet":
        return "max-w-2xl mx-auto"
      default:
        return "w-full"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalización de Tema
          </CardTitle>
          <CardDescription>Personaliza la apariencia de AquaMonitor según tus preferencias</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors">Colores</TabsTrigger>
              <TabsTrigger value="layout">Diseño</TabsTrigger>
              <TabsTrigger value="accessibility">Accesibilidad</TabsTrigger>
              <TabsTrigger value="preview">Vista Previa</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Presets de Color</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {colorPresets.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-start gap-2"
                        onClick={() =>
                          updateConfig({
                            primaryColor: preset.primary,
                            accentColor: preset.accent,
                          })
                        }
                      >
                        <div className="flex gap-2">
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: preset.primary }} />
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <span className="text-sm">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Color Primario</Label>
                    <div className="flex gap-2">
                      <input
                        id="primary-color"
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                        className="w-12 h-10 rounded border"
                      />
                      <div className="flex-1 p-2 border rounded bg-muted text-sm font-mono">{config.primaryColor}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Color de Acento</Label>
                    <div className="flex gap-2">
                      <input
                        id="accent-color"
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => updateConfig({ accentColor: e.target.value })}
                        className="w-12 h-10 rounded border"
                      />
                      <div className="flex-1 p-2 border rounded bg-muted text-sm font-mono">{config.accentColor}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Radio de Bordes: {config.borderRadius}px</Label>
                  <Slider
                    value={[config.borderRadius]}
                    onValueChange={([value]) => updateConfig({ borderRadius: value })}
                    max={20}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tamaño de Fuente: {config.fontSize}px</Label>
                  <Slider
                    value={[config.fontSize]}
                    onValueChange={([value]) => updateConfig({ fontSize: value })}
                    max={18}
                    min={12}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Densidad de la Interfaz</Label>
                  <Select
                    value={config.density}
                    onValueChange={(value: ThemeConfig["density"]) => updateConfig({ density: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compacta</SelectItem>
                      <SelectItem value="comfortable">Cómoda</SelectItem>
                      <SelectItem value="spacious">Espaciosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animaciones</Label>
                    <div className="text-sm text-muted-foreground">Habilitar transiciones y animaciones</div>
                  </div>
                  <Switch
                    checked={config.animations}
                    onCheckedChange={(checked) => updateConfig({ animations: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="accessibility" className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Movimiento Reducido</Label>
                    <div className="text-sm text-muted-foreground">
                      Desactiva animaciones para usuarios sensibles al movimiento
                    </div>
                  </div>
                  <Switch
                    checked={config.reducedMotion}
                    onCheckedChange={(checked) => updateConfig({ reducedMotion: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alto Contraste</Label>
                    <div className="text-sm text-muted-foreground">Aumenta el contraste para mejor legibilidad</div>
                  </div>
                  <Switch
                    checked={config.highContrast}
                    onCheckedChange={(checked) => updateConfig({ highContrast: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Amigable para Daltonismo</Label>
                    <div className="text-sm text-muted-foreground">Usa patrones y formas además de colores</div>
                  </div>
                  <Switch
                    checked={config.colorBlindFriendly}
                    onCheckedChange={(checked) => updateConfig({ colorBlindFriendly: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Vista Previa del Dispositivo</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={previewDevice === "desktop" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewDevice("desktop")}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewDevice === "tablet" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewDevice("tablet")}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewDevice === "mobile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewDevice("mobile")}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Vista previa */}
                <div className={cn("border rounded-lg p-4 bg-background", getDevicePreviewClass())}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">AquaMonitor Dashboard</h3>
                      <Badge>Vista Previa</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Sensor pH</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold" style={{ color: config.primaryColor }}>
                            7.2
                          </div>
                          <div className="text-sm text-muted-foreground">Óptimo</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Temperatura</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold" style={{ color: config.accentColor }}>
                            24°C
                          </div>
                          <div className="text-sm text-muted-foreground">Normal</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" style={{ backgroundColor: config.primaryColor }}>
                        Acción Primaria
                      </Button>
                      <Button variant="outline" size="sm">
                        Acción Secundaria
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar Valores por Defecto
            </Button>
            <Button onClick={() => window.location.reload()}>Aplicar Cambios</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
