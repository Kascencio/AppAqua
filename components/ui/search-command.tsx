"use client"

import * as React from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Clock, TrendingUp, Building2, Droplets, Fish, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  description?: string
  category: "sensors" | "processes" | "facilities" | "species" | "users" | "pages"
  url: string
  metadata?: Record<string, any>
}

interface SearchCommandProps {
  placeholder?: string
  className?: string
}

export function SearchCommand({ placeholder = "Buscar en AquaMonitor...", className }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Simular búsqueda (en producción esto sería una llamada a API)
  const searchData = React.useMemo(
    () => [
      {
        id: "sensor-ph-001",
        title: "Sensor pH Principal",
        description: "Estanque Principal - Estado: Activo",
        category: "sensors" as const,
        url: "/sensors/ph-001",
        metadata: { status: "active", value: "7.2 pH" },
      },
      {
        id: "process-tilapia-2024",
        title: "Cultivo Tilapia 2024",
        description: "Proceso activo - 45 días restantes",
        category: "processes" as const,
        url: "/processes/tilapia-2024",
        metadata: { status: "active", progress: 65 },
      },
      {
        id: "facility-estanque-1",
        title: "Estanque Principal",
        description: "Capacidad: 1000m³ - 8 sensores activos",
        category: "facilities" as const,
        url: "/facilities/estanque-1",
        metadata: { capacity: "1000m³", sensors: 8 },
      },
      {
        id: "species-tilapia",
        title: "Tilapia del Nilo",
        description: "Oreochromis niloticus - 3 procesos activos",
        category: "species" as const,
        url: "/species/tilapia",
        metadata: { activeProcesses: 3 },
      },
      {
        id: "page-analytics",
        title: "Análisis y Reportes",
        description: "Dashboard de análisis de datos",
        category: "pages" as const,
        url: "/analytics",
      },
      {
        id: "page-map",
        title: "Mapa de Instalaciones",
        description: "Vista geográfica de sucursales",
        category: "pages" as const,
        url: "/map",
      },
    ],
    [],
  )

  // Buscar resultados
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)

    // Simular delay de búsqueda
    const timer = setTimeout(() => {
      const filtered = searchData.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()),
      )
      setResults(filtered)
      setIsLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, searchData])

  // Manejar selección
  const handleSelect = (result: SearchResult) => {
    // Agregar a búsquedas recientes
    setRecentSearches((prev) => {
      const updated = [result.title, ...prev.filter((s) => s !== result.title)].slice(0, 5)
      localStorage.setItem("aquamonitor-recent-searches", JSON.stringify(updated))
      return updated
    })

    // Navegar
    window.location.href = result.url
    setOpen(false)
  }

  // Cargar búsquedas recientes
  React.useEffect(() => {
    const saved = localStorage.getItem("aquamonitor-recent-searches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Atajos de teclado
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const getCategoryIcon = (category: SearchResult["category"]) => {
    switch (category) {
      case "sensors":
        return <Droplets className="h-4 w-4" />
      case "processes":
        return <TrendingUp className="h-4 w-4" />
      case "facilities":
        return <Building2 className="h-4 w-4" />
      case "species":
        return <Fish className="h-4 w-4" />
      case "users":
        return <Users className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: SearchResult["category"]) => {
    switch (category) {
      case "sensors":
        return "Sensores"
      case "processes":
        return "Procesos"
      case "facilities":
        return "Instalaciones"
      case "species":
        return "Especies"
      case "users":
        return "Usuarios"
      case "pages":
        return "Páginas"
      default:
        return "Otros"
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">{placeholder}</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
        <CommandList>
          {!query && recentSearches.length > 0 && (
            <CommandGroup heading="Búsquedas recientes">
              {recentSearches.map((search) => (
                <CommandItem key={search} onSelect={() => setQuery(search)} className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {search}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {query && !isLoading && results.length === 0 && (
            <CommandEmpty>No se encontraron resultados para "{query}"</CommandEmpty>
          )}

          {query && isLoading && <CommandEmpty>Buscando...</CommandEmpty>}

          {results.length > 0 && (
            <>
              {Object.entries(
                results.reduce(
                  (acc, result) => {
                    if (!acc[result.category]) acc[result.category] = []
                    acc[result.category].push(result)
                    return acc
                  },
                  {} as Record<string, SearchResult[]>,
                ),
              ).map(([category, items]) => (
                <CommandGroup key={category} heading={getCategoryLabel(category as SearchResult["category"])}>
                  {items.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(result.category)}
                        <div>
                          <div className="font-medium">{result.title}</div>
                          {result.description && (
                            <div className="text-sm text-muted-foreground">{result.description}</div>
                          )}
                        </div>
                      </div>

                      {result.metadata && (
                        <div className="flex gap-1">
                          {result.metadata.status && (
                            <Badge
                              variant={result.metadata.status === "active" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {result.metadata.status}
                            </Badge>
                          )}
                          {result.metadata.value && (
                            <Badge variant="outline" className="text-xs">
                              {result.metadata.value}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
