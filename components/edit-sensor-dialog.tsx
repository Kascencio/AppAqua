"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Info } from "lucide-react"
import type { Branch } from "@/types/branch"
import type { Sensor } from "@/hooks/use-sensors"

interface EditSensorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateSensor: (sensorData: Partial<Sensor>) => void
  sensor: Sensor
  branches: Branch[]
}

export default function EditSensorDialog({
  open,
  onOpenChange,
  onUpdateSensor,
  sensor,
  branches,
}: EditSensorDialogProps) {
  const [sensorType, setSensorType] = useState(sensor.type)
  const [sensorName, setSensorName] = useState(sensor.name || "")
  const [branchId, setBranchId] = useState(String(sensor.branchId || ""))
  const [facilityId, setFacilityId] = useState(String(sensor.facilityId || ""))
  const [parameter, setParameter] = useState(sensor.currentParameter || "")
  const [unit, setUnit] = useState(sensor.unit || "")
  const [status, setStatus] = useState<"active" | "inactive" | "alert" | "offline" | "maintenance">(sensor.status || "active")
  const [notes, setNotes] = useState(sensor.notes || "")
  const [facilities, setFacilities] = useState<{ id: string; name: string; type: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationStatus, setValidationStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle")

  // Actualizar las instalaciones cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (branchId) {
      const selectedBranch = branches.find((b) => String(b.id) === branchId)
      if (selectedBranch) {
        setFacilities(
          (selectedBranch.facilities || []).map((f) => ({
            id: String(f.id),
            name: f.name,
            type: f.type || "",
          })),
        )
        setValidationStatus("valid")
      } else {
        setFacilities([])
        setValidationStatus("invalid")
      }
    } else {
      setFacilities([])
      setValidationStatus("idle")
    }
  }, [branchId, branches])

  // Inicializar los valores cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setSensorType(sensor.type)
      setSensorName(sensor.name || "")
      setBranchId(String(sensor.branchId || ""))
      setFacilityId(String(sensor.facilityId || ""))
      setParameter(sensor.currentParameter || "")
      setUnit(sensor.unit || "")
      setStatus(sensor.status || "active")
      setNotes(sensor.notes || "")
      setErrors({})
      setValidationStatus("idle")
    }
  }, [open, sensor])

  // Limpiar errores cuando se cambian los valores
  useEffect(() => {
    setErrors({})
    setValidationStatus("validating")

    // Simulate validation delay
    const timer = setTimeout(() => {
      if (sensorType && sensorName && branchId && facilityId) {
        setValidationStatus("valid")
      } else if (sensorType || sensorName || branchId || facilityId) {
        setValidationStatus("invalid")
      } else {
        setValidationStatus("idle")
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [sensorType, sensorName, branchId, facilityId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!sensorType) {
      newErrors.sensorType = "El tipo de sensor es obligatorio"
    }

    if (!sensorName.trim()) {
      newErrors.sensorName = "El nombre del sensor es obligatorio"
    } else if (sensorName.trim().length < 3) {
      newErrors.sensorName = "El nombre debe tener al menos 3 caracteres"
    }

    if (!branchId) {
      newErrors.branchId = "La sucursal es obligatoria"
    }

    if (!facilityId) {
      newErrors.facilityId = "La instalación es obligatoria"
    }

    // Validate branch-facility relationship
    if (branchId && facilityId) {
      const selectedBranch = branches.find((b) => String(b.id) === branchId)
      const facilityExists = (selectedBranch?.facilities || []).some((f) => String(f.id) === facilityId)
      if (!facilityExists) {
        newErrors.facilityId = "La instalación seleccionada no pertenece a la sucursal"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onUpdateSensor({
        id: sensor.id,
        type: sensorType,
        name: sensorName.trim(),
        branchId,
        facilityId,
        currentParameter: parameter.trim() || undefined,
        unit: unit.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
        parameters: parameter.trim() ? [parameter.trim()] : [],
      })

      onOpenChange(false)
    } catch (error: any) {
      setErrors({ submit: error.message || "Error al actualizar el sensor" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  const selectedBranch = branches.find((b) => String(b.id) === branchId)
  const selectedFacility = facilities.find((f) => f.id === facilityId)

  // Check if sensor location has changed
  const locationChanged = branchId !== sensor.branchId || facilityId !== sensor.facilityId

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Sensor</DialogTitle>
          <DialogDescription>Modifique los datos del sensor {sensor.id}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {errors.submit && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            {validationStatus === "valid" && !errors.submit && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Formulario válido. Todos los campos obligatorios están completos.
                </AlertDescription>
              </Alert>
            )}

            {locationChanged && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  ⚠️ Ha cambiado la ubicación del sensor. Esto afectará las relaciones con la instalación actual.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="sensor-id">ID del Sensor</Label>
              <Input id="sensor-id" value={sensor.id} disabled className="bg-muted font-mono" />
              <p className="text-xs text-muted-foreground">El ID del sensor no se puede modificar</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sensor-name">
                Nombre del Sensor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sensor-name"
                value={sensorName}
                onChange={(e) => setSensorName(e.target.value)}
                placeholder="Nombre descriptivo del sensor"
                className={errors.sensorName ? "border-red-500" : ""}
              />
              {errors.sensorName && <p className="text-sm text-red-500">{errors.sensorName}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sensor-type">
                Tipo de Sensor <span className="text-red-500">*</span>
              </Label>
              <Select value={sensorType} onValueChange={setSensorType}>
                <SelectTrigger id="sensor-type" className={errors.sensorType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ph">pH</SelectItem>
                  <SelectItem value="temperature">Temperatura</SelectItem>
                  <SelectItem value="oxygen">Oxígeno</SelectItem>
                  <SelectItem value="salinity">Salinidad</SelectItem>
                  <SelectItem value="turbidity">Turbidez</SelectItem>
                  <SelectItem value="nitrates">Nitratos</SelectItem>
                  <SelectItem value="ammonia">Amonio</SelectItem>
                  <SelectItem value="barometric">Presión Atmosférica</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.sensorType && <p className="text-sm text-red-500">{errors.sensorType}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sensor-status">Estado del Sensor</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as "active" | "inactive" | "alert" | "offline" | "maintenance")}>
                <SelectTrigger id="sensor-status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="alert">Alerta</SelectItem>
                  <SelectItem value="offline">Desconectado</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="branch">
                Sucursal <span className="text-red-500">*</span>
              </Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger id="branch" className={errors.branchId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => {
                    const loc = branch.location
                    const locStr = typeof loc === 'string' ? loc : loc ? `${loc.lat}, ${loc.lng}` : ''
                    return (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name} - {locStr}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {errors.branchId && <p className="text-sm text-red-500">{errors.branchId}</p>}
              {selectedBranch && (
                <p className="text-xs text-green-600">
                  ✓ Sucursal seleccionada: {selectedBranch.name} ({(selectedBranch.facilities || []).length} instalaciones
                  disponibles)
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="facility">
                Instalación <span className="text-red-500">*</span>
              </Label>
              <Select value={facilityId} onValueChange={setFacilityId} disabled={!branchId}>
                <SelectTrigger id="facility" className={errors.facilityId ? "border-red-500" : ""}>
                  <SelectValue placeholder={branchId ? "Seleccionar instalación" : "Primero seleccione una sucursal"} />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name} ({facility.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.facilityId && <p className="text-sm text-red-500">{errors.facilityId}</p>}
              {selectedFacility && (
                <p className="text-xs text-green-600">
                  ✓ Instalación seleccionada: {selectedFacility.name} (Tipo: {selectedFacility.type})
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="parameter">Parámetro a Monitorear</Label>
              <Input
                id="parameter"
                value={parameter}
                onChange={(e) => setParameter(e.target.value)}
                placeholder="Ej: pH del agua, Temperatura ambiente, Oxígeno disuelto"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit">Unidad de Medición</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ej: pH, °C, mg/L, ppm, etc."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre el sensor..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || validationStatus !== "valid"}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
