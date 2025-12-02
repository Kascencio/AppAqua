"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServerDataTable } from "@/components/ui/server-data-table"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Search, Plus, RefreshCw } from "lucide-react"
import { createColumns, type Organizacion } from "./columns"
import { AddOrganizacionDialog } from "./add-organizacion-dialog"
import { EditOrganizacionDialog } from "./edit-organizacion-dialog"

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface OrganizacionesResponse {
  success: boolean
  data?: {
    items: Organizacion[]
    pagination: PaginationInfo
  }
  error?: string
}

export default function OrganizacionesPage() {
  const router = useRouter()
  
  // State
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })
  
  // Filters
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("")
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingOrganizacion, setEditingOrganizacion] = useState<Organizacion | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Fetch organizaciones
  const fetchOrganizaciones = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      })
      
      if (search.trim()) {
        params.append('search', search.trim())
      }
      
      if (estadoFilter) {
        params.append('estado', estadoFilter)
      }

      const response = await fetch(`/api/organizaciones?${params}`)
      const data: OrganizacionesResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al cargar organizaciones')
      }

      if (data.data) {
        setOrganizaciones(data.data.items)
        setPagination(data.data.pagination)
      }

    } catch (error) {
      console.error('Error fetching organizaciones:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar organizaciones')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, search, estadoFilter])

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchOrganizaciones()
  }, [fetchOrganizaciones])

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  // Handle filter change
  const handleEstadoFilterChange = useCallback((value: string) => {
    setEstadoFilter(value)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  // Handle actions
  const handleView = useCallback((id: number) => {
    router.push(`/organizaciones/${id}`)
  }, [router])

  const handleEdit = useCallback((organizacion: Organizacion) => {
    setEditingOrganizacion(organizacion)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/organizaciones/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar organización')
      }

      toast.success('Organización eliminada exitosamente')
      fetchOrganizaciones() // Refresh data

    } catch (error) {
      console.error('Error deleting organizacion:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar organización')
    } finally {
      setDeletingId(null)
    }
  }, [fetchOrganizaciones])

  // Handle dialog success
  const handleDialogSuccess = useCallback(() => {
    fetchOrganizaciones()
    setShowAddDialog(false)
    setEditingOrganizacion(null)
  }, [fetchOrganizaciones])

  // Create columns with callbacks
  const columns = createColumns(handleEdit, setDeletingId, handleView)

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Organizaciones</CardTitle>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Organización
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, razón social, RFC o email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={estadoFilter} onValueChange={handleEstadoFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="activa">Activas</SelectItem>
                <SelectItem value="inactiva">Inactivas</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchOrganizaciones}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Data Table */}
          <ServerDataTable
            columns={columns}
            data={organizaciones}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <AddOrganizacionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleDialogSuccess}
      />

      {/* Edit Dialog */}
      {editingOrganizacion && (
        <EditOrganizacionDialog
          open={true}
          onOpenChange={(open: boolean) => !open && setEditingOrganizacion(null)}
          organizacion={editingOrganizacion}
          onSuccess={handleDialogSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar organización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la organización
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}