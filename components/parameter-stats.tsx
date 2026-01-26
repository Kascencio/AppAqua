"use client"

import { useState, useEffect } from "react"
import type { LucideIcon } from "lucide-react"
import { Droplets, Thermometer, Activity, Waves, Gauge, FlaskConical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type ParameterItem = {
  id: string
  name: string
  value: number
  unit: string
  min: number
  max: number
  icon: LucideIcon
  color: string
}

// Mock parameter data
const parameterData: Record<string, ParameterItem[]> = {
  "inst-001": [
    {
      id: "temp",
      name: "Temperatura",
      value: 24.5,
      unit: "°C",
      min: 22,
      max: 26,
      icon: Thermometer,
      color: "text-red-500",
    },
    {
      id: "oxygen",
      name: "Oxígeno Disuelto",
      value: 7.2,
      unit: "mg/L",
      min: 6.5,
      max: 8.0,
      icon: Droplets,
      color: "text-blue-500",
    },
    { id: "ph", name: "pH", value: 7.1, unit: "", min: 6.8, max: 7.5, icon: FlaskConical, color: "text-purple-500" },
    {
      id: "turbidity",
      name: "Turbidez",
      value: 3.2,
      unit: "NTU",
      min: 0,
      max: 5,
      icon: Waves,
      color: "text-amber-500",
    },
    {
      id: "conductivity",
      name: "Conductividad",
      value: 420,
      unit: "μS/cm",
      min: 300,
      max: 500,
      icon: Activity,
      color: "text-green-500",
    },
    {
      id: "redox",
      name: "Potencial Redox",
      value: 350,
      unit: "mV",
      min: 300,
      max: 400,
      icon: Gauge,
      color: "text-cyan-500",
    },
  ],
  "inst-002": [
    {
      id: "temp",
      name: "Temperatura",
      value: 23.8,
      unit: "°C",
      min: 22,
      max: 26,
      icon: Thermometer,
      color: "text-red-500",
    },
    {
      id: "oxygen",
      name: "Oxígeno Disuelto",
      value: 6.9,
      unit: "mg/L",
      min: 6.5,
      max: 8.0,
      icon: Droplets,
      color: "text-blue-500",
    },
    { id: "ph", name: "pH", value: 7.3, unit: "", min: 6.8, max: 7.5, icon: FlaskConical, color: "text-purple-500" },
    {
      id: "nitrites",
      name: "Nitritos",
      value: 0.05,
      unit: "mg/L",
      min: 0,
      max: 0.1,
      icon: FlaskConical,
      color: "text-indigo-500",
    },
    {
      id: "nitrates",
      name: "Nitratos",
      value: 15,
      unit: "mg/L",
      min: 0,
      max: 20,
      icon: FlaskConical,
      color: "text-violet-500",
    },
  ],
  // Add more installations as needed
}

export function ParameterStats() {
  const [selectedInstallation, setSelectedInstallation] = useState("inst-001")
  const [parameters, setParameters] = useState(parameterData["inst-001"])

  // Listen for changes in the installation selector
  useEffect(() => {
    // In a real app, this would fetch data from an API
    const installationParams = parameterData[selectedInstallation] || []
    setParameters(installationParams)
  }, [selectedInstallation])

  // Function to calculate percentage within range
  const calculatePercentage = (value: number, min: number, max: number) => {
    if (value < min) return 0
    if (value > max) return 100
    return ((value - min) / (max - min)) * 100
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {parameters.map((param) => {
        const Icon = param.icon
        const percentage = calculatePercentage(param.value, param.min, param.max)

        return (
          <Card key={param.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Icon className={`h-5 w-5 mr-2 ${param.color}`} />
                  <h3 className="font-medium">{param.name}</h3>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    percentage < 20 || percentage > 80 ? "text-amber-500" : "text-green-500"
                  }`}
                >
                  {param.value} {param.unit}
                </span>
              </div>

              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    percentage < 20 ? "bg-amber-500" : percentage > 80 ? "bg-amber-500" : "bg-green-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>
                  {param.min} {param.unit}
                </span>
                <span>
                  {param.max} {param.unit}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
