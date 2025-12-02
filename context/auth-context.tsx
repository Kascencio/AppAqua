"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User } from "@/types/user"
import { api } from "@/lib/api"

interface AuthContextProps {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
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
  let role: User["role"] = "standard"
  if (backendUser.tipo_rol?.nombre === "ADMIN" || backendUser.id_rol === 1) role = "admin"
  if (backendUser.tipo_rol?.nombre === "SUPERADMIN") role = "superadmin"

  return {
    id: backendUser.id_usuario,
    name: backendUser.nombre_completo,
    email: backendUser.correo,
    role: role,
    status: backendUser.estado === "activo" ? "active" : "inactive",
    branchAccess: [], // TODO: Load from backend if available
    createdAt: new Date().toISOString(), // Placeholder
    phone: backendUser.telefono,
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Verificar autenticación al cargar la app
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Redirigir según el estado de autenticación
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/temp"]
      if (!user && !publicPaths.includes(pathname)) {
        router.push("/login")
      } else if (user && (pathname === "/login" || pathname === "/register")) {
        router.push("/")
      }
    }
  }, [user, isLoading, pathname, router])

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        setUser(null)
        return
      }

      // Verify token by fetching user profile
      // Note: The user didn't specify a /me endpoint, so we might need to rely on stored user data 
      // or try to fetch a protected resource. 
      // For now, let's assume we can fetch the user list filtering by ID or similar, 
      // OR we just trust the token until a 401 happens.
      // BETTER APPROACH: Let's try to fetch the user details if we stored the ID, 
      // but since we don't have a specific /me endpoint documented, 
      // we will assume the session is valid if token exists, and let the API client handle 401s.
      
      // However, to populate the 'user' state, we need data. 
      // Let's check if we stored user data in localStorage too.
      const storedUser = localStorage.getItem("user_data")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else {
        // If we have token but no user data, we might be in an inconsistent state.
        // Try to fetch user info if possible, or logout.
        // Since we don't have a documented /me endpoint, we'll logout to be safe.
        logout()
      }

    } catch (error) {
      console.error('Error verificando autenticación:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await api.post<any>('/login', { correo: email, password })

      if (data.token && data.usuario) {
        const mappedUser = mapUser(data.usuario)
        
        localStorage.setItem("token", data.token)
        localStorage.setItem("user_data", JSON.stringify(mappedUser))
        
        setUser(mappedUser)
        return { success: true }
      } else {
        return { success: false, error: 'Respuesta inválida del servidor' }
      }
    } catch (error: any) {
      console.error('Error durante el login:', error)
      return { success: false, error: error.message || 'Error de conexión' }
    }
  }

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      // The user document says POST /api/usuarios for creating a user.
      // We need to adapt the register data to the backend expected format.
      const payload = {
        nombre_completo: userData.nombre_completo,
        correo: userData.correo,
        password: userData.password,
        telefono: userData.telefono,
        id_rol: 2, // Default to standard user? Or 1 for admin? Let's assume 2.
        estado: 'activo'
      }

      await api.post('/usuarios', payload)
      
      // Auto login after register? Or just return success?
      // Let's return success and let the user login.
      return { success: true }
    } catch (error: any) {
      console.error('Error durante el registro:', error)
      return { success: false, error: error.message || 'Error de conexión' }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user_data")
    setUser(null)
    router.push("/login")
  }

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    // Endpoint not documented in the provided list, keeping placeholder or removing
    // The user provided list doesn't have forgot-password.
    // We'll return an error or mock it.
    console.warn("Forgot password endpoint not available in backend documentation")
    return { success: false, error: "Función no disponible en este momento" }
  }

  const resetPassword = async (token: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> => {
    // Endpoint not documented
    return { success: false, error: "Función no disponible en este momento" }
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
