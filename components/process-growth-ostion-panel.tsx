"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Plus, Ruler, Save, Scale, Sprout } from "lucide-react"
import { backendApi } from "@/lib/backend-client"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { CrecimientoOstionCaptura, CrecimientoOstionConfig, ProcesoDetallado } from "@/types/proceso"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

type CaptureDraft = {
  fecha_programada: string
  fecha_real: string
  observaciones: string
  mediciones: Record<number, { valor: string; unidad: "cm" | "kg"; observaciones: string }>
}

function todayDateValue() {
  return new Date().toISOString().split("T")[0] || ""
}

function buildCaptureDraft(config: CrecimientoOstionConfig, capture: CrecimientoOstionCaptura): CaptureDraft {
  const mediciones: CaptureDraft["mediciones"] = {}

  for (let lote = 1; lote <= config.lotes_por_captura; lote += 1) {
    const existing = capture.mediciones?.find((item) => item.lote_numero === lote)
    mediciones[lote] = {
      valor: existing?.valor != null ? String(existing.valor) : "",
      unidad: existing?.unidad ?? "cm",
      observaciones: existing?.observaciones ?? "",
    }
  }

  return {
    fecha_programada: capture.fecha_programada ?? "",
    fecha_real: capture.fecha_real ?? "",
    observaciones: capture.observaciones ?? "",
    mediciones,
  }
}

function getEstadoBadgeVariant(estado?: string) {
  switch (estado) {
    case "completada":
      return "default" as const
    case "parcial":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

export function ProcessGrowthOstionPanel({ proceso }: { proceso: ProcesoDetallado }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [config, setConfig] = useState<CrecimientoOstionConfig | null>(proceso.crecimiento_ostion ?? null)
  const [drafts, setDrafts] = useState<Record<number, CaptureDraft>>({})
  const [configForm, setConfigForm] = useState({
    capturas_requeridas: proceso.crecimiento_ostion?.capturas_requeridas ?? 1,
    lotes_por_captura: proceso.crecimiento_ostion?.lotes_por_captura ?? 1,
  })
  const [extraCapture, setExtraCapture] = useState({
    fecha_programada: todayDateValue(),
    observaciones: "",
  })
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingCaptureId, setSavingCaptureId] = useState<number | null>(null)
  const [savingMeasurementId, setSavingMeasurementId] = useState<number | null>(null)

  const canConfigure = user?.role === "superadmin"
  const canOperate = Boolean(user)

  const captureList = useMemo(
    () => [...(config?.capturas ?? [])].sort((a, b) => a.numero_captura - b.numero_captura),
    [config?.capturas],
  )

  const hydrateDrafts = (nextConfig: CrecimientoOstionConfig | null) => {
    if (!nextConfig) {
      setDrafts({})
      return
    }

    const nextDrafts: Record<number, CaptureDraft> = {}
    for (const capture of nextConfig.capturas ?? []) {
      if (!capture.id_crecimiento_ostion_captura) continue
      nextDrafts[capture.id_crecimiento_ostion_captura] = buildCaptureDraft(nextConfig, capture)
    }
    setDrafts(nextDrafts)
    setConfigForm({
      capturas_requeridas: nextConfig.capturas_requeridas,
      lotes_por_captura: nextConfig.lotes_por_captura,
    })
  }

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await backendApi.getProcesoCrecimientoOstion(proceso.id_proceso)
      const nextConfig = (response as CrecimientoOstionConfig | null) ?? null
      setConfig(nextConfig)
      hydrateDrafts(nextConfig)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo cargar el crecimiento del ostión"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadConfig()
  }, [proceso.id_proceso])

  const updateCaptureDraft = (captureId: number, updater: (current: CaptureDraft) => CaptureDraft) => {
    setDrafts((prev) => {
      const current = prev[captureId]
      if (!current) return prev
      return {
        ...prev,
        [captureId]: updater(current),
      }
    })
  }

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true)
      const response = await backendApi.updateProcesoCrecimientoOstion(proceso.id_proceso, {
        capturas_requeridas: configForm.capturas_requeridas,
        lotes_por_captura: configForm.lotes_por_captura,
        calendario_modo: "automatico",
      })
      const nextConfig = response as CrecimientoOstionConfig
      setConfig(nextConfig)
      hydrateDrafts(nextConfig)
      toast({
        title: "Configuración guardada",
        description: "Se actualizó el calendario de crecimiento del ostión.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la configuración"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSavingConfig(false)
    }
  }

  const handleSaveCapture = async (capture: CrecimientoOstionCaptura) => {
    const captureId = capture.id_crecimiento_ostion_captura
    if (!captureId) return

    try {
      setSavingCaptureId(captureId)
      const draft = drafts[captureId]
      const response = await backendApi.updateProcesoCrecimientoOstionCaptura(proceso.id_proceso, captureId, {
        fecha_programada: draft.fecha_programada || undefined,
        fecha_real: draft.fecha_real || undefined,
        observaciones: draft.observaciones || undefined,
      })
      const nextConfig = response as CrecimientoOstionConfig
      setConfig(nextConfig)
      hydrateDrafts(nextConfig)
      toast({
        title: "Captura actualizada",
        description: `La captura ${capture.numero_captura} quedó actualizada.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la captura"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSavingCaptureId(null)
    }
  }

  const handleSaveMeasurements = async (capture: CrecimientoOstionCaptura) => {
    const captureId = capture.id_crecimiento_ostion_captura
    if (!captureId) return

    const draft = drafts[captureId]
    const mediciones = Object.entries(draft.mediciones)
      .map(([lote, value]) => ({
        lote_numero: Number(lote),
        valor: value.valor.trim() ? Number(value.valor) : NaN,
        unidad: value.unidad,
        observaciones: value.observaciones || undefined,
      }))
      .filter((item) => Number.isFinite(item.valor))

    if (mediciones.length === 0) {
      toast({
        title: "Sin datos",
        description: "Captura al menos una medición antes de guardar.",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingMeasurementId(captureId)
      const response = await backendApi.saveProcesoCrecimientoOstionMediciones(proceso.id_proceso, captureId, {
        fecha_real: draft.fecha_real || undefined,
        observaciones: draft.observaciones || undefined,
        mediciones,
      })
      const nextConfig = response as CrecimientoOstionConfig
      setConfig(nextConfig)
      hydrateDrafts(nextConfig)
      toast({
        title: "Mediciones guardadas",
        description: `La captura ${capture.numero_captura} quedó registrada.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron guardar las mediciones"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSavingMeasurementId(null)
    }
  }

  const handleCreateExtraCapture = async () => {
    if (!config) return

    try {
      setSavingConfig(true)
      const response = await backendApi.createProcesoCrecimientoOstionCaptura(proceso.id_proceso, {
        fecha_programada: extraCapture.fecha_programada,
        observaciones: extraCapture.observaciones || undefined,
      })
      const nextConfig = response as CrecimientoOstionConfig
      setConfig(nextConfig)
      hydrateDrafts(nextConfig)
      setExtraCapture({
        fecha_programada: todayDateValue(),
        observaciones: "",
      })
      toast({
        title: "Captura extra agregada",
        description: "Ya puedes registrar un periodo adicional de crecimiento.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo agregar la captura extra"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSavingConfig(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crecimiento del Ostión</CardTitle>
          <CardDescription>Cargando configuración y capturas de crecimiento...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-36 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-cyan-200 bg-cyan-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-cyan-700" />
            Crecimiento del Ostión
          </CardTitle>
          <CardDescription>
            Programa capturas periódicas y registra el tamaño o peso de cada lote en cm o kg.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {canConfigure ? (
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="capturas_requeridas">Capturas requeridas</Label>
                <Input
                  id="capturas_requeridas"
                  type="number"
                  min={1}
                  max={100}
                  value={configForm.capturas_requeridas}
                  onChange={(event) =>
                    setConfigForm((prev) => ({
                      ...prev,
                      capturas_requeridas: Number.parseInt(event.target.value || "1", 10),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lotes_por_captura">Lotes por captura</Label>
                <Input
                  id="lotes_por_captura"
                  type="number"
                  min={1}
                  max={100}
                  value={configForm.lotes_por_captura}
                  onChange={(event) =>
                    setConfigForm((prev) => ({
                      ...prev,
                      lotes_por_captura: Number.parseInt(event.target.value || "1", 10),
                    }))
                  }
                />
              </div>
              <Button onClick={() => void handleSaveConfig()} disabled={savingConfig}>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Capturas requeridas</p>
                <p className="text-2xl font-semibold">{config?.capturas_requeridas ?? 0}</p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Lotes por captura</p>
                <p className="text-2xl font-semibold">{config?.lotes_por_captura ?? 0}</p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm text-muted-foreground">Capturas completadas</p>
                <p className="text-2xl font-semibold">
                  {config?.capturas_completadas ?? 0}
                  <span className="text-base font-normal text-muted-foreground"> / {config?.total_capturas ?? 0}</span>
                </p>
              </div>
            </div>
          )}

          {!config && !canConfigure && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Este proceso todavía no tiene configuración de crecimiento del ostión.
            </div>
          )}

          {config && canOperate && (
            <div className="rounded-lg border bg-background p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Agregar captura extra</h3>
                  <p className="text-sm text-muted-foreground">
                    Si la planeación quedó corta, agrega una nueva captura sin perder las anteriores.
                  </p>
                </div>
                <Badge variant="outline">{config.total_capturas ?? captureList.length} capturas totales</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="extra_fecha_programada">Fecha programada</Label>
                  <Input
                    id="extra_fecha_programada"
                    type="date"
                    value={extraCapture.fecha_programada}
                    onChange={(event) => setExtraCapture((prev) => ({ ...prev, fecha_programada: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extra_observaciones">Observaciones</Label>
                  <Input
                    id="extra_observaciones"
                    value={extraCapture.observaciones}
                    onChange={(event) => setExtraCapture((prev) => ({ ...prev, observaciones: event.target.value }))}
                    placeholder="Motivo o nota breve"
                  />
                </div>
                <Button onClick={() => void handleCreateExtraCapture()} disabled={savingConfig}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar captura
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {config && captureList.length > 0 && (
        <div className="space-y-4">
          {captureList.map((capture) => {
            const captureId = capture.id_crecimiento_ostion_captura
            if (!captureId) return null

            const draft = drafts[captureId]
            return (
              <Card key={captureId}>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-cyan-700" />
                        Captura {capture.numero_captura}
                        {capture.es_extra && <Badge variant="secondary">Extra</Badge>}
                      </CardTitle>
                      <CardDescription>
                        Registra {config.lotes_por_captura} lote(s). Puedes guardar parcial y continuar después.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getEstadoBadgeVariant(capture.estado)}>{capture.estado}</Badge>
                      <Badge variant="outline">{capture.total_mediciones ?? capture.mediciones?.length ?? 0} mediciones</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Fecha programada</Label>
                      <Input
                        type="date"
                        value={draft?.fecha_programada ?? ""}
                        onChange={(event) =>
                          updateCaptureDraft(captureId, (current) => ({
                            ...current,
                            fecha_programada: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha real</Label>
                      <Input
                        type="date"
                        value={draft?.fecha_real ?? ""}
                        onChange={(event) =>
                          updateCaptureDraft(captureId, (current) => ({
                            ...current,
                            fecha_real: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Observaciones</Label>
                      <Input
                        value={draft?.observaciones ?? ""}
                        onChange={(event) =>
                          updateCaptureDraft(captureId, (current) => ({
                            ...current,
                            observaciones: event.target.value,
                          }))
                        }
                        placeholder="Nota breve de la captura"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Lotes registrados</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleSaveCapture(capture)}
                          disabled={savingCaptureId === captureId}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Guardar agenda
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => void handleSaveMeasurements(capture)}
                          disabled={savingMeasurementId === captureId}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Guardar mediciones
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {Array.from({ length: config.lotes_por_captura }, (_, index) => {
                        const lote = index + 1
                        const medicionDraft = draft?.mediciones[lote]
                        return (
                          <div key={`${captureId}-${lote}`} className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Lote {lote}</h5>
                              <Badge variant="outline">Dato individual</Badge>
                            </div>
                            <div className="grid gap-3 md:grid-cols-[1fr_150px]">
                              <div className="space-y-2">
                                <Label>Valor</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={medicionDraft?.valor ?? ""}
                                  onChange={(event) =>
                                    updateCaptureDraft(captureId, (current) => ({
                                      ...current,
                                      mediciones: {
                                        ...current.mediciones,
                                        [lote]: {
                                          ...current.mediciones[lote],
                                          valor: event.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="Ej. 6.5"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Unidad</Label>
                                <Select
                                  value={medicionDraft?.unidad ?? "cm"}
                                  onValueChange={(value) =>
                                    updateCaptureDraft(captureId, (current) => ({
                                      ...current,
                                      mediciones: {
                                        ...current.mediciones,
                                        [lote]: {
                                          ...current.mediciones[lote],
                                          unidad: value as "cm" | "kg",
                                        },
                                      },
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cm">
                                      <div className="flex items-center gap-2">
                                        <Ruler className="h-4 w-4" />
                                        cm
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="kg">
                                      <div className="flex items-center gap-2">
                                        <Scale className="h-4 w-4" />
                                        kg
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Observaciones del lote</Label>
                              <Textarea
                                value={medicionDraft?.observaciones ?? ""}
                                onChange={(event) =>
                                  updateCaptureDraft(captureId, (current) => ({
                                    ...current,
                                    mediciones: {
                                      ...current.mediciones,
                                      [lote]: {
                                        ...current.mediciones[lote],
                                        observaciones: event.target.value,
                                      },
                                    },
                                  }))
                                }
                                rows={2}
                                placeholder="Comentario opcional"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
