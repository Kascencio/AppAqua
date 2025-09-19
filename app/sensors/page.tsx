"use client"

import { useState, useCallback, useMemo } from "react"
import {
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  Power,
  Activity,
  AlertTriangle,
  List,
  Eye,
  Building2,
  MapPin,
  ChevronDown,
  ChevronRight,
  Factory,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageHeader } from "@/components/page-header"
import { useBranches } from "@/hooks/use-branches"
import { useSensors } from "@/hooks/use-sensors"
import AddSensorDialog from "@/components/add-sensor-dialog"
import EditSensorDialog from "@/components/edit-sensor-dialog"
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog"
import { useToast } from "@/hooks/use-toast"
import type { SensorCompleto } from "@/hooks/use-sensors"

// Configuración de rangos por tipo de sensor
const getSensorConfig = (sensorType: string) => {
  switch (sensorType) {
    case "ph":
      return {
        minRange: 4.0,
        maxRange: 10.0,
        optimalMin: 6.5,
        optimalMax: 8.5,
        unit: "pH",
        name: "pH",
        color: "#3b82f6",
      }
    case "temperature":
      return {
        minRange: 15,
        maxRange: 35,
        optimalMin: 22,
        optimalMax: 28,
        unit: "°C",
        name: "Temperatura",
        color: "#ef4444",
      }
    case "oxygen":
      return {
        minRange: 0,
        maxRange: 100,
        optimalMin: 30,
        optimalMax: 70,
        unit: "mg/L",
        name: "Oxígeno Disuelto",
        color: "#10b981",
      }
    case "nitrates":
      return {
        minRange: 0,
        maxRange: 50,
        optimalMin: 5,
        optimalMax: 25,
        unit: "mg/L",
        name: "Nitratos",
        color: "#f59e0b",
      }
    case "ammonia":
      return {
        minRange: 0,
        maxRange: 2.0,
        optimalMin: 0.1,
        optimalMax: 0.5,
        unit: "mg/L",
        name: "Amonio",
        color: "#8b5cf6",
      }
    case "salinity":
      return {
        minRange: 0,
        maxRange: 35,
        optimalMin: 15,
        optimalMax: 25,
        unit: "ppt",
        name: "Salinidad",
        color: "#06b6d4",
      }
    case "turbidity":
      return {
        minRange: 0,
        maxRange: 100,
        optimalMin: 10,
        optimalMax: 40,
        unit: "NTU",
        name: "Turbidez",
        color: "#84cc16",
      }
    case "barometric":
      return {
        minRange: 950,
        maxRange: 1050,
        optimalMin: 980,
        optimalMax: 1020,
        unit: "hPa",
        name: "Presión Atmosférica",
        color: "#f97316",
      }
    default:
      return {
        minRange: 0,
        maxRange: 100,
        optimalMin: 30,
        optimalMax: 70,
        unit: "",
        name: "Sensor",
        color: "#6b7280",
      }
  }
}

// Generate real-time gauge data for sensor with dynamic ranges
const generateSensorGaugeData = (sensor: any) => {
  const config = getSensorConfig(sensor.type || "other")
  const { minRange, maxRange, optimalMin, optimalMax } = config

  // Use custom unit if available, otherwise use default
  const unit = sensor.unit || config.unit
  const name = sensor.name || config.name
  const color = config.color

  // Generate more realistic base values
  let baseValue
  if (sensor.lastReading !== undefined) {
    baseValue = sensor.lastReading
  } else {
    // Generate values with higher probability in optimal range
    const random = Math.random()
    if (random < 0.6) {
      // 60% chance in optimal range
      baseValue = optimalMin + Math.random() * (optimalMax - optimalMin)
    } else if (random < 0.8) {
      // 20% chance in warning zones
      baseValue =
        Math.random() < 0.5
          ? minRange + Math.random() * (optimalMin - minRange)
          : optimalMax + Math.random() * (maxRange - optimalMax)
    } else {
      // 20% chance anywhere in range
      baseValue = minRange + Math.random() * (maxRange - minRange)
    }
  }

  // Add more realistic time-based variation for smoother needle movement
  const timeVariation = Math.sin(Date.now() / 12000 + (sensor.id_sensor_instalado || 0) * 0.1) * 0.1
  const randomVariation = (Math.random() - 0.5) * 0.2

  let currentValue = baseValue + timeVariation + randomVariation
  currentValue = Math.max(minRange, Math.min(maxRange, currentValue))

  return {
    currentValue,
    minRange,
    maxRange,
    optimalMin,
    optimalMax,
    unit,
    name,
    color,
  }
}

// Simple Gauge Component with proper color sections
const SimpleGauge = ({
  value,
  min,
  max,
  optimalMin,
  optimalMax,
  unit,
  size = "normal",
}: {
  value: number
  min: number
  max: number
  optimalMin: number
  optimalMax: number
  unit: string
  size?: "normal" | "large"
}) => {
  const percentage = ((value - min) / (max - min)) * 100
  const optimalStartPercentage = ((optimalMin - min) / (max - min)) * 100
  const optimalEndPercentage = ((optimalMax - min) / (max - min)) * 100

  // Calculate warning zones with 20% margin
  const optimalRange = optimalMax - optimalMin
  const warningMargin = optimalRange * 0.2
  const warningMin = optimalMin - warningMargin
  const warningMax = optimalMax + warningMargin

  const warningStartPercentage = Math.max(0, ((warningMin - min) / (max - min)) * 100)
  const warningEndPercentage = Math.min(100, ((warningMax - min) / (max - min)) * 100)

  // Determine current value color
  const getCurrentValueColor = () => {
    if (value >= optimalMin && value <= optimalMax) {
      return "#22c55e" // Green
    } else if ((value >= warningMin && value < optimalMin) || (value > optimalMax && value <= warningMax)) {
      return "#eab308" // Yellow
    } else {
      return "#dc2626" // Red
    }
  }

  const isLarge = size === "large"
  const gaugeHeight = isLarge ? "h-48" : "h-32"
  const textSize = isLarge ? "text-4xl" : "text-2xl"
  const unitSize = isLarge ? "text-xl" : "text-lg"
  const strokeWidth = isLarge ? "20" : "16"
  const circleRadius = isLarge ? "12" : "10"

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className={`relative ${gaugeHeight} mb-4`}>
        {/* Semi-circle gauge background */}
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Background arc - Light gray */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Critical zones (red) - Left side */}
          {warningStartPercentage > 0 && (
            <path
              d={`M 20 100 A 80 80 0 0 1 ${20 + (warningStartPercentage / 100) * 160} ${100 - Math.sin(Math.acos((warningStartPercentage / 100) * 2 - 1)) * 80}`}
              fill="none"
              stroke="#dc2626"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}

          {/* Critical zones (red) - Right side */}
          {warningEndPercentage < 100 && (
            <path
              d={`M ${20 + (warningEndPercentage / 100) * 160} ${100 - Math.sin(Math.acos((warningEndPercentage / 100) * 2 - 1)) * 80} A 80 80 0 0 1 180 100`}
              fill="none"
              stroke="#dc2626"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}

          {/* Warning zones (yellow) - Left side */}
          {warningStartPercentage < optimalStartPercentage && (
            <path
              d={`M ${20 + (warningStartPercentage / 100) * 160} ${100 - Math.sin(Math.acos((warningStartPercentage / 100) * 2 - 1)) * 80} A 80 80 0 0 1 ${20 + (optimalStartPercentage / 100) * 160} ${100 - Math.sin(Math.acos((optimalStartPercentage / 100) * 2 - 1)) * 80}`}
              fill="none"
              stroke="#eab308"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}

          {/* Warning zones (yellow) - Right side */}
          {optimalEndPercentage < warningEndPercentage && (
            <path
              d={`M ${20 + (optimalEndPercentage / 100) * 160} ${100 - Math.sin(Math.acos((optimalEndPercentage / 100) * 2 - 1)) * 80} A 80 80 0 0 1 ${20 + (warningEndPercentage / 100) * 160} ${100 - Math.sin(Math.acos((warningEndPercentage / 100) * 2 - 1)) * 80}`}
              fill="none"
              stroke="#eab308"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}

          {/* Optimal range arc (green) */}
          <path
            d={`M ${20 + (optimalStartPercentage / 100) * 160} ${100 - Math.sin(Math.acos((optimalStartPercentage / 100) * 2 - 1)) * 80} A 80 80 0 0 1 ${20 + (optimalEndPercentage / 100) * 160} ${100 - Math.sin(Math.acos((optimalEndPercentage / 100) * 2 - 1)) * 80}`}
            fill="none"
            stroke="#22c55e"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Current value indicator */}
          <circle
            cx={20 + (percentage / 100) * 160}
            cy={100 - Math.sin(Math.acos((percentage / 100) * 2 - 1)) * 80}
            r={circleRadius}
            fill={getCurrentValueColor()}
            stroke="white"
            strokeWidth="4"
          />

          {/* Center value display */}
          <text x="100" y={isLarge ? "80" : "85"} textAnchor="middle" className={`${textSize} font-bold fill-current`}>
            {value.toFixed(1)}
          </text>
          <text
            x="100"
            y={isLarge ? "105" : "105"}
            textAnchor="middle"
            className={`${unitSize} fill-current opacity-60`}
          >
            {unit}
          </text>
        </svg>

        {/* Min/Max labels */}
        <div className="absolute bottom-0 left-0 text-xs text-gray-500">{min}</div>
        <div className="absolute bottom-0 right-0 text-xs text-gray-500">{max}</div>
      </div>
    </div>
  )
}

// Compact Sensor Row for hierarchical view
const SensorRow = ({
  sensor,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  sensor: any
  onToggleStatus: (sensor: any) => void
  onEdit: (sensor: any) => void
  onDelete: (sensor: any) => void
}) => {
  const isActive = sensor.status === "active"
  const gaugeData = useMemo(() => {
    const cfg = getSensorConfig(sensor.type || "other")
    const current = typeof sensor.lastReading === 'number' ? sensor.lastReading : cfg.optimalMin
    return {
      currentValue: current,
      minRange: cfg.minRange,
      maxRange: cfg.maxRange,
      optimalMin: cfg.optimalMin,
      optimalMax: cfg.optimalMax,
      unit: sensor.unit || cfg.unit,
      name: sensor.name || cfg.name,
      color: cfg.color,
    }
  }, [sensor])

  // Get status info
  const getStatusInfo = useCallback((currentValue: number, optimalMin: number, optimalMax: number) => {
    const optimalRange = optimalMax - optimalMin
    const warningMargin = optimalRange * 0.2
    const warningMin = optimalMin - warningMargin
    const warningMax = optimalMax + warningMargin

    if (currentValue >= optimalMin && currentValue <= optimalMax) {
      return {
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        status: "ÓPTIMO",
        statusColor: "text-green-700 bg-green-100",
      }
    } else if (
      (currentValue >= warningMin && currentValue < optimalMin) ||
      (currentValue > optimalMax && currentValue <= warningMax)
    ) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 border-yellow-200",
        status: "ADVERTENCIA",
        statusColor: "text-yellow-700 bg-yellow-100",
      }
    } else {
      return {
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200",
        status: "CRÍTICO",
        statusColor: "text-red-700 bg-red-100",
      }
    }
  }, [])

  const statusInfo = useMemo(() => {
    return isActive
      ? getStatusInfo(gaugeData.currentValue, gaugeData.optimalMin, gaugeData.optimalMax)
      : {
          color: "text-gray-400",
          bgColor: "bg-gray-50 border-gray-200",
          status: "INACTIVO",
          statusColor: "text-gray-500 bg-gray-100",
        }
  }, [isActive, gaugeData.currentValue, gaugeData.optimalMin, gaugeData.optimalMax, getStatusInfo])

  return (
    <div
      className={`flex items-center gap-4 p-3 ml-12 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 ${statusInfo.bgColor}`}
    >
      {/* Sensor info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="min-w-0 flex-1">
          <h5 className="font-semibold text-gray-900 dark:text-white truncate">{gaugeData.name}</h5>
          <p className="text-xs text-gray-500 font-mono">ID: {sensor.id_sensor_instalado || "N/A"}</p>
        </div>

        {/* Current value */}
        <div className="text-center min-w-[100px]">
          <div className={`text-lg font-bold tabular-nums ${statusInfo.color}`}>
            {isActive ? (
              <>
                {gaugeData.currentValue.toFixed(1)}
                <span className="text-sm font-semibold ml-1">{gaugeData.unit}</span>
              </>
            ) : (
              <span className="text-gray-400">-- {gaugeData.unit}</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Óptimo: {gaugeData.optimalMin.toFixed(1)}-{gaugeData.optimalMax.toFixed(1)} {gaugeData.unit}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.statusColor}`}>
            {statusInfo.status}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleStatus(sensor)
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              isActive
                ? "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
            {isActive ? "ON" : "OFF"}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => onEdit(sensor)} className="h-8 w-8 p-0">
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 bg-transparent"
            onClick={() => onDelete(sensor)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hierarchical Organization Component for all view modes
const HierarchicalOrganization = ({
  organizedData,
  viewMode,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  organizedData: any
  viewMode: "simple" | "advanced" | "hierarchical"
  onToggleStatus: (sensor: any) => void
  onEdit: (sensor: any) => void
  onDelete: (sensor: any) => void
}) => {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())
  const [expandedInstallations, setExpandedInstallations] = useState<Set<string>>(new Set())

  const toggleCompany = (companyName: string) => {
    const newExpanded = new Set(expandedCompanies)
    if (newExpanded.has(companyName)) {
      newExpanded.delete(companyName)
    } else {
      newExpanded.add(companyName)
    }
    setExpandedCompanies(newExpanded)
  }

  const toggleBranch = (branchKey: string) => {
    const newExpanded = new Set(expandedBranches)
    if (newExpanded.has(branchKey)) {
      newExpanded.delete(branchKey)
    } else {
      newExpanded.add(branchKey)
    }
    setExpandedBranches(newExpanded)
  }

  const toggleInstallation = (installationKey: string) => {
    const newExpanded = new Set(expandedInstallations)
    if (newExpanded.has(installationKey)) {
      newExpanded.delete(installationKey)
    } else {
      newExpanded.add(installationKey)
    }
    setExpandedInstallations(newExpanded)
  }

  return (
    <div className="space-y-4">
      {Object.entries(organizedData).map(([companyName, companyData]: [string, any]) => {
        const isCompanyExpanded = expandedCompanies.has(companyName)
        const totalSensors = Object.values(companyData.branches).reduce(
          (total: number, branch: any) =>
            total +
            Object.values(branch.installations).reduce(
              (branchTotal: number, installation: any) => branchTotal + installation.sensors.length,
              0,
            ),
          0,
        )

        return (
          <div key={companyName} className="border rounded-lg overflow-hidden">
            {/* Company Header */}
            <div
              className="flex items-center gap-3 p-4 bg-blue-50 border-b cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => toggleCompany(companyName)}
            >
              {isCompanyExpanded ? (
                <ChevronDown className="h-5 w-5 text-blue-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-blue-600" />
              )}
              <Factory className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-blue-900">{companyName}</h2>
                <p className="text-sm text-blue-700">
                  {Object.keys(companyData.branches).length} sucursal(es) • {totalSensors} sensor(es)
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {totalSensors}
              </Badge>
            </div>

            {/* Company Content */}
            {isCompanyExpanded && (
              <div className="p-4 space-y-4">
                {Object.entries(companyData.branches).map(([branchName, branchData]: [string, any]) => {
                  const branchKey = `${companyName}-${branchName}`
                  const isBranchExpanded = expandedBranches.has(branchKey)
                  const branchSensors = Object.values(branchData.installations).reduce(
                    (total: number, installation: any) => total + installation.sensors.length,
                    0,
                  )

                  return (
                    <div key={branchKey} className="border rounded-lg overflow-hidden ml-4">
                      {/* Branch Header */}
                      <div
                        className="flex items-center gap-3 p-3 bg-green-50 border-b cursor-pointer hover:bg-green-100 transition-colors"
                        onClick={() => toggleBranch(branchKey)}
                      >
                        {isBranchExpanded ? (
                          <ChevronDown className="h-4 w-4 text-green-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-green-600" />
                        )}
                        <Building2 className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900">{branchName}</h3>
                          <p className="text-sm text-green-700">
                            {Object.keys(branchData.installations).length} instalación(es) • {branchSensors} sensor(es)
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {branchSensors}
                        </Badge>
                      </div>

                      {/* Branch Content */}
                      {isBranchExpanded && (
                        <div className="p-3 space-y-3">
                          {Object.entries(branchData.installations).map(
                            ([installationName, installationData]: [string, any]) => {
                              const installationKey = `${branchKey}-${installationName}`
                              const isInstallationExpanded = expandedInstallations.has(installationKey)

                              return (
                                <div key={installationKey} className="border rounded-lg overflow-hidden ml-4">
                                  {/* Installation Header */}
                                  <div
                                    className="flex items-center gap-3 p-3 bg-orange-50 border-b cursor-pointer hover:bg-orange-100 transition-colors"
                                    onClick={() => toggleInstallation(installationKey)}
                                  >
                                    {isInstallationExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-orange-600" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-orange-600" />
                                    )}
                                    <MapPin className="h-4 w-4 text-orange-600" />
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-orange-900">{installationName}</h4>
                                      <p className="text-sm text-orange-700">
                                        {installationData.sensors.length} sensor(es)
                                      </p>
                                    </div>
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                      {installationData.sensors.length}
                                    </Badge>
                                  </div>

                                  {/* Installation Content - Sensors */}
                                  {isInstallationExpanded && (
                                    <div className="p-3">
                                      {viewMode === "hierarchical" ? (
                                        <div className="space-y-2">
                                          {installationData.sensors.map((sensor: any) => (
                                            <SensorRow
                                              key={sensor.id_sensor_instalado}
                                              sensor={sensor}
                                              onToggleStatus={onToggleStatus}
                                              onEdit={onEdit}
                                              onDelete={onDelete}
                                            />
                                          ))}
                                        </div>
                                      ) : (
                                        <div
                                          className={`grid gap-4 ${
                                            viewMode === "simple"
                                              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                          }`}
                                        >
                                          {installationData.sensors.map((sensor: any) => {
                                            if (viewMode === "simple") {
                                              return (
                                                <SimpleSensorCard
                                                  key={sensor.id_sensor_instalado}
                                                  sensor={sensor}
                                                  onToggleStatus={onToggleStatus}
                                                  onEdit={onEdit}
                                                  onDelete={onDelete}
                                                />
                                              )
                                            } else {
                                              return (
                                                <AdvancedSensorCard
                                                  key={sensor.id_sensor_instalado}
                                                  sensor={sensor}
                                                  onToggleStatus={onToggleStatus}
                                                  onEdit={onEdit}
                                                  onDelete={onDelete}
                                                />
                                              )
                                            }
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            },
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Vista Simple - Solo medidor grande con título e ID
const SimpleSensorCard = ({
  sensor,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  sensor: any
  onToggleStatus: (sensor: any) => void
  onEdit: (sensor: any) => void
  onDelete: (sensor: any) => void
}) => {
  const gaugeData = useMemo(() => {
    const cfg = getSensorConfig(sensor.type || "other")
    const current = typeof sensor.lastReading === 'number' ? sensor.lastReading : cfg.optimalMin
    return {
      currentValue: current,
      minRange: cfg.minRange,
      maxRange: cfg.maxRange,
      optimalMin: cfg.optimalMin,
      optimalMax: cfg.optimalMax,
      unit: sensor.unit || cfg.unit,
      name: sensor.name || cfg.name,
      color: cfg.color,
    }
  }, [sensor])
  const isActive = sensor.status === "active"

  // Get status info
  const getStatusInfo = useCallback((currentValue: number, optimalMin: number, optimalMax: number) => {
    const optimalRange = optimalMax - optimalMin
    const warningMargin = optimalRange * 0.2
    const warningMin = optimalMin - warningMargin
    const warningMax = optimalMax + warningMargin

    if (currentValue >= optimalMin && currentValue <= optimalMax) {
      return {
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        status: "ÓPTIMO",
        statusColor: "text-green-700 bg-green-100",
      }
    } else if (
      (currentValue >= warningMin && currentValue < optimalMin) ||
      (currentValue > optimalMax && currentValue <= warningMax)
    ) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 border-yellow-200",
        status: "ADVERTENCIA",
        statusColor: "text-yellow-700 bg-yellow-100",
      }
    } else {
      return {
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200",
        status: "CRÍTICO",
        statusColor: "text-red-700 bg-red-100",
      }
    }
  }, [])

  const statusInfo = useMemo(() => {
    return isActive
      ? getStatusInfo(gaugeData.currentValue, gaugeData.optimalMin, gaugeData.optimalMax)
      : {
          color: "text-gray-400",
          bgColor: "bg-gray-50 border-gray-200",
          status: "INACTIVO",
          statusColor: "text-gray-500 bg-gray-100",
        }
  }, [isActive, gaugeData.currentValue, gaugeData.optimalMin, gaugeData.optimalMax, getStatusInfo])

  return (
    <div
      className={`rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${statusInfo.bgColor}`}
    >
      <div className="p-4 space-y-4">
        {/* Header compacto */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{gaugeData.name}</h3>
            <p className="text-xs text-gray-500 font-mono">ID: {sensor.id_sensor_instalado || "N/A"}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleStatus(sensor)
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              isActive
                ? "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
            {isActive ? "ON" : "OFF"}
          </button>
        </div>

        {/* Medidor grande que ocupa la mayor parte de la card */}
        <div className="py-4">
          {isActive ? (
            <SimpleGauge
              value={gaugeData.currentValue}
              min={gaugeData.minRange}
              max={gaugeData.maxRange}
              optimalMin={gaugeData.optimalMin}
              optimalMax={gaugeData.optimalMax}
              unit={gaugeData.unit}
              size="large"
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Power className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Sensor desactivado</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="text-center">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.statusColor}`}>
            {statusInfo.status}
          </div>
        </div>

        {/* Additional Info - New section */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Sucursal:</span>
            <span
              className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]"
              title={sensor.branchName || "Sin asignar"}
            >
              {sensor.branchName || "Sin asignar"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Instalación:</span>
            <span
              className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]"
              title={sensor.facilityName || "Sin asignar"}
            >
              {sensor.facilityName || "Sin asignar"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Rango Óptimo:</span>
            <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
              {gaugeData.optimalMin.toFixed(1)} - {gaugeData.optimalMax.toFixed(1)} {gaugeData.unit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Última actualización:</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isActive ? `Hace ${Math.floor(Math.random() * 30) + 1}s` : "Inactivo"}
            </span>
          </div>
        </div>

        {/* Botones de acción minimalistas */}
        <div className="flex justify-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" size="sm" onClick={() => onEdit(sensor)} className="h-8 px-3 text-xs">
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 bg-transparent"
            onClick={() => onDelete(sensor)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Vista Avanzada - Información técnica completa (componente existente)
const AdvancedSensorCard = ({
  sensor,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  sensor: any
  onToggleStatus: (sensor: any) => void
  onEdit: (sensor: any) => void
  onDelete: (sensor: any) => void
}) => {
  const [gaugeData] = useState(() => generateSensorGaugeData(sensor))
  const [isExpanded, setIsExpanded] = useState(false)
  const isActive = sensor.status === "active"

  // Get status info
  const getStatusInfo = useCallback((currentValue: number, optimalMin: number, optimalMax: number) => {
    const optimalRange = optimalMax - optimalMin
    const warningMargin = optimalRange * 0.2
    const warningMin = optimalMin - warningMargin
    const warningMax = optimalMax + warningMargin

    if (currentValue >= optimalMin && currentValue <= optimalMax) {
      return {
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        status: "ÓPTIMO",
        statusColor: "text-green-700 bg-green-100",
      }
    } else if (
      (currentValue >= warningMin && currentValue < optimalMin) ||
      (currentValue > optimalMax && currentValue <= warningMax)
    ) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 border-yellow-200",
        status: "ADVERTENCIA",
        statusColor: "text-yellow-700 bg-yellow-100",
      }
    } else {
      return {
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200",
        status: "CRÍTICO",
        statusColor: "text-red-700 bg-red-100",
      }
    }
  }, [])

  const statusInfo = useMemo(() => {
    return isActive
      ? getStatusInfo(gaugeData.currentValue, gaugeData.optimalMin, gaugeData.optimalMax)
      : {
          color: "text-gray-400",
          bgColor: "bg-gray-50 border-gray-200",
          status: "INACTIVO",
          statusColor: "text-gray-500 bg-gray-100",
        }
  }, [isActive, gaugeData.currentValue, gaugeData.optimalMin, gaugeData.optimalMax, getStatusInfo])

  return (
    <div
      className={`rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${statusInfo.bgColor}`}
    >
      {/* Collapsed View - Always Visible */}
      <div className="p-4 space-y-3">
        {/* Header: Parameter Name + ON/OFF Switch */}
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate flex-1 mr-2">{gaugeData.name}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleStatus(sensor)
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              isActive
                ? "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
            {isActive ? "ON" : "OFF"}
          </button>
        </div>

        {/* Sensor ID and Installation */}
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span className="font-medium">ID:</span>
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {sensor.id_sensor_instalado || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Sucursal:</span>
            <span className="text-right text-xs max-w-[150px] truncate" title={sensor.branchName || "Sin asignar"}>
              {sensor.branchName || "Sin asignar"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Instalación:</span>
            <span className="text-right text-xs max-w-[150px] truncate" title={sensor.facilityName || "Sin asignar"}>
              {sensor.facilityName || "Sin asignar"}
            </span>
          </div>
          {sensor.currentParameter && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Parámetro:</span>
              <span className="text-right text-xs max-w-[150px] truncate" title={sensor.currentParameter}>
                {sensor.currentParameter}
              </span>
            </div>
          )}
        </div>

        {/* Current Value - Large and Prominent */}
        <div className="text-center py-2">
          <div className={`text-3xl font-bold tabular-nums transition-colors duration-300 ${statusInfo.color}`}>
            {isActive ? (
              <>
                {gaugeData.currentValue.toFixed(1)}
                <span className="text-lg font-semibold ml-1">{gaugeData.unit}</span>
              </>
            ) : (
              <span className="text-gray-400">-- {gaugeData.unit}</span>
            )}
          </div>

          {/* Status Badge */}
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${statusInfo.statusColor}`}>
            {statusInfo.status}
          </div>
        </div>

        {/* Optimal Range */}
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Rango Óptimo:</span>{" "}
            <span className="tabular-nums font-mono">
              {gaugeData.optimalMin.toFixed(1)} - {gaugeData.optimalMax.toFixed(1)} {gaugeData.unit}
            </span>
          </div>
        </div>

        {/* Last Update */}
        <div className="text-center">
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {isActive ? `Actualizado hace ${Math.floor(Math.random() * 30) + 1}s` : "Sensor desactivado"}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(sensor)} className="h-8 px-3 text-xs">
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 bg-transparent"
              onClick={() => onDelete(sensor)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Eliminar
            </Button>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <span className="mr-1">{isExpanded ? "Ver menos" : "Ver más"}</span>
            <svg
              className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Expanded View - Collapsible */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
          <div className="pt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
              Medidor en Tiempo Real
            </h4>

            {isActive ? (
              <SimpleGauge
                value={gaugeData.currentValue}
                min={gaugeData.minRange}
                max={gaugeData.maxRange}
                optimalMin={gaugeData.optimalMin}
                optimalMax={gaugeData.optimalMax}
                unit={gaugeData.unit}
              />
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Power className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sensor desactivado</p>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium text-gray-600 dark:text-gray-400">Rango Total</div>
                <div className="font-mono text-gray-800 dark:text-gray-200">
                  {gaugeData.minRange} - {gaugeData.maxRange} {gaugeData.unit}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium text-gray-600 dark:text-gray-400">Precisión</div>
                <div className="font-mono text-gray-800 dark:text-gray-200">±0.1 {gaugeData.unit}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SensorsPage() {
  const { branches, loading: loadingBranches } = useBranches()
  const { sensors, loading: loadingSensors, createSensor, updateSensor, deleteSensor, getNextSensorId } = useSensors()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("todos")
  const [selectedStatus, setSelectedStatus] = useState("todos")
  const [selectedBranch, setSelectedBranch] = useState("todas")
  const [selectedFacility, setSelectedFacility] = useState("todas")
  const [activeTab, setActiveTab] = useState("todos")
  const [viewMode, setViewMode] = useState<"simple" | "advanced" | "hierarchical">("hierarchical")
  const [isAddSensorDialogOpen, setIsAddSensorDialogOpen] = useState(false)
  const [isEditSensorDialogOpen, setIsEditSensorDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSensor, setSelectedSensor] = useState<any | null>(null)
  const { toast } = useToast()

  // Memoize available facilities to prevent recalculation
  const availableFacilities = useMemo(() => {
    return Array.from(new Set(sensors.map((sensor) => sensor.facilityName).filter(Boolean))).sort()
  }, [sensors])

  // Get sensor statistics
  const sensorStats = useMemo(() => {
    const total = sensors.length
    const active = sensors.filter((s) => s.status === "active").length
    const alert = sensors.filter((s) => s.status === "alert").length
    const offline = sensors.filter((s) => s.status === "offline").length
    const maintenance = sensors.filter((s) => s.status === "maintenance").length

    return { total, active, alert, offline, maintenance }
  }, [sensors])

  // Organize sensors hierarchically: Company → Branch → Installation → Sensors
  const organizedSensors = useMemo(() => {
    const filtered = sensors.filter((sensor) => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !(
            (sensor.id_sensor_instalado?.toString() || "").includes(query) ||
            (sensor.name || "").toLowerCase().includes(query) ||
            (sensor.branchName || "").toLowerCase().includes(query) ||
            (sensor.facilityName || "").toLowerCase().includes(query) ||
            (sensor.currentParameter || "").toLowerCase().includes(query)
          )
        ) {
          return false
        }
      }

      // Apply type filter
      if (selectedType !== "todos" && sensor.type !== selectedType) {
        return false
      }

      // Apply status filter
      if (selectedStatus !== "todos" && sensor.status !== selectedStatus) {
        return false
      }

      // Apply branch filter
      if (selectedBranch !== "todas" && sensor.branchId?.toString() !== selectedBranch) {
        return false
      }

      // Apply facility filter
      if (selectedFacility !== "todas" && sensor.facilityName !== selectedFacility) {
        return false
      }

      // Apply tab filter
      if (activeTab !== "todos") {
        if (activeTab === "ph" && sensor.type !== "ph") return false
        if (activeTab === "temperatura" && sensor.type !== "temperature") return false
        if (activeTab === "oxigeno" && sensor.type !== "oxygen") return false
        if (activeTab === "otros" && ["ph", "temperature", "oxygen"].includes(sensor.type)) return false
      }

      return true
    })

    // Group by Company → Branch → Installation
    const organized: any = {}

    filtered.forEach((sensor) => {
      // Determine company name (for demo purposes, we'll extract from branch name or use a default)
      const companyName = sensor.branchName?.includes("Centro")
        ? "AquaTech Solutions"
        : sensor.branchName?.includes("Norte")
          ? "AquaTech Solutions"
          : sensor.branchName?.includes("Sur")
            ? "AquaTech Solutions"
            : "AquaTech Solutions"

      const branchName = sensor.branchName || "Sucursal Sin Nombre"
      const installationName = sensor.facilityName || "Instalación Sin Nombre"

      // Initialize company if not exists
      if (!organized[companyName]) {
        organized[companyName] = {
          branches: {},
        }
      }

      // Initialize branch if not exists
      if (!organized[companyName].branches[branchName]) {
        organized[companyName].branches[branchName] = {
          installations: {},
        }
      }

      // Initialize installation if not exists
      if (!organized[companyName].branches[branchName].installations[installationName]) {
        organized[companyName].branches[branchName].installations[installationName] = {
          sensors: [],
        }
      }

      // Add sensor to installation
      organized[companyName].branches[branchName].installations[installationName].sensors.push(sensor)
    })

    return organized
  }, [searchQuery, selectedType, selectedStatus, selectedBranch, selectedFacility, activeTab, sensors])

  // Handle adding a new sensor
  const handleAddSensor = useCallback(
    async (sensorData: any) => {
      try {
        await createSensor(sensorData)
        toast({
          title: "Sensor creado",
          description: `El sensor ${sensorData.name} ha sido creado exitosamente.`,
        })
        setIsAddSensorDialogOpen(false)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al crear el sensor",
          variant: "destructive",
        })
        throw error
      }
    },
    [createSensor, toast],
  )

  // Handle updating a sensor
  const handleUpdateSensor = useCallback(
    async (sensorData: Partial<SensorCompleto>) => {
      try {
        await updateSensor(sensorData)
        toast({
          title: "Sensor actualizado",
          description: "El sensor ha sido actualizado exitosamente.",
        })
        setIsEditSensorDialogOpen(false)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al actualizar el sensor",
          variant: "destructive",
        })
      }
    },
    [updateSensor, toast],
  )

  // Handle editing a sensor
  const handleEditSensor = useCallback((sensor: any) => {
    setSelectedSensor(sensor)
    setIsEditSensorDialogOpen(true)
  }, [])

  // Handle delete click
  const handleDeleteClick = useCallback((sensor: any) => {
    setSelectedSensor(sensor)
    setIsDeleteDialogOpen(true)
  }, [])

  // Confirm sensor deletion
  const handleConfirmDelete = useCallback(async () => {
    if (selectedSensor) {
      try {
        await deleteSensor(selectedSensor.id_sensor_instalado)
        toast({
          title: "Sensor eliminado",
          description: `El sensor ${selectedSensor.name} ha sido eliminado exitosamente.`,
        })
        setIsDeleteDialogOpen(false)
        setSelectedSensor(null)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al eliminar el sensor",
          variant: "destructive",
        })
      }
    }
  }, [selectedSensor, deleteSensor, toast])

  // Toggle sensor status between active and inactive
  const toggleSensorStatus = useCallback(
    async (sensor: any) => {
      // Solo marca estado local si el backend soporta ese campo. Aquí evitamos cambiar al azar.
      toast({
        title: `Acción no disponible`,
        description: `El estado del sensor se determina por recencia de lecturas.`,
      })
    },
    [toast],
  )

  if (loadingBranches || loadingSensors) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6 flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando sensores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-8">
      <PageHeader
        title="Sensores"
        description="Gestión y configuración de sensores multiparamétricos"
        icon={Activity}
        actions={
          <Button onClick={() => setIsAddSensorDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Sensor
          </Button>
        }
      />

      {/* View Mode Toggle */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Modo de Vista</h3>
              <p className="text-sm text-muted-foreground">Selecciona cómo quieres visualizar los sensores</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <Button
                variant={viewMode === "hierarchical" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("hierarchical")}
                className="h-8 px-3 text-xs"
              >
                <Factory className="h-3 w-3 mr-1" />
                Jerárquico
              </Button>
              <Button
                variant={viewMode === "simple" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("simple")}
                className="h-8 px-3 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Vista Simple
              </Button>
              <Button
                variant={viewMode === "advanced" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("advanced")}
                className="h-8 px-3 text-xs"
              >
                <List className="h-3 w-3 mr-1" />
                Vista Avanzada
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensor Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{sensorStats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{sensorStats.active}</div>
            <div className="text-sm text-muted-foreground">Activos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{sensorStats.alert}</div>
            <div className="text-sm text-muted-foreground">En Alerta</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{sensorStats.offline}</div>
            <div className="text-sm text-muted-foreground">Desconectados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{sensorStats.maintenance}</div>
            <div className="text-sm text-muted-foreground">Mantenimiento</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for sensors requiring attention */}
      {(sensorStats.alert > 0 || sensorStats.offline > 0) && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Atención requerida:</strong> {sensorStats.alert} sensor(es) en alerta y {sensorStats.offline}{" "}
            sensor(es) desconectado(s).
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-2">Filtros</h2>
          <p className="text-sm text-muted-foreground mb-4">Busca y filtra los sensores</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar sensores..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="ph">pH</SelectItem>
                <SelectItem value="temperature">Temperatura</SelectItem>
                <SelectItem value="oxygen">Oxígeno</SelectItem>
                <SelectItem value="nitrates">Nitratos</SelectItem>
                <SelectItem value="ammonia">Amonio</SelectItem>
                <SelectItem value="salinity">Salinidad</SelectItem>
                <SelectItem value="turbidity">Turbidez</SelectItem>
                <SelectItem value="barometric">Presión Atmosférica</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="alert">Alerta</SelectItem>
                <SelectItem value="offline">Desconectado</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sucursales</SelectItem>
                {branches
                  .filter((branch) => branch.id != null && branch.nombre)
                  .map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las instalaciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las instalaciones</SelectItem>
                {availableFacilities.map((facility) => (
                  <SelectItem key={facility} value={facility}>
                    {facility}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Legend Section - Solo mostrar en vista avanzada */}
      {viewMode === "advanced" && (
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Leyenda del estado de los sensores:</h3>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded-full" style={{ backgroundColor: "#dc2626" }}></div>
                <span className="text-gray-600 dark:text-gray-400 font-semibold">Crítico</span>
                <span className="text-xs text-gray-500">(fuera del margen de advertencia)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-600 rounded-full" style={{ backgroundColor: "#eab308" }}></div>
                <span className="text-gray-600 dark:text-gray-400 font-semibold">Advertencia</span>
                <span className="text-xs text-gray-500">(±20% del rango óptimo)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded-full" style={{ backgroundColor: "#22c55e" }}></div>
                <span className="text-gray-600 dark:text-gray-400 font-semibold">Óptimo</span>
                <span className="text-xs text-gray-500">(dentro del rango ideal)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 sm:grid-cols-5 mb-4">
          <TabsTrigger value="todos">
            Todos
            <Badge variant="secondary" className="ml-2">
              {sensors.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ph">
            pH
            <Badge variant="secondary" className="ml-2">
              {sensors.filter((s) => s.type === "ph").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="temperatura">
            Temperatura
            <Badge variant="secondary" className="ml-2">
              {sensors.filter((s) => s.type === "temperature").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="oxigeno">
            Oxígeno
            <Badge variant="secondary" className="ml-2">
              {sensors.filter((s) => s.type === "oxygen").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="otros">
            Otros
            <Badge variant="secondary" className="ml-2">
              {sensors.filter((s) => !["ph", "temperature", "oxygen"].includes(s.type)).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="space-y-6">
            {Object.keys(organizedSensors).length > 0 ? (
              <HierarchicalOrganization
                organizedData={organizedSensors}
                viewMode={viewMode}
                onToggleStatus={toggleSensorStatus}
                onEdit={handleEditSensor}
                onDelete={handleDeleteClick}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-lg font-medium mb-2">No se encontraron sensores</p>
                <p className="text-muted-foreground mb-6">
                  {sensors.length === 0
                    ? "No hay sensores registrados en el sistema. Comience agregando su primer sensor."
                    : "No hay sensores que coincidan con los criterios de búsqueda actuales"}
                </p>
                <Button onClick={() => setIsAddSensorDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Sensor
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Sensor Dialog */}
      <AddSensorDialog
        open={isAddSensorDialogOpen}
        onOpenChange={setIsAddSensorDialogOpen}
        onAddSensor={handleAddSensor}
        branches={branches}
        getNextSensorId={getNextSensorId}
      />

      {/* Edit Sensor Dialog */}
      {selectedSensor && (
        <EditSensorDialog
          open={isEditSensorDialogOpen}
          onOpenChange={setIsEditSensorDialogOpen}
          onUpdateSensor={handleUpdateSensor}
          sensor={selectedSensor}
          branches={branches}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Eliminar Sensor"
        description={`¿Está seguro que desea eliminar el sensor ${selectedSensor?.name || selectedSensor?.id_sensor_instalado}? Esta acción no se puede deshacer.`}
      />
    </div>
  )
}
