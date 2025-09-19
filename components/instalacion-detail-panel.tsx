"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Thermometer, Fish, Plus, Trash2, Maximize2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { Instalacion, SensorInstalado, CatalogoSensor, Especie, Lectura } from "@/types"

// Componente para mostrar gráficas de parámetros
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface InstalacionDetailPanelProps {
  instalacion: Instalacion
  sensoresInstalados: SensorInstalado[]
  catalogoSensores: CatalogoSensor[]
  especies: Especie[]
  lecturas: Lectura[]
  onAddSensor: (sensorData: { id_instalacion: number; id_sensor: number; descripcion: string }) => void
  onRemoveSensor: (id: number) => void
}

// Función para formatear fechas de manera más compacta
const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A"
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return "N/A"
    return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`
  } catch {
    return "N/A"
  }
}

// Componente personalizado para el tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-md p-3">
        <p className="font-medium text-sm">{label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-sm">{entry.name}: </span>
              <span className="font-medium text-sm">{entry.value?.toFixed(2) || "N/A"}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function InstalacionDetailPanel({
  instalacion,
  sensoresInstalados,
  catalogoSensores,
  especies,
  lecturas,
  onAddSensor,
  onRemoveSensor,
}: InstalacionDetailPanelProps) {
  const [isAddSensorDialogOpen, setIsAddSensorDialogOpen] = useState(false)
  const [isFullScreenChartOpen, setIsFullScreenChartOpen] = useState(false)
  const [selectedSensorId, setSelectedSensorId] = useState<string>("")
  const [sensorDescripcion, setSensorDescripcion] = useState("")
  const [activeTab, setActiveTab] = useState("sensores")
  const [timeRange, setTimeRange] = useState("10") // Últimas 10 lecturas por defecto
  const [selectedSensors, setSelectedSensors] = useState<Record<number, boolean>>({})
  const [chartView, setChartView] = useState<"line" | "bar">("line")

  // Filtrar sensores instalados para esta instalación
  const instalacionSensores = sensoresInstalados.filter(
    (sensor) => sensor.id_instalacion === instalacion.id_instalacion,
  )

  // Inicializar selectedSensors si está vacío
  if (Object.keys(selectedSensors).length === 0 && instalacionSensores.length > 0) {
    const initialSelection: Record<number, boolean> = {}
    // Seleccionar solo los primeros 3 sensores por defecto para evitar amontonamiento
    instalacionSensores.forEach((sensor, index) => {
      initialSelection[sensor.id_sensor_instalado] = index < 3
    })
    setSelectedSensors(initialSelection)
  }

  // Encontrar la especie asociada a esta instalación a través del proceso
  const especieAsociada = especies.find((especie) => especie.id_especie === instalacion.id_proceso)

  // Preparar datos para la gráfica
  const prepareChartData = () => {
    // Agrupar lecturas por sensor
    const sensorLecturas: Record<number, Lectura[]> = {}

    instalacionSensores.forEach((sensor) => {
      // Solo incluir sensores seleccionados
      if (selectedSensors[sensor.id_sensor_instalado]) {
        const sensorId = sensor.id_sensor_instalado
        sensorLecturas[sensorId] = lecturas
          .filter((lectura) => lectura.id_sensor_instalado === sensorId)
          .sort((a, b) => {
            // Ordenar por fecha y hora - con validación
            try {
              const fechaA = a.fecha || ""
              const horaA = a.hora || "00:00:00"
              const fechaB = b.fecha || ""
              const horaB = b.hora || "00:00:00"

              const dateA = new Date(`${fechaA}T${horaA}`)
              const dateB = new Date(`${fechaB}T${horaB}`)

              if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                return 0
              }

              return dateA.getTime() - dateB.getTime()
            } catch {
              return 0
            }
          })
      }
    })

    // Convertir a formato para gráfica
    const chartData: Array<{
      fecha: string
      fechaFormateada: string
      [key: string]: string | number
    }> = []

    // Usar solo las últimas N lecturas para cada sensor
    const numReadings = Number.parseInt(timeRange) || 10
    Object.entries(sensorLecturas).forEach(([sensorId, lecturasList]) => {
      const recentLecturas = lecturasList.slice(-numReadings)

      recentLecturas.forEach((lectura, index) => {
        const sensorInfo = instalacionSensores.find((s) => s.id_sensor_instalado === Number(sensorId))
        const sensorNombre = sensorInfo?.nombre_sensor || `Sensor ${sensorId}`

        // Validar y formatear fecha/hora
        const fecha = lectura.fecha || ""
        const hora = lectura.hora || "00:00:00"

        // Asegurar que hora tenga el formato correcto
        const horaFormateada = hora.length >= 5 ? hora.substring(0, 5) : hora
        const fechaHora = `${fecha} ${horaFormateada}`
        const fechaFormateada = formatDate(fechaHora)

        // Buscar si ya existe esta fecha en chartData
        const existingDataPoint = chartData.find((point) => point.fecha === fechaHora)

        if (existingDataPoint) {
          existingDataPoint[sensorNombre] = lectura.valor || 0
        } else {
          const newDataPoint: any = {
            fecha: fechaHora,
            fechaFormateada: fechaFormateada,
          }
          newDataPoint[sensorNombre] = lectura.valor || 0
          chartData.push(newDataPoint)
        }
      })
    })

    return chartData
  }

  const chartData = prepareChartData()

  // Colores para las líneas del gráfico - Paleta mejorada para mejor contraste
  const lineColors = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#f97316", // orange-500
    "#06b6d4", // cyan-500
    "#6366f1", // indigo-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
    "#f59e0b", // amber-500
  ]

  const handleAddSensor = () => {
    if (!selectedSensorId) {
      alert("Por favor seleccione un sensor")
      return
    }

    onAddSensor({
      id_instalacion: instalacion.id_instalacion,
      id_sensor: Number(selectedSensorId),
      descripcion: sensorDescripcion || "Sensor para monitoreo",
    })

    // Limpiar formulario
    setSelectedSensorId("")
    setSensorDescripcion("")
    setIsAddSensorDialogOpen(false)
  }

  const toggleSensorSelection = (sensorId: number) => {
    setSelectedSensors((prev) => ({
      ...prev,
      [sensorId]: !prev[sensorId],
    }))
  }

  // Componente de gráfica que se puede reutilizar
  const ChartComponent = ({ fullScreen = false }) => (
    <div className={`${fullScreen ? "h-[70vh]" : "h-[400px]"} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: fullScreen ? 40 : 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="fechaFormateada"
            tick={{ fontSize: fullScreen ? 14 : 12 }}
            angle={-45}
            textAnchor="end"
            height={fullScreen ? 60 : 80}
            interval={fullScreen ? 0 : 1}
          />
          <YAxis tick={{ fontSize: fullScreen ? 14 : 12 }} width={fullScreen ? 60 : 40} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: 20,
              fontSize: fullScreen ? 14 : 12,
            }}
          />
          {instalacionSensores
            .filter((sensor) => selectedSensors[sensor.id_sensor_instalado])
            .map((sensor, index) => {
              const sensorNombre = sensor.nombre_sensor || `Sensor ${sensor.id_sensor_instalado}`
              const colorIndex = index % lineColors.length
              return (
                <Line
                  key={sensor.id_sensor_instalado}
                  type="monotone"
                  dataKey={sensorNombre}
                  stroke={lineColors[colorIndex]}
                  strokeWidth={fullScreen ? 2.5 : 2}
                  dot={{ r: fullScreen ? 5 : 4 }}
                  activeDot={{ r: fullScreen ? 8 : 6 }}
                  name={sensorNombre}
                />
              )
            })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <div className="mt-4 mb-6 bg-muted/30 p-4 rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <div>
          <h3 className="text-lg font-semibold">Detalles de la instalación: {instalacion.nombre_instalacion}</h3>
          <p className="text-sm text-muted-foreground">{instalacion.descripcion}</p>
        </div>

        <div className="flex items-center gap-2">
          {especieAsociada && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Fish className="h-3.5 w-3.5" />
              <span>Especie: {especieAsociada.nombre}</span>
            </Badge>
          )}

          <Dialog open={isAddSensorDialogOpen} onOpenChange={setIsAddSensorDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Añadir Sensor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Sensor a la Instalación</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sensor-type">Tipo de Sensor</Label>
                  <Select value={selectedSensorId} onValueChange={setSelectedSensorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de sensor" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogoSensores.map((sensor) => (
                        <SelectItem key={sensor.id_sensor} value={sensor.id_sensor.toString()}>
                          {sensor.sensor} - {sensor.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción (opcional)</Label>
                  <Input
                    id="descripcion"
                    value={sensorDescripcion}
                    onChange={(e) => setSensorDescripcion(e.target.value)}
                    placeholder="Ubicación o propósito del sensor"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSensor}>Añadir Sensor</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="sensores">Sensores Instalados</TabsTrigger>
          <TabsTrigger value="graficas">Gráficas de Parámetros</TabsTrigger>
        </TabsList>

        <TabsContent value="sensores">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {instalacionSensores.length > 0 ? (
              instalacionSensores.map((sensor) => (
                <Card key={sensor.id_sensor_instalado}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base flex items-center">
                        <Thermometer className="h-4 w-4 mr-2" />
                        {sensor.nombre_sensor}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onRemoveSensor(sensor.id_sensor_instalado)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{sensor.descripcion}</p>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Instalado:{" "}
                        {sensor.fecha_instalada ? new Date(sensor.fecha_instalada).toLocaleDateString() : "N/A"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No hay sensores instalados en esta instalación.
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAddSensorDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Añadir Sensor
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="graficas">
          {instalacionSensores.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-base">Histórico de Lecturas</CardTitle>

                  <div className="flex flex-wrap gap-2 items-center">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Rango de tiempo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Últimas 5 lecturas</SelectItem>
                        <SelectItem value="10">Últimas 10 lecturas</SelectItem>
                        <SelectItem value="20">Últimas 20 lecturas</SelectItem>
                        <SelectItem value="30">Últimas 30 lecturas</SelectItem>
                      </SelectContent>
                    </Select>

                    <Dialog open={isFullScreenChartOpen} onOpenChange={setIsFullScreenChartOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Maximize2 className="h-4 w-4 mr-1" /> Ampliar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] w-[1200px]">
                        <DialogHeader>
                          <DialogTitle>Gráfica de Parámetros - {instalacion.nombre_instalacion}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="flex flex-wrap gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Label>Mostrar:</Label>
                              {instalacionSensores.map((sensor) => (
                                <div key={sensor.id_sensor_instalado} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`sensor-${sensor.id_sensor_instalado}`}
                                    checked={selectedSensors[sensor.id_sensor_instalado]}
                                    onCheckedChange={() => toggleSensorSelection(sensor.id_sensor_instalado)}
                                  />
                                  <Label
                                    htmlFor={`sensor-${sensor.id_sensor_instalado}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {sensor.nombre_sensor}
                                  </Label>
                                </div>
                              ))}
                            </div>

                            <Select value={timeRange} onValueChange={setTimeRange}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Rango de tiempo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">Últimas 5 lecturas</SelectItem>
                                <SelectItem value="10">Últimas 10 lecturas</SelectItem>
                                <SelectItem value="20">Últimas 20 lecturas</SelectItem>
                                <SelectItem value="30">Últimas 30 lecturas</SelectItem>
                                <SelectItem value="50">Últimas 50 lecturas</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <ChartComponent fullScreen={true} />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Label className="mr-2">Sensores:</Label>
                  {instalacionSensores.map((sensor) => (
                    <div key={sensor.id_sensor_instalado} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sensor-inline-${sensor.id_sensor_instalado}`}
                        checked={selectedSensors[sensor.id_sensor_instalado]}
                        onCheckedChange={() => toggleSensorSelection(sensor.id_sensor_instalado)}
                      />
                      <Label
                        htmlFor={`sensor-inline-${sensor.id_sensor_instalado}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {sensor.nombre_sensor}
                      </Label>
                    </div>
                  ))}
                </div>

                <ChartComponent />

                <div className="mt-4 text-xs text-muted-foreground text-center">
                  Selecciona los sensores que deseas visualizar y ajusta el rango de tiempo para una mejor
                  visualización.
                  <br />
                  Para ver más detalles, haz clic en "Ampliar".
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos disponibles para mostrar gráficas.
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTab("sensores")}>
                  Gestionar Sensores
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
