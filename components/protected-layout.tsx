"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { ModeToggle } from "@/components/mode-toggle"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isSimpleOperatorView = user?.role === "standard" || user?.role === "operator"
  const isOperatorAllowedPath =
    pathname === "/" ||
    pathname.startsWith("/sensors") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/procesos")

  useEffect(() => {
    if (!isAuthenticated || !isSimpleOperatorView) return
    if (isOperatorAllowedPath) return
    router.replace("/")
  }, [isAuthenticated, isOperatorAllowedPath, isSimpleOperatorView, router])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-blue-950 dark:via-cyan-950 dark:to-indigo-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-blue-600 dark:text-blue-300">Cargando AquaMonitor...</p>
        </div>
      </div>
    )
  }

  // Mostrar children si no está autenticado (permitir login y otras páginas públicas)
  if (!isAuthenticated) {
    return <>{children}</>
  }

  if (isSimpleOperatorView && !isOperatorAllowedPath) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-blue-950 dark:via-cyan-950 dark:to-indigo-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-blue-600 dark:text-blue-300">Redirigiendo a la vista operativa...</p>
        </div>
      </div>
    )
  }

  // Si está autenticado, mostrar el layout completo con sidebar
  if (isAuthenticated && pathname !== "/login") {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-indigo-100/50 dark:from-blue-950/50 dark:via-cyan-950/30 dark:to-indigo-950/50">
        <div className="flex min-h-dvh overflow-hidden">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <header className="flex items-center justify-end p-4 pl-16 md:pl-4 border-b border-cyan-100/50 dark:border-cyan-800/30 bg-white/30 dark:bg-blue-950/30 backdrop-blur-sm">
              <ModeToggle />
            </header>
            <main className="flex-1 min-w-0 overflow-auto">{children}</main>
          </div>
        </div>
      </div>
    )
  }

  // Fallback - no debería llegar aquí normalmente
  return <>{children}</>
}
