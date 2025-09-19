"use client"

import { useEffect, useRef } from "react"

interface LocationSelectorProps {
  center: [number, number]
  onLocationSelect: (coordinates: [number, number]) => void
  selectedLocation: [number, number] | null
}

export default function LocationSelector({ center, onLocationSelect, selectedLocation }: LocationSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Simple map placeholder - in a real app you'd use Leaflet, Google Maps, etc.
    const handleMapClick = (e: MouseEvent) => {
      if (!mapRef.current) return

      const rect = mapRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Convert pixel coordinates to lat/lng (simplified)
      const lat = center[0] + (y - rect.height / 2) * -0.001
      const lng = center[1] + (x - rect.width / 2) * 0.001

      onLocationSelect([lat, lng])
    }

    const mapElement = mapRef.current
    if (mapElement) {
      mapElement.addEventListener("click", handleMapClick)
      return () => mapElement.removeEventListener("click", handleMapClick)
    }
  }, [center, onLocationSelect])

  return (
    <div
      ref={mapRef}
      className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 relative cursor-crosshair flex items-center justify-center"
    >
      <div className="text-center text-muted-foreground">
        <div className="text-sm font-medium mb-2">Mapa Interactivo</div>
        <div className="text-xs">Haga clic para seleccionar ubicación</div>
        {selectedLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        )}
      </div>
    </div>
  )
}
