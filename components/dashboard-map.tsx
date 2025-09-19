"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Building2, Droplets, Search, Filter, X, MapPin } from "lucide-react"
import { useBranches } from "@/hooks/use-branches"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

// Dynamically import the MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 rounded-full bg-slate-300 dark:bg-slate-600 mb-4"></div>
        <div className="h-4 w-32 bg-slate-300 dark:bg-slate-600 rounded"></div>
        <div className="mt-2 h-3 w-24 bg-slate-300 dark:bg-slate-600 rounded"></div>
      </div>
    </div>
  ),
})

interface DashboardMapProps {
  onBranchSelect?: (branchId: string) => void
  selectedBranchId?: string | null
}

export function DashboardMap({ onBranchSelect, selectedBranchId }: DashboardMapProps) {
  const { branches, loading } = useBranches()
  const [flyToPosition, setFlyToPosition] = useState<[number, number] | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [showFilters, setShowFilters] = useState(false)

  // Set the center of Mexico as default
  const defaultCenter: [number, number] = [18.0, -93.0]

  // Handle branch selection
  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId)
    if (onBranchSelect) {
      onBranchSelect(branchId)
    }

    // Find the branch and set the flyToPosition
    const branch = branches.find((b) => b.id === branchId)
    if (branch) {
      setFlyToPosition(branch.coordinates)
    }
  }

  // Update selected branch when selectedBranchId prop changes
  useEffect(() => {
    if (selectedBranchId && selectedBranchId !== selectedBranch) {
      setSelectedBranch(selectedBranchId)

      // Find the branch and set the flyToPosition
      const branch = branches.find((b) => b.id === selectedBranchId)
      if (branch) {
        setFlyToPosition(branch.coordinates)
      }
    }
  }, [selectedBranchId, branches, selectedBranch])

  // Count alerts for each branch
  const getBranchAlerts = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId)
    if (!branch) return 0

    let alertCount = 0
    branch.facilities.forEach((facility) => {
      Object.entries(facility.waterQuality).forEach(([_, param]) => {
        if (param.value < (param.minValue || 0) || param.value > (param.maxValue || 100)) {
          alertCount++
        }
      })
    })
    return alertCount
  }

  // Filtrar sucursales
  const filteredBranches = branches.filter((branch) => {
    // Filtrar por término de búsqueda
    const matchesSearch =
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.facilities.some((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filtrar por estado
    const matchesStatus =
      statusFilter === "todos" ||
      (statusFilter === "active" && branch.status === "active") ||
      (statusFilter === "inactive" && branch.status === "inactive") ||
      (statusFilter === "alerts" && getBranchAlerts(branch.id) > 0)

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-slate-300 dark:bg-slate-600 mb-4"></div>
          <div className="h-4 w-32 bg-slate-300 dark:bg-slate-600 rounded"></div>
          <div className="mt-2 h-3 w-24 bg-slate-300 dark:bg-slate-600 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full grid md:grid-cols-4 gap-0">
      {/* Sidebar with branch list and filters */}
      <div className="md:col-span-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-medium flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            Sucursales
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
            {showFilters ? <X className="h-4 w-4 mr-1" /> : <Filter className="h-4 w-4 mr-1" />}
            {showFilters ? "Ocultar" : "Filtros"}
          </Button>
        </div>

        {/* Filtros */}
        <div
          className={`p-3 border-b border-gray-200 dark:border-gray-700 ${showFilters ? "block" : "hidden md:block"}`}
        >
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar sucursales..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
                <SelectItem value="alerts">Con alertas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de sucursales */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredBranches.length > 0 ? (
            filteredBranches.map((branch) => {
              const alertCount = getBranchAlerts(branch.id)
              return (
                <div
                  key={branch.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedBranch === branch.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => handleBranchSelect(branch.id)}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{branch.name}</h4>
                    <Badge variant={branch.status === "active" ? "default" : "outline"}>
                      {branch.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {branch.location}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Droplets className="h-3.5 w-3.5 mr-1" />
                      {branch.facilities.length} instalaciones
                    </div>
                    {alertCount > 0 && (
                      <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        {alertCount} alertas
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
              <p>No se encontraron sucursales</p>
              <p className="text-sm mt-1">Intenta con otros filtros</p>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
          <div className="grid grid-cols-3 gap-2">
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-2 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-medium">{branches.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-2 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Activas</p>
                <p className="text-lg font-medium">{branches.filter((b) => b.status === "active").length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-2 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Alertas</p>
                <p className="text-lg font-medium">
                  {branches.reduce((total, branch) => total + getBranchAlerts(branch.id), 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="md:col-span-3 h-full">
        <MapComponent
          branches={filteredBranches}
          center={defaultCenter}
          onBranchSelect={handleBranchSelect}
          flyToPosition={flyToPosition}
        />
      </div>
    </div>
  )
}
