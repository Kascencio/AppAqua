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

  const setAccessTokenCookie = (token: string) => {
    // Middleware valida auth con cookie `access_token`.
    // No puede leer localStorage, así que debemos persistir el token también como cookie.
    // En dev usamos cookie no-httpOnly (por JS). En prod idealmente sería httpOnly desde el backend.
    const maxAgeSeconds = 60 * 60 * 24 * 7 // 7 días
    document.cookie = `access_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
  }

  const clearAccessTokenCookie = () => {
    document.cookie = 'access_token=; Path=/; Max-Age=0; SameSite=Lax'
  }

  const clearSession = useCallback((redirectToLogin: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user_data")
    }
    clearAccessTokenCookie()
    setUser(null)
    if (redirectToLogin) {
      router.push("/login")
    }
  }, [router])

  // Verificar autenticación al cargar la app
  useEffect(() => {
    checkAuthStatus()
  }, [])

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

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        localStorage.removeItem("user_data")
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
        // Estado inconsistente: limpiar sesión silenciosamente.
        clearSession(false)
      }

    } catch (error) {
      console.error('Error verificando autenticación:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

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
      
      console.log('[Auth Context] Login response received:', JSON.stringify(response, null, 2))

      // Backend devuelve: { token, usuario }
      // O envuelto: { data: { token, usuario }, success: true }
      const loginData = response.data || response
      const token = loginData.token || (response as any).token
      const usuario = loginData.usuario || (response as any).usuario

      console.log('[Auth Context] Extracted token:', !!token)
      console.log('[Auth Context] Extracted usuario:', !!usuario)

      if (token && usuario) {
        const mappedUser = mapUser(usuario)
        
        console.log('[Auth Context] Setting user:', mappedUser)
        localStorage.setItem("token", token)
        localStorage.setItem("user_data", JSON.stringify(mappedUser))

        // Importante: setear cookie para que el middleware permita entrar a rutas protegidas (/, etc.)
        setAccessTokenCookie(token)
        
        setUser(mappedUser)
        console.log('[Auth Context] User state updated, returning success')
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

  const logout = () => {
    clearSession(true)
  }

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
