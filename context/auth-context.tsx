"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User } from "@/types/user"

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
      if (!user && pathname !== "/login" && pathname !== "/register" && pathname !== "/forgot-password" && pathname !== "/reset-password") {
        router.push("/login")
      } else if (user && (pathname === "/login" || pathname === "/register")) {
        router.push("/")
      }
    }
  }, [user, isLoading, pathname, router])

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      
      // Verificar si hay un refresh token en las cookies
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
        }
      } else {
        // Intentar refresh token si el access token expiró
        const refreshSuccess = await refreshToken()
        if (!refreshSuccess) {
          setUser(null)
        }
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ correo: email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Error en el login' }
      }
    } catch (error) {
      console.error('Error durante el login:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Error en el registro' }
      }
    } catch (error) {
      console.error('Error durante el registro:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error durante el logout:', error)
    } finally {
      setUser(null)
      router.push("/login")
    }
  }

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo: email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Error al solicitar recuperación' }
      }
    } catch (error) {
      console.error('Error durante forgot password:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const resetPassword = async (token: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Error al restablecer contraseña' }
      }
    } catch (error) {
      console.error('Error durante reset password:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        // Obtener datos del usuario actualizados
        const meResponse = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include'
        })

        if (meResponse.ok) {
          const data = await meResponse.json()
          if (data.success && data.user) {
            setUser(data.user)
            return true
          }
        }
      }
      return false
    } catch (error) {
      console.error('Error durante refresh token:', error)
      return false
    }
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
