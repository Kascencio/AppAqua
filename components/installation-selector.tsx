"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin } from "lucide-react"

interface Branch {
  id: string
  name: string
  location: string
  facilities?: string[]
}

interface Facility {
  id: string
  name: string
  type: "pond" | "tank" | "cage"
  capacity: number
  speciesId?: number
}

interface InstallationSelectorProps {
  branches: Branch[]
  facilities: Facility[]
  selectedInstallation: string | null
  onInstallationChange: (installationId: string | null) => void
  loading?: boolean
}

export function InstallationSelector({
  branches,
  facilities,
  selectedInstallation,
  onInstallationChange,
  loading = false,
}: InstallationSelectorProps) {
  const selectedFacility = facilities.find((f) => f.id === selectedInstallation)
  const selectedBranch = branches.find(
    (b) =>
      b.facilities?.includes(selectedInstallation || "") ||
      facilities.some((f) => f.id === selectedInstallation && b.id.includes("branch")),
  )

  const getFacilityTypeLabel = (type: string) => {
    switch (type) {
      case "pond":
        return "Estanque"
      case "tank":
        return "Tanque"
      case "cage":
        return "Jaula"
      default:
        return "Instalación"
    }
  }

  if (loading) {
    return (
      <div className="w-64">
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Cargando instalaciones..." />
          </SelectTrigger>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Select value={selectedInstallation || ""} onValueChange={onInstallationChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Seleccionar instalación">
            {selectedFacility && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{selectedFacility.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {branches.map((branch) => {
            const branchFacilities = facilities.filter(
              (f) => branch.facilities?.includes(f.id) || f.id.includes(branch.id.split("-")[1]),
            )

            if (branchFacilities.length === 0) return null

            return (
              <div key={branch.id}>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {branch.name}
                </div>
                {branchFacilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id} className="pl-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{facility.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getFacilityTypeLabel(facility.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{facility.capacity}m³</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </div>
            )
          })}

          {/* Instalaciones sin sucursal asignada */}
          {facilities.filter((f) => !branches.some((b) => b.facilities?.includes(f.id))).length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Otras instalaciones</div>
              {facilities
                .filter((f) => !branches.some((b) => b.facilities?.includes(f.id)))
                .map((facility) => (
                  <SelectItem key={facility.id} value={facility.id} className="pl-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{facility.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getFacilityTypeLabel(facility.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{facility.capacity}m³</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
            </div>
          )}
        </SelectContent>
      </Select>

      {/* Información adicional de la instalación seleccionada */}
      {selectedFacility && selectedBranch && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {selectedBranch.name} • {selectedBranch.location}
        </div>
      )}
    </div>
  )
}
