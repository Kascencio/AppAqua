"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User } from "@/types/user"
import { backendApi } from "@/lib/backend-client"

interface AuthContextProps {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>
  refreshToken: () => Promise<boolean>
}

interface RegisterData {
  nombre_completo: string
  correo: string
  telefono?: string
  password: string
  confirmPassword: string
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}


// Helper to map backend user to frontend User type
const mapUser = (backendUser: any): User => {
  const rawRole = String(backendUser.role || backendUser.tipo_rol?.nombre || "").toLowerCase()
  let role: User["role"] = "standard"
  if (rawRole.includes("superadmin")) role = "superadmin"
  else if (rawRole.includes("admin")) role = "admin"
  else if (rawRole.includes("operator")) role = "operator"
  else if (rawRole.includes("manager")) role = "manager"
  else if (rawRole.includes("viewer")) role = "viewer"

  return {
    id: backendUser.id_usuario,
    name: backendUser.nombre_completo,
    email: backendUser.correo,
    role: role,
    status: (backendUser.status || backendUser.estado) === "activo" || backendUser.status === "active" ? "active" : "inactive",
    branchAccess: Array.isArray(backendUser.branchAccess) ? backendUser.branchAccess : [],
    facilityAccess: Array.isArray(backendUser.facilityAccess) ? backendUser.facilityAccess : [],
    createdAt: backendUser.createdAt || backendUser.fecha_creacion || new Date().toISOString(),
    phone: backendUser.telefono,
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const clearSession = useCallback((redirectToLogin: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_data")
    }
    setUser(null)
    if (redirectToLogin) {
      router.push("/login")
    }
  }, [router])

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true)

      // La cookie httpOnly se envía automáticamente con credentials: 'include'
      // No necesitamos leer localStorage para el token
      const response = await backendApi.getMe() as any
      const usuario = response?.usuario ?? response?.data?.usuario ?? response?.data

      if (!usuario) {
        clearSession(false)
        return
      }

      const mappedUser = mapUser(usuario)
      localStorage.setItem("user_data", JSON.stringify(mappedUser))
      setUser(mappedUser)
    } catch {
      clearSession(false)
    } finally {
      setIsLoading(false)
    }
  }, [clearSession])

  // Verificar autenticación al cargar la app
  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  // Redirigir según el estado de autenticación
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"]
      if (!user && !publicPaths.includes(pathname)) {
        router.push("/login")
      } else if (user && (pathname === "/login" || pathname === "/register")) {
        router.push("/")
      }
    }
  }, [user, isLoading, pathname, router])

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession(true)
    }

    window.addEventListener("aqua:auth-unauthorized", onUnauthorized)
    return () => {
      window.removeEventListener("aqua:auth-unauthorized", onUnauthorized)
    }
  }, [clearSession])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await backendApi.login(email, password)

      // Backend devuelve: { token, usuario } y setea cookie httpOnly
      const loginData = response.data || response
      const usuario = loginData.usuario || (response as any).usuario

      if (usuario) {
        const mappedUser = mapUser(usuario)
        localStorage.setItem("user_data", JSON.stringify(mappedUser))
        setUser(mappedUser)
        return { success: true }
      } else {
        console.error('[Auth Context] Invalid response structure:', response)
        return { success: false, error: 'Respuesta inválida del servidor' }
      }
    } catch (error: any) {
      console.error('Error durante el login:', error)
      return { success: false, error: error.message || 'Error de conexión' }
    }
  }

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = {
        nombre: userData.nombre_completo,
        email: userData.correo,
        password: userData.password,
        rol: 'viewer' as const,
      }

      await backendApi.register(payload)
      
      // Return success and let the user login
      return { success: true }
    } catch (error: any) {
      console.error('Error durante el registro:', error)
      return { success: false, error: error.message || 'Error de conexión' }
    }
  }

  const logout = async () => {
    // Llamar al backend para que limpie la cookie httpOnly
    try {
      await backendApi.logout()
    } catch {
      // Silenciar error de red – igual limpiamos el estado local
    }
    clearSession(true)
  }

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ correo: email }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: data?.error || "No se pudo iniciar recuperación de contraseña" }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || "Error de conexión" }
    }
  }

  const resetPassword = async (token: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: data?.error || "No se pudo restablecer la contraseña" }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || "Error de conexión" }
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    // Endpoint not documented
    return false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
