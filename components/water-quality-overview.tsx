"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useSensorDataMultiple } from "@/hooks/use-sensor-data"

export function WaterQualityOverview() {
  // Puedes ajustar estos IDs según tu estructura real
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
    to: new Date(),
  })

  // Hook para obtener lecturas reales
  const { readings, loading, error } = useSensorDataMultiple(facilityId, {
    from: dateRange.from,
    to: dateRange.to,
    parameters: ["ph", "temperatura", "oxigeno"],
  })

  // Si no hay facilityId, no renderices nada
  if (!facilityId) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Selecciona una instalación para ver el resumen de calidad del agua.
      </div>
    )
  }

  // Procesar datos para el gráfico (memoizado)
  const chartData = useMemo(() => {
    return readings.reduce((acc: any[], lectura) => {
      const fecha = lectura.timestamp.split("T")[0]
      let entry = acc.find((d) => d.name === fecha)
      if (!entry) {
        entry = { name: fecha }
        acc.push(entry)
      }
      entry[lectura.parameter] = lectura.value
      return acc
    }, [])
  }, [readings])

  // Calcular promedios
  const promedio = (param: string) => {
    const valores = readings.filter((r) => r.parameter === param).map((r) => r.value)
    if (valores.length === 0) return 0
    return valores.reduce((a, b) => a + b, 0) / valores.length
  }

  return (
    <div className="space-y-6">
      <ChartContainer
        config={{
          ph: {
            label: "pH",
            color: "hsl(var(--chart-1))",
          },
          temperatura: {
            label: "Temperatura (°C)",
            color: "hsl(var(--chart-2))",
          },
          oxigeno: {
            label: "Oxígeno Disuelto (mg/L)",
            color: "hsl(var(--chart-3))",
          },
        }}
        className="h-[300px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line type="monotone" dataKey="ph" stroke="var(--color-ph)" />
            <Line type="monotone" dataKey="temperatura" stroke="var(--color-temperatura)" />
            <Line type="monotone" dataKey="oxigeno" stroke="var(--color-oxigeno)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">pH Promedio</h3>
            <div className="text-3xl font-bold">{promedio("ph").toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Rango óptimo: 6.5 - 8.0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Temperatura Promedio</h3>
            <div className="text-3xl font-bold">{promedio("temperatura").toFixed(2)} °C</div>
            <p className="text-sm text-muted-foreground">Rango óptimo: 24.0 - 28.0 °C</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Oxígeno Disuelto Promedio</h3>
            <div className="text-3xl font-bold">{promedio("oxigeno").toFixed(2)} mg/L</div>
            <p className="text-sm text-muted-foreground">Rango óptimo: &gt; 5.0 mg/L</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
