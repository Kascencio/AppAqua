"use client"

import { useEffect, useState, useRef } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
  LayersControl,
  Circle,
  FeatureGroup,
} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Navigation, Plus, Minus, Locate, AlertTriangle, Droplets } from "lucide-react"
import Link from "next/link"
import type { Branch } from "@/types/branch"
import MarkerClusterGroup from "react-leaflet-cluster"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

// Componente para volar a un marcador específico
function FlyToMarker({ position }: { position: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, {
        duration: 1.5,
      })
    }
  }, [map, position])

  return null
}

// Componente para manejar el redimensionamiento del mapa
function ResizeHandler() {
  const map = useMap()

  useEffect(() => {
    // Función para actualizar el tamaño del mapa
    const handleResize = () => {
      map.invalidateSize()
    }

    // Agregar listener para el evento resize
    window.addEventListener("resize", handleResize)

    // Invalidar tamaño inicialmente y después de un breve retraso
    // para asegurar que el contenedor tenga el tamaño correcto
    handleResize()
    const timer = setTimeout(handleResize, 300)

    // Limpiar listeners al desmontar
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timer)
    }
  }, [map])

  return null
}

// Componente para añadir controles personalizados
function CustomControls() {
  const map = useMap()

  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 13 })
  }

  const handleZoomIn = () => {
    map.zoomIn()
  }

  const handleZoomOut = () => {
    map.zoomOut()
  }

  return (
    <div className="leaflet-top leaflet-left mt-16">
      <div className="leaflet-control leaflet-bar flex flex-col bg-white dark:bg-gray-800 shadow-md rounded-md overflow-hidden">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
                onClick={handleLocate}
              >
                <Locate className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Mi ubicación</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
                onClick={handleZoomIn}
              >
                <Plus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Acercar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={handleZoomOut}>
                <Minus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Alejar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

// Componente para mostrar leyenda del mapa
function MapLegend() {
  return (
    <div className="leaflet-bottom leaflet-right mb-10 mr-2">
      <div className="leaflet-control p-3 bg-white dark:bg-gray-800 shadow-md rounded-md">
        <h4 className="text-sm font-medium mb-2">Leyenda</h4>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs">Sucursal activa</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
            <span className="text-xs">Sucursal inactiva</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-xs">Con alertas</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MapComponentProps {
  branches: Branch[]
  center?: [number, number]
  onBranchSelect: (branchId: string) => void
  flyToPosition?: [number, number] | null
}

export default function MapComponent({ branches, center = [17.9869, -92.9303], onBranchSelect, flyToPosition = null }: MapComponentProps) {
  const [activeMarker, setActiveMarker] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapType, setMapType] = useState<string>("street")

  // Crear íconos personalizados para los marcadores
  const getMarkerIcon = (status: string, hasAlerts = false) => {
    let iconUrl = ""

    if (hasAlerts) {
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png"
    } else if (status === "active") {
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"
    } else {
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png"
    }

    return new L.Icon({
      iconUrl,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
  }

  // Verificar si una sucursal tiene alertas
  const branchHasAlerts = (branch: Branch): boolean => {
    const facilities = branch.facilities || []
    for (const facility of facilities) {
      const water = facility.waterQuality || {}
      for (const [param, config] of Object.entries(water as Record<string, any>)) {
        const value = Number((config as any).value ?? 0)
        const min = Number((config as any).minValue ?? 0)
        const max = Number((config as any).maxValue ?? 100)
        if (value < min || value > max) {
          return true
        }
      }
    }
    return false
  }

  // Calcular el radio del círculo basado en el número de instalaciones
  const getCircleRadius = (facilitiesCount: number): number => {
    return Math.max(100, facilitiesCount * 50)
  }

  // Corregir el problema de los íconos de Leaflet
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== "undefined") {
      // Solución para los íconos de Leaflet en Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      })
    }

    // Invalidar tamaño del mapa cuando se monta
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Observador de redimensionamiento para el contenedor del mapa
  useEffect(() => {
    if (!containerRef.current) return

    // Crear un ResizeObserver para detectar cambios en el tamaño del contenedor
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    })

    // Observar el contenedor del mapa
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        attributionControl={false}
        zoomControl={false} // Desactivamos el control de zoom predeterminado para posicionarlo mejor
        whenCreated={(map) => {
          mapRef.current = map
          setTimeout(() => map.invalidateSize(), 250)
        }}
        className="leaflet-map-container"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Terreno">
            <TileLayer
              attribution='&copy; <a href="https://www.opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay name="Áreas de cobertura">
            <FeatureGroup>
              {branches.map((branch) => (
                <Circle
                  key={`circle-${branch.id}`}
                  center={branch.coordinates}
                  radius={getCircleRadius((branch.facilities?.length) || 0)}
                  pathOptions={{
                    color: branchHasAlerts(branch) ? "#f59e0b" : branch.status === "active" ? "#10b981" : "#6b7280",
                    fillColor: branchHasAlerts(branch) ? "#fcd34d" : branch.status === "active" ? "#a7f3d0" : "#d1d5db",
                    fillOpacity: 0.3,
                    weight: 1,
                  }}
                />
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>
        </LayersControl>

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster) => {
            const childCount = cluster.getChildCount()
            let className = "marker-cluster-"

            if (childCount < 10) {
              className += "small"
            } else if (childCount < 100) {
              className += "medium"
            } else {
              className += "large"
            }

            return new L.DivIcon({
              html: `<div><span>${childCount}</span></div>`,
              className: `${className} marker-cluster-custom`,
              iconSize: new L.Point(40, 40),
            })
          }}
        >
          {branches.map((branch) => {
            const hasAlerts = branchHasAlerts(branch)
            const facilities = branch.facilities || []
            const sensorsTotal = facilities.reduce((total, facility) => total + ((facility as any).sensors?.length || 0), 0)
            return (
              <Marker
                key={branch.id}
                position={branch.coordinates}
                icon={getMarkerIcon(branch.status, hasAlerts)}
                eventHandlers={{
                  click: () => {
                    setActiveMarker(branch.id)
                    onBranchSelect(branch.id)
                  },
                }}
              >
                <Popup minWidth={250} maxWidth={320} className="map-popup">
                  <Card className="border-0 shadow-none">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-base">{branch.name}</h3>
                        <Badge variant={branch.status === "active" ? "success" : "secondary"}>
                          {branch.status === "active" ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{(branch as any).location || ''}</p>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-muted/30 p-2 rounded-md text-center">
                          <div className="text-sm font-medium">{facilities.length}</div>
                          <div className="text-xs text-muted-foreground">Instalaciones</div>
                        </div>

                        <div className="bg-muted/30 p-2 rounded-md text-center">
                          <div className="text-sm font-medium">{sensorsTotal}</div>
                          <div className="text-xs text-muted-foreground">Sensores</div>
                        </div>
                      </div>

                      {hasAlerts && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-md">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs">Parámetros fuera de rango</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 mb-3">
                        {facilities.slice(0, 3).map((facility: any) => (
                          <Badge key={facility.id} variant="outline" className="text-xs">
                            <Droplets className="h-3 w-3 mr-1" />
                            {facility.name}
                          </Badge>
                        ))}
                        {facilities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{facilities.length - 3} más
                          </Badge>
                        )}
                      </div>

                      <div className="flex justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs flex-1 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (mapRef.current) {
                              mapRef.current.flyTo(branch.coordinates, 14)
                            }
                          }}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Centrar
                        </Button>

                        <Link href={`/branches/${branch.id}`} className="flex-1">
                          <Button variant="default" size="sm" className="text-xs w-full">
                            Ver detalles
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>

        {/* Añadir control de zoom en una posición más accesible */}
        <ZoomControl position="bottomright" />

        {/* Controles personalizados */}
        <CustomControls />

        {/* Leyenda del mapa */}
        <MapLegend />

        {/* Componente para manejar el redimensionamiento */}
        <ResizeHandler />

        {flyToPosition && <FlyToMarker position={flyToPosition} />}
      </MapContainer>

      {/* Botón flotante para añadir nueva sucursal */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Link href="/branches/new">
          <Button className="rounded-full w-12 h-12 p-0 bg-primary hover:bg-primary/90 shadow-lg">
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

export { MapComponent }
