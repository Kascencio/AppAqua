"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
} from "@/components/ui/map"
import { AlertTriangle, MapPin, Navigation, Plus, X } from "lucide-react"
import type { Branch } from "@/types/branch"

interface MapComponentProps {
  branches: Branch[]
  center?: [number, number]
  onBranchSelect: (branchId: string) => void
  flyToPosition?: [number, number] | null
}

type Coordinate = { lng: number; lat: number }

function toLngLatFromBranch(branch: Branch): Coordinate | null {
  const coords = Array.isArray(branch.coordinates) ? branch.coordinates : null
  if (coords && coords.length === 2) {
    const lat = Number(coords[0])
    const lng = Number(coords[1])
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lng, lat }
    }
  }

  const location = branch.location
  if (location && Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    return { lng: Number(location.lng), lat: Number(location.lat) }
  }

  return null
}

function MapFlyTo({ target }: { target: [number, number] | null }) {
  const { map } = useMap()

  useEffect(() => {
    if (!map || !target) return
    // target llega en [lat, lng], MapLibre usa [lng, lat]
    map.flyTo({ center: [target[1], target[0]], zoom: 13, duration: 1400 })
  }, [map, target])

  return null
}

function MapClickCapture({
  enabled,
  onPointAdded,
}: {
  enabled: boolean
  onPointAdded: (point: Coordinate) => void
}) {
  const { map } = useMap()

  useEffect(() => {
    if (!map || !enabled) return

    const handleClick = (event: any) => {
      const point = {
        lng: Number(event.lngLat.lng),
        lat: Number(event.lngLat.lat),
      }
      onPointAdded(point)
    }

    map.getCanvas().style.cursor = "crosshair"
    map.on("click", handleClick)

    return () => {
      map.off("click", handleClick)
      map.getCanvas().style.cursor = ""
    }
  }, [enabled, map, onPointAdded])

  return null
}

export default function MapComponent({
  branches,
  center = [17.9869, -92.9303],
  onBranchSelect,
  flyToPosition = null,
}: MapComponentProps) {
  const [addPointMode, setAddPointMode] = useState(false)
  const [userPoint, setUserPoint] = useState<Coordinate | null>(null)

  const branchesWithCoords = useMemo(() => {
    return branches
      .map((branch) => {
        const coordinate = toLngLatFromBranch(branch)
        if (!coordinate) return null
        return {
          branch,
          coordinate,
          facilities: Array.isArray(branch.facilities) ? branch.facilities : [],
        }
      })
      .filter((item): item is { branch: Branch; coordinate: Coordinate; facilities: any[] } => Boolean(item))
  }, [branches])

  const branchHasAlerts = (branch: Branch): boolean => {
    const facilities = branch.facilities || []
    for (const facility of facilities) {
      const water = (facility as any).waterQuality || {}
      for (const config of Object.values(water as Record<string, any>)) {
        const value = Number((config as any).value ?? 0)
        const min = Number((config as any).minValue ?? 0)
        const max = Number((config as any).maxValue ?? 100)
        if (value < min || value > max) return true
      }
    }
    return false
  }

  const markerClass = (status: string, hasAlerts: boolean) => {
    if (hasAlerts) {
      return "h-4 w-4 rounded-full border-2 border-white bg-amber-500 shadow-[0_0_0_5px_rgba(245,158,11,0.24)]"
    }
    if (status === "active") {
      return "h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.24)]"
    }
    return "h-4 w-4 rounded-full border-2 border-white bg-slate-400 shadow-[0_0_0_5px_rgba(148,163,184,0.25)]"
  }

  return (
    <div className="h-full w-full relative rounded-lg overflow-hidden border">
      <Map
        className="h-full w-full"
        center={[center[1], center[0]]}
        zoom={6}
        maxZoom={18}
        minZoom={4}
      >
        <MapControls position="bottom-right" showZoom showLocate />
        <MapFlyTo target={flyToPosition} />
        <MapClickCapture
          enabled={addPointMode}
          onPointAdded={(point) => {
            setUserPoint(point)
            setAddPointMode(false)
          }}
        />

        {branchesWithCoords.map(({ branch, coordinate, facilities }) => {
          const hasAlerts = branchHasAlerts(branch)
          const sensorsTotal = facilities.reduce((total, facility) => {
            return total + (((facility as any).sensors || []).length || 0)
          }, 0)

          return (
            <MapMarker
              key={String(branch.id)}
              longitude={coordinate.lng}
              latitude={coordinate.lat}
              onClick={() => onBranchSelect(String(branch.id))}
            >
              <MarkerContent>
                <div className={markerClass(branch.status, hasAlerts)} />
              </MarkerContent>

              <MarkerPopup>
                <div className="space-y-3 min-w-[240px]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-tight">{branch.name}</p>
                    <Badge variant={branch.status === "active" ? "default" : "secondary"}>
                      {branch.status === "active" ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border p-2 text-center">
                      <p className="font-semibold text-sm">{facilities.length}</p>
                      <p className="text-muted-foreground">Instalaciones</p>
                    </div>
                    <div className="rounded-md border p-2 text-center">
                      <p className="font-semibold text-sm">{sensorsTotal}</p>
                      <p className="text-muted-foreground">Sensores</p>
                    </div>
                  </div>

                  {hasAlerts && (
                    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">Parámetros fuera de rango</span>
                    </div>
                  )}
                </div>
              </MarkerPopup>
            </MapMarker>
          )
        })}

        {userPoint && (
          <MapMarker longitude={userPoint.lng} latitude={userPoint.lat}>
            <MarkerContent>
              <div className="h-4 w-4 rounded-full border-2 border-white bg-primary shadow-[0_0_0_5px_rgba(14,165,233,0.24)]" />
            </MarkerContent>
            <MarkerPopup>
              <div className="space-y-2 text-sm min-w-[220px]">
                <p className="font-semibold">Punto agregado en el mapa</p>
                <p className="text-xs text-muted-foreground">
                  Lat: {userPoint.lat.toFixed(6)} | Lng: {userPoint.lng.toFixed(6)}
                </p>
              </div>
            </MarkerPopup>
          </MapMarker>
        )}
      </Map>

      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full border bg-background/95 p-1.5 shadow-md">
        <Button
          type="button"
          size="icon"
          variant={addPointMode ? "default" : "outline"}
          className="h-10 w-10 rounded-full"
          onClick={() => setAddPointMode((prev) => !prev)}
          title={addPointMode ? "Cancelar agregar punto" : "Agregar punto"}
        >
          {addPointMode ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>

        {userPoint && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full"
            onClick={() => setUserPoint(null)}
            title="Quitar punto"
          >
            <MapPin className="h-4 w-4" />
          </Button>
        )}

        <div className="hidden sm:flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <Navigation className="h-3 w-3" />
          {addPointMode ? "Haz clic en el mapa para colocar un punto" : "Modo navegación"}
        </div>
      </div>
    </div>
  )
}

export { MapComponent }
