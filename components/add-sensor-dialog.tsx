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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import type { Branch } from "@/types/branch"

interface SensorData {
  type: string
  name: string
  branchId: string
  facilityId: string
  parameter?: string
  unit?: string
  customId?: string
  notes?: string
}

interface AddSensorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSensor: (sensorData: SensorData) => void
  branches: Branch[]
  getNextSensorId: (type: string) => string
}

export default function AddSensorDialog({
  open,
  onOpenChange,
  onAddSensor,
  branches,
  getNextSensorId,
}: AddSensorDialogProps) {
  const [sensorType, setSensorType] = useState("")
  const [sensorName, setSensorName] = useState("")
  const [branchId, setBranchId] = useState("")
  const [facilityId, setFacilityId] = useState("")
  const [parameter, setParameter] = useState("")
  const [unit, setUnit] = useState("")
  const [useCustomId, setUseCustomId] = useState(false)
  const [customId, setCustomId] = useState("")
  const [notes, setNotes] = useState("")
  const [facilities, setFacilities] = useState<{ id: string; name: string; type: string }[]>([])
  const [catalogo, setCatalogo] = useState<{ id_sensor: number; sensor: string; unidad_medida?: string }[]>([])
  const [nextSensorId, setNextSensorId] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationStatus, setValidationStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle")

  // Cargar catálogo de sensores al abrir
  useEffect(() => {
    if (!open) return
    fetch('/api/catalogo-sensores')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCatalogo(data)
      })
      .catch(() => {})
  }, [open])

  // Actualizar las instalaciones cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (branchId) {
      // Cargar instalaciones reales desde API por sucursal
      fetch(`/api/instalaciones?id_empresa_sucursal=${branchId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const list = Array.isArray(data)
            ? data.map((i: any) => ({ id: String(i.id_instalacion), name: i.nombre_instalacion, type: i.tipo_uso }))
            : []
          setFacilities(list)
          setValidationStatus(list.length > 0 ? "valid" : "invalid")
        })
        .catch(() => {
          setFacilities([])
          setValidationStatus("invalid")
        })
      setFacilityId("")
    } else {
      setFacilities([])
      setValidationStatus("idle")
    }
  }, [branchId, branches])

  // Actualizar el ID del sensor cuando cambia el tipo
  useEffect(() => {
    if (sensorType && !useCustomId) {
      setNextSensorId(getNextSensorId(sensorType))
    }
  }, [sensorType, useCustomId, getNextSensorId])

  // Auto-fill unit based on sensor type
  useEffect(() => {
    if (sensorType && !unit) {
      const defaultUnits: Record<string, string> = {
        ph: "pH",
        temperature: "°C",
        oxygen: "mg/L",
        salinity: "ppt",
        turbidity: "NTU",
        nitrates: "mg/L",
        ammonia: "mg/L",
        barometric: "hPa",
      }
      setUnit(defaultUnits[sensorType] || "")
    }
  }, [sensorType, unit])

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
  }, [sensorType, sensorName, branchId, facilityId, customId])

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

    if (useCustomId && !customId.trim()) {
      newErrors.customId = "El ID personalizado es obligatorio"
    }

    if (useCustomId && customId.trim() && !/^[A-Za-z0-9-_]+$/.test(customId.trim())) {
      newErrors.customId = "El ID solo puede contener letras, números, guiones y guiones bajos"
    }

    if (useCustomId && customId.trim().length < 3) {
      newErrors.customId = "El ID debe tener al menos 3 caracteres"
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

  const resetForm = () => {
    setSensorType("")
    setSensorName("")
    setBranchId("")
    setFacilityId("")
    setParameter("")
    setUnit("")
    setUseCustomId(false)
    setCustomId("")
    setNotes("")
    setErrors({})
    setValidationStatus("idle")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onAddSensor({
        type: sensorType,
        name: sensorName.trim(),
        branchId,
        facilityId,
        parameter: parameter.trim() || undefined,
        unit: unit.trim() || undefined,
        customId: useCustomId ? customId.trim() : undefined,
        notes: notes.trim() || undefined,
      })

      resetForm()
      onOpenChange(false)
    } catch (error: any) {
      setErrors({ submit: error.message || "Error al crear el sensor" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onOpenChange(false)
    }
  }

  const selectedBranch = branches.find((b) => String(b.id) === branchId)
  const selectedFacility = facilities.find((f) => f.id === facilityId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Sensor</DialogTitle>
          <DialogDescription>Complete los datos para registrar un nuevo sensor en el sistema.</DialogDescription>
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

            <div className="grid gap-2">
              <Label htmlFor="sensor-type">
                Tipo de Sensor <span className="text-red-500">*</span>
              </Label>
              <Select value={sensorType} onValueChange={(v) => { setSensorType(v); const found = catalogo.find(c => String(c.id_sensor) === v); if (found?.unidad_medida) setUnit(found.unidad_medida) }}>
                <SelectTrigger id="sensor-type" className={errors.sensorType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccionar tipo (catálogo)" />
                </SelectTrigger>
                <SelectContent>
                  {catalogo.map((c) => (
                    <SelectItem key={c.id_sensor} value={String(c.id_sensor)}>
                      {c.sensor} {c.unidad_medida ? `(${c.unidad_medida})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sensorType && <p className="text-sm text-red-500">{errors.sensorType}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sensor-name">
                Nombre del Sensor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sensor-name"
                value={sensorName}
                onChange={(e) => setSensorName(e.target.value)}
                placeholder="Ej: Sensor pH Principal"
                className={errors.sensorName ? "border-red-500" : ""}
              />
              {errors.sensorName && <p className="text-sm text-red-500">{errors.sensorName}</p>}
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
                    const locStr = typeof loc === "string" ? loc : loc ? `${loc.lat}, ${loc.lng}` : ""
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
              <p className="text-xs text-muted-foreground">
                Opcional: Especifique qué parámetro específico monitoreará este sensor
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit">Unidad de Medición</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ej: pH, °C, mg/L, ppm, etc."
              />
              <p className="text-xs text-muted-foreground">
                Opcional: Unidad en la que el sensor reporta sus mediciones
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="use-custom-id"
                checked={useCustomId}
                onCheckedChange={(checked) => setUseCustomId(!!checked)}
              />
              <Label htmlFor="use-custom-id" className="text-sm font-normal">
                Usar ID personalizado
              </Label>
            </div>

            {useCustomId ? (
              <div className="grid gap-2">
                <Label htmlFor="custom-id">
                  ID Personalizado <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="custom-id"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="Ej: pH-PRINCIPAL-01"
                  className={errors.customId ? "border-red-500" : ""}
                />
                {errors.customId && <p className="text-sm text-red-500">{errors.customId}</p>}
                <p className="text-xs text-muted-foreground">Solo letras, números, guiones (-) y guiones bajos (_)</p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="next-id">ID Asignado Automáticamente</Label>
                <Input id="next-id" value={nextSensorId} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Este ID se generará automáticamente siguiendo la secuencia del tipo de sensor.
                </p>
              </div>
            )}

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
              {isSubmitting ? "Guardando..." : "Añadir Sensor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
