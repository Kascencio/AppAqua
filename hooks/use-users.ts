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
  role?: string
  status?: string
  branchAccess?: Array<string | number>
  facilityAccess?: Array<string | number>
  tipo_rol: {
    id_rol: number
    nombre: string
  }
}

interface RolAPI {
  id_rol: number
  nombre: string
}

interface CreateUserInput extends Omit<User, "id" | "createdAt"> {
  password?: string
}

interface UpdateUserInput extends User {
  password?: string
}

// Función auxiliar para obtener roles disponibles
async function obtenerRoles(): Promise<Record<string, number>> {
  try {
    const roles = await api.get<RolAPI[]>("/roles")

    const roleMap: Record<string, number> = {}
    roles.forEach((rol) => {
      const roleName = String(rol.nombre || "").toLowerCase()
      roleMap[roleName] = rol.id_rol
      if (roleName.includes("superadmin")) roleMap.superadmin = rol.id_rol
      else if (roleName.includes("admin")) roleMap.admin = rol.id_rol
      else if (roleName.includes("operator") || roleName.includes("operador")) roleMap.operator = rol.id_rol
      else if (roleName.includes("manager") || roleName.includes("gerente")) roleMap.manager = rol.id_rol
      else if (roleName.includes("viewer") || roleName.includes("lector")) roleMap.viewer = rol.id_rol
      else if (roleName.includes("standard") || roleName.includes("user") || roleName.includes("usuario")) roleMap.standard = rol.id_rol
    })

    // Ensure we have at least defaults if map is empty (e.g. no users yet)
    if (Object.keys(roleMap).length === 0) {
      return {
        superadmin: 1,
        admin: 2,
        standard: 3,
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

// Generar contraseña segura aleatoria
function generateSecurePassword(length: number = 12): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const symbols = "!@#$%&*"
  const allChars = lowercase + uppercase + numbers + symbols

  // Asegurar al menos un carácter de cada tipo
  let password = ""
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
  password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  password += symbols.charAt(Math.floor(Math.random() * symbols.length))

  // Completar el resto con caracteres aleatorios
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }

  // Mezclar los caracteres
  return password.split("").sort(() => Math.random() - 0.5).join("")
}

// Función para mapear estados del frontend a estados de la API
function mapStatusToAPI(status: "active" | "inactive" | "pending" | "suspended"): string {
  switch (status) {
    case "active": return "activo"
    case "inactive": return "inactivo"
    case "pending": return "activo" // pending se mapea a activo en la API
    case "suspended": return "inactivo"
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

  const apiRole = usuario.role?.toLowerCase() || ""
  const dbRole = usuario.tipo_rol?.nombre?.toLowerCase() || ""
  const rawRole = apiRole || dbRole
  let role: User["role"] = "standard"
  if (rawRole.includes("superadmin")) role = "superadmin"
  else if (rawRole.includes("admin")) role = "admin"
  else if (rawRole.includes("operator")) role = "operator"
  else if (rawRole.includes("manager")) role = "manager"
  else if (rawRole.includes("viewer")) role = "viewer"

  return {
    id: usuario.id_usuario,
    name: usuario.nombre_completo,
    email: usuario.correo,
    role,
    status: mapStatus(usuario.status || usuario.estado),
    phone: usuario.telefono || undefined,
    branchAccess: Array.isArray(usuario.branchAccess) ? usuario.branchAccess : [],
    facilityAccess: Array.isArray(usuario.facilityAccess) ? usuario.facilityAccess : [],
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

  const createUser = useCallback(async (userData: CreateUserInput) => {
    try {
      setLoading(true)

      // Obtener roles disponibles primero
      const roleMap = await obtenerRoles()
      const roleId =
        roleMap[userData.role] ||
        roleMap.standard ||
        roleMap.user ||
        roleMap.admin ||
        roleMap.superadmin ||
        1

      const providedPassword = typeof userData.password === "string" ? userData.password.trim() : ""
      const tempPassword = generateSecurePassword(12)
      const passwordToUse = providedPassword || tempPassword

      // Convertir datos del tipo User a formato de API
      const apiData = {
        nombre_completo: userData.name,
        correo: userData.email,
        telefono: userData.phone || null,
        password: passwordToUse,
        estado: mapStatusToAPI(userData.status),
        id_rol: roleId,
        role: userData.role,
        branchAccess: userData.branchAccess || [],
        facilityAccess: userData.facilityAccess || [],
      }

      await api.post("/usuarios", apiData)

      if (!providedPassword) {
        // Si no se asignó password manual, enviar flujo de recuperación
        try {
          await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              correo: userData.email,
            }),
          })
        } catch {
          console.warn("No se pudo iniciar recuperación de contraseña para el usuario nuevo")
        }
      }

      toast({
        title: "Éxito",
        description: providedPassword
          ? "Usuario creado correctamente con contraseña definida manualmente."
          : `Usuario creado correctamente. Se envió enlace de recuperación a ${userData.email} (correo o Telegram).`,
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

  const updateUser = useCallback(async (userData: UpdateUserInput) => {
    try {
      setLoading(true)

      // Obtener roles disponibles primero
      const roleMap = await obtenerRoles()
      const roleId =
        roleMap[userData.role] ||
        roleMap.standard ||
        roleMap.user ||
        roleMap.admin ||
        roleMap.superadmin ||
        1

      // Convertir datos del tipo User a formato de API
      const apiData = {
        nombre_completo: userData.name,
        correo: userData.email,
        telefono: userData.phone || null,
        estado: mapStatusToAPI(userData.status),
        id_rol: roleId,
        role: userData.role,
        branchAccess: userData.branchAccess || [],
        facilityAccess: userData.facilityAccess || [],
        ...(typeof userData.password === "string" && userData.password.trim()
          ? { password: userData.password.trim() }
          : {}),
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

  const changeUserPassword = useCallback(async (userId: string | number, newPassword: string) => {
    try {
      setLoading(true)

      const password = String(newPassword || "").trim()
      if (!password) {
        throw new Error("La contraseña es obligatoria")
      }

      await api.put(`/usuarios/${userId}`, { password })

      toast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
      })

      await loadUsers()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cambiar la contraseña"
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

  const deleteUser = useCallback(async (userId: string | number) => {
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
      console.error("deleteUser failed:", err)
      return false
    } finally {
      setLoading(false)
    }
  }, [loadUsers, toast])

  const sendPasswordReset = useCallback(async (user: User) => {
    try {
      setLoading(true)

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: user.email,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al enviar email")
      }

      toast({
        title: "Éxito",
        description: `Se envió enlace de restablecimiento a ${user.email} (correo o Telegram).`,
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al enviar email de restablecimiento"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

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
    sendPasswordReset,
    changeUserPassword,
  }
}
