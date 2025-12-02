"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, MapPin } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export interface Organizacion {
  id_organizacion: number
  nombre: string
  razon_social?: string
  rfc?: string
  correo?: string
  telefono?: string
  estado: 'activa' | 'inactiva'
  fecha_creacion: string
  ultima_modificacion: string
  estados?: {
    nombre: string
  }
  municipios?: {
    nombre: string
  }
  organizacion_sucursal: Array<{
    id_organizacion_sucursal: number
    nombre_sucursal: string
    estado: 'activa' | 'inactiva'
  }>
}

interface ActionsProps {
  organizacion: Organizacion
  onEdit: (organizacion: Organizacion) => void
  onDelete: (id: number) => void
  onView: (id: number) => void
}

function ActionsCell({ organizacion, onEdit, onDelete, onView }: ActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(organizacion.id_organizacion)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver detalles
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(organizacion)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        {organizacion.organizacion_sucursal.length === 0 && (
          <DropdownMenuItem 
            onClick={() => onDelete(organizacion.id_organizacion)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const createColumns = (
  onEdit: (organizacion: Organizacion) => void,
  onDelete: (id: number) => void,
  onView: (id: number) => void
): ColumnDef<Organizacion>[] => [
  {
    accessorKey: "nombre",
    header: "Nombre",
    cell: ({ row }) => {
      const organizacion = row.original
      return (
        <div className="space-y-1">
          <div className="font-medium">{organizacion.nombre}</div>
          {organizacion.razon_social && (
            <div className="text-sm text-muted-foreground">
              {organizacion.razon_social}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "rfc",
    header: "RFC",
    cell: ({ getValue }) => {
      const rfc = getValue() as string
      return rfc ? (
        <span className="font-mono text-sm">{rfc}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "correo",
    header: "Contacto",
    cell: ({ row }) => {
      const organizacion = row.original
      return (
        <div className="space-y-1">
          {organizacion.correo && (
            <div className="text-sm">{organizacion.correo}</div>
          )}
          {organizacion.telefono && (
            <div className="text-sm text-muted-foreground">
              {organizacion.telefono}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "ubicacion",
    header: "Ubicación",
    cell: ({ row }) => {
      const organizacion = row.original
      if (organizacion.estados || organizacion.municipios) {
        return (
          <div className="flex items-center space-x-1 text-sm">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>
              {organizacion.municipios?.nombre}
              {organizacion.municipios?.nombre && organizacion.estados?.nombre && ', '}
              {organizacion.estados?.nombre}
            </span>
          </div>
        )
      }
      return <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "sucursales",
    header: "Sucursales",
    cell: ({ row }) => {
      const sucursales = row.original.organizacion_sucursal
      const activas = sucursales.filter(s => s.estado === 'activa').length
      const total = sucursales.length
      
      return (
        <div className="text-sm">
          <span className="font-medium">{activas}</span>
          <span className="text-muted-foreground">/{total}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ getValue }) => {
      const estado = getValue() as string
      return (
        <Badge variant={estado === 'activa' ? 'default' : 'secondary'}>
          {estado === 'activa' ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
  },
  {
    accessorKey: "fecha_creacion",
    header: "Creada",
    cell: ({ getValue }) => {
      const fecha = getValue() as string
      return (
        <div className="text-sm text-muted-foreground">
          {format(new Date(fecha), "dd/MM/yyyy", { locale: es })}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionsCell 
        organizacion={row.original} 
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    ),
  },
]