"use client"

import { useState, useEffect, useCallback } from "react"
import type { User } from "@/types/user"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

// Tipo para los datos que retorna la API
interface UsuarioAPI {
  id_usuario: number
  nombre_completo: string
  correo: string
  telefono?: string
  estado: string
  fecha_creacion: string
  fecha_actualizacion?: string
  tipo_rol: {
    id_rol: number
    nombre: string
  }
}

// Función auxiliar para obtener roles disponibles
async function obtenerRoles(): Promise<Record<string, number>> {
  try {
    const usuarios = await api.get<UsuarioAPI[]>("/usuarios")

    const roleMap: Record<string, number> = {}
    usuarios.forEach(usuario => {
      const roleName = usuario.tipo_rol.nombre.toLowerCase()
      roleMap[roleName] = usuario.tipo_rol.id_rol
    })

    // Ensure we have at least defaults if map is empty (e.g. no users yet)
    if (Object.keys(roleMap).length === 0) {
      return {
        superadmin: 1,
        admin: 2,
        standard: 3
      }
    }

    return roleMap
  } catch (error) {
    console.error("Error al obtener roles:", error)
    // Fallback con roles comunes
    return {
      superadmin: 1,
      admin: 2,
      standard: 3
    }
  }
}

// Función para mapear estados del frontend a estados de la API
function mapStatusToAPI(status: "active" | "inactive" | "pending"): string {
  switch (status) {
    case "active": return "activo"
    case "inactive": return "inactivo"
    case "pending": return "activo" // pending se mapea a activo en la API
    default: return "activo"
  }
}

// Función para convertir datos de la API al tipo User
function convertirUsuarioAPI(usuario: UsuarioAPI): User {
  // Mapear estados de la API al tipo User
  const mapStatus = (estado: string): "active" | "inactive" | "pending" => {
    switch (estado) {
      case "activo": return "active"
      case "inactivo": return "inactive"
      default: return "active" // fallback
    }
  }

  return {
    id: usuario.id_usuario,
    name: usuario.nombre_completo,
    email: usuario.correo,
    role: usuario.tipo_rol.nombre.toLowerCase() as "superadmin" | "admin" | "standard",
    status: mapStatus(usuario.estado),
    phone: usuario.telefono || undefined,
    branchAccess: [], // Por ahora vacío, se puede implementar después
    createdAt: usuario.fecha_creacion,
    updatedAt: usuario.fecha_actualizacion,
  }
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<UsuarioAPI[]>("/usuarios")
      const usuariosConvertidos = data.map(convertirUsuarioAPI)
      setUsers(usuariosConvertidos)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar usuarios"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createUser = useCallback(async (userData: Omit<User, "id" | "createdAt">) => {
    try {
      setLoading(true)

      // Obtener roles disponibles primero
      const roleMap = await obtenerRoles()
      const roleId = roleMap[userData.role] || (userData.role === 'admin' ? 2 : userData.role === 'superadmin' ? 1 : 3)

      // Convertir datos del tipo User a formato de API
      const apiData = {
        nombre_completo: userData.name,
        correo: userData.email,
        telefono: userData.phone || null,
        password: "password123", // Contraseña temporal, debería ser generada o enviada por email
        estado: mapStatusToAPI(userData.status),
        id_rol: roleId,
      }

      await api.post("/usuarios", apiData)

      toast({
        title: "Éxito",
        description: "Usuario creado correctamente",
      })

      await loadUsers()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear usuario"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [loadUsers, toast])

  const updateUser = useCallback(async (userData: User) => {
    try {
      setLoading(true)

      // Obtener roles disponibles primero
      const roleMap = await obtenerRoles()
      const roleId = roleMap[userData.role] || (userData.role === 'admin' ? 2 : userData.role === 'superadmin' ? 1 : 3)

      // Convertir datos del tipo User a formato de API
      const apiData = {
        nombre_completo: userData.name,
        correo: userData.email,
        telefono: userData.phone || null,
        estado: mapStatusToAPI(userData.status),
        id_rol: roleId,
      }

      await api.put(`/usuarios/${userData.id}`, apiData)

      toast({
        title: "Éxito",
        description: "Usuario actualizado correctamente",
      })

      await loadUsers()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar usuario"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [loadUsers, toast])

  const deleteUser = useCallback(async (userId: number) => {
    try {
      setLoading(true)

      await api.delete(`/usuarios/${userId}`)

      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      })

      await loadUsers()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar usuario"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [loadUsers, toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return {
    users,
    loading,
    error,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
  }
}
