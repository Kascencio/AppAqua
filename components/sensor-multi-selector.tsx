"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Activity, Thermometer, Droplets, Waves, Eye, Zap, Gauge } from "lucide-react"

interface Sensor {
  id: string
  name: string
  facilityId: string
  parameters: string[]
  status: "active" | "inactive" | "maintenance"
}

interface SensorMultiSelectorProps {
  sensors: Sensor[]
  selectedSensors: string[]
  onSensorsChange: (sensorIds: string[]) => void
}

const parameterIcons: Record<string, React.ReactNode> = {
  temperature: <Thermometer className="h-4 w-4" />,
  ph: <Droplets className="h-4 w-4" />,
  oxygen: <Activity className="h-4 w-4" />,
  salinity: <Waves className="h-4 w-4" />,
  turbidity: <Eye className="h-4 w-4" />,
  nitrates: <Zap className="h-4 w-4" />,
  ammonia: <Gauge className="h-4 w-4" />,
}

const parameterNames: Record<string, string> = {
  temperature: "Temperatura",
  ph: "pH",
  oxygen: "Oxígeno",
  salinity: "Salinidad",
  turbidity: "Turbidez",
  nitrates: "Nitratos",
  ammonia: "Amonio",
}

export function SensorMultiSelector({ sensors, selectedSensors, onSensorsChange }: SensorMultiSelectorProps) {
  const handleSensorToggle = (sensorId: string) => {
    const isSelected = selectedSensors.includes(sensorId)
    if (isSelected) {
      onSensorsChange(selectedSensors.filter((id) => id !== sensorId))
    } else {
      onSensorsChange([...selectedSensors, sensorId])
    }
  }

  const handleSelectAll = () => {
    const activeSensors = sensors.filter((s) => s.status === "active").map((s) => s.id)
    onSensorsChange(activeSensors)
  }

  const handleClearAll = () => {
    onSensorsChange([])
  }

  const activeSensors = sensors.filter((s) => s.status === "active")
  const selectedParameters = new Set(sensors.filter((s) => selectedSensors.includes(s.id)).flatMap((s) => s.parameters))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Sensores Disponibles</CardTitle>
            <CardDescription>
              {selectedSensors.length} de {activeSensors.length} sensores seleccionados
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Seleccionar todos
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Limpiar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parámetros seleccionados */}
        {selectedParameters.size > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Parámetros a monitorear:</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedParameters).map((param) => (
                <Badge key={param} variant="secondary" className="flex items-center gap-1">
                  {parameterIcons[param]}
                  {parameterNames[param] || param}
                </Badge>
              ))}
            </div>
            <Separator className="mt-3" />
          </div>
        )}

        {/* Lista de sensores */}
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {activeSensors.map((sensor) => (
              <div
                key={sensor.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={sensor.id}
                  checked={selectedSensors.includes(sensor.id)}
                  onCheckedChange={() => handleSensorToggle(sensor.id)}
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={sensor.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {sensor.name}
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    {sensor.parameters.map((param) => (
                      <div key={param} className="flex items-center gap-1 text-xs text-muted-foreground">
                        {parameterIcons[param]}
                        <span>{parameterNames[param] || param}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Badge variant={sensor.status === "active" ? "default" : "secondary"} className="text-xs">
                  {sensor.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>

        {activeSensors.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay sensores activos disponibles</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
