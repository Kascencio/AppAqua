"use client"

import { useState } from "react"
import SensorCard from "@/components/sensor-card"

export default function SensorCardDemo() {
  // Sample sensors with initial states
  const [sensors, setSensors] = useState([
    { id: "1", name: "Temperature Sensor", isActive: true },
    { id: "2", name: "pH Sensor", isActive: false },
    { id: "3", name: "Oxygen Sensor", isActive: true },
    { id: "4", name: "Salinity Sensor", isActive: false },
  ])

  // Toggle sensor active state
  const toggleSensor = (id: string) => {
    setSensors(sensors.map((sensor) => (sensor.id === id ? { ...sensor, isActive: !sensor.isActive } : sensor)))
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sensor Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map((sensor) => (
          <SensorCard
            key={sensor.id}
            name={sensor.name}
            isActive={sensor.isActive}
            onToggle={() => toggleSensor(sensor.id)}
          />
        ))}
      </div>
    </div>
  )
}
