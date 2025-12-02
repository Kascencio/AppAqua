"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Droplets,
  Fish,
  Settings,
  Users,
  Home,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Factory,
  Gauge,
  LogOut,
  Activity,
  Bell,
  Map as MapIcon,
  BarChart3,
  Shield,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useAuth } from "@/context/auth-context"

interface SidebarProps {
  className?: string
}

function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    settings: false,
  })

  // Define all possible routes with their required permissions
  const allRoutes = [
    {
      href: "/",
      icon: Home,
      title: "Inicio",
      roles: ["superadmin", "admin", "standard"], // Todos ven el dashboard
    },
    {
      href: "/sucursales",
      icon: Building2,
      title: "Sucursales",
      roles: ["superadmin", "admin"], // Solo superadmin/admin
    },
    {
      href: "/instalaciones",
      icon: Factory,
      title: "Instalaciones",
      roles: ["superadmin", "admin", "standard"],
    },
    {
      href: "/sensors",
      icon: Gauge,
      title: "Sensores",
      roles: ["superadmin", "admin", "standard"],
    },
    {
      href: "/especies",
      icon: Fish,
      title: "Especies",
      roles: ["superadmin", "admin", "standard"],
    },
    {
      href: "/procesos",
      icon: Activity,
      title: "Procesos",
      roles: ["superadmin", "admin", "standard"],
    },
    {
      href: "/monitoreo",
      icon: Activity,
      title: "Monitoreo",
      roles: ["superadmin", "admin", "standard"],
    },
    {
      href: "/analytics",
      icon: BarChart3,
      title: "Analítica",
      roles: ["superadmin", "admin", "standard"],
    },
    {
      href: "/notifications",
      icon: Bell,
      title: "Notificaciones",
      roles: ["superadmin", "admin", "standard"],
    },
    {
      href: "/map",
      icon: MapIcon,
      title: "Mapa",
      roles: ["superadmin", "admin", "standard"],
    },
    {
      href: "/users",
      icon: Users,
      title: "Usuarios",
      roles: ["superadmin", "admin"], // superadmin/admin gestionan usuarios
    },
    {
      href: "/users/roles",
      icon: Shield,
      title: "Tipos de Usuario",
      roles: ["superadmin", "admin"], // superadmin/admin gestionan tipos de usuario
    },
  ]

  // Filter routes based on user role
  const routes = allRoutes.filter((route) => {
    if (!user) return false
    return route.roles.includes(user.role)
  })

  // Settings routes with role-based access
  const settingsRoutes = [
    {
      href: "/settings/profile",
      title: "Perfil",
      roles: ["superadmin", "admin", "standard"],
    },
    {
      href: "/settings/notifications",
      title: "Notificaciones",
      roles: ["superadmin", "admin", "standard"],
    },
    {
      href: "/settings/system",
      title: "Sistema",
      roles: ["superadmin"], // Solo superadmin
    },
  ]

  const availableSettingsRoutes = settingsRoutes.filter((route) => {
    if (!user) return false
    return route.roles.includes(user.role)
  })

  // Close mobile sidebar when navigating
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }))
  }

  // Get user role display text
  const getRoleDisplayText = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Superadmin"
      case "admin":
        return "Administrador"
      case "standard":
        return "Estandar"
      default:
        return role
    }
  }

  // Get user access summary
  const getUserAccessSummary = () => {
    if (!user) return ""

    switch (user.role) {
      case "superadmin":
        return "Acceso total (sistema)"
      case "admin":
        return "Acceso completo"
      case "standard":
        const branchCount = user.branchAccess?.length || 0
        return branchCount > 0
          ? `${branchCount} empresa${branchCount > 1 ? "s" : ""} asignada${branchCount > 1 ? "s" : ""}`
          : "Sin empresas asignadas"
      default:
        return ""
    }
  }

  const sidebar = (
    <div
      className={cn(
        "h-full flex flex-col relative transition-all duration-300",
        collapsed ? "w-16 sm:w-20" : "w-64",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/80 to-blue-50/80 dark:from-blue-950/80 dark:to-cyan-950/80 backdrop-blur-xl"></div>
      <div className="absolute inset-0 glass-liquid-dark"></div>
      <div className="py-3 sm:py-4 px-3 sm:px-4 flex items-center justify-between border-b border-cyan-100/30 dark:border-cyan-800/20 relative">
        <div className="absolute inset-0 glass-liquid-colored neon-glow-blue liquid-animate"></div>
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2 font-semibold relative z-10">
            <div className="relative">
              <Droplets className="h-6 w-6 text-primary ripple drop-shadow-lg" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md -z-10 animate-pulse"></div>
            </div>
            <span className="text-xl gradient-text drop-shadow-sm">AquaMonitor</span>
          </Link>
        ) : (
          <Link href="/" className="mx-auto relative z-10">
            <div className="relative">
              <Droplets className="h-7 w-7 text-primary ripple drop-shadow-lg" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md -z-10 animate-pulse"></div>
            </div>
          </Link>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-full p-1 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm relative z-10 transition-all duration-300"
          >
            <ChevronLeft
              className={cn("h-5 w-5 text-primary transition-transform drop-shadow-sm", collapsed && "rotate-180")}
            />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 py-3">
        <nav className="grid items-start px-2 gap-1.5">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-sm transition-all",
                "hover:bg-cyan-100/50 dark:hover:bg-cyan-800/30",
                pathname === route.href
                  ? "bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium dark:from-primary/20 dark:to-accent/20"
                  : "text-blue-700 dark:text-blue-200",
                collapsed && "justify-center px-1 sm:px-2",
              )}
            >
              <route.icon
                className={cn("h-5 w-5", pathname === route.href ? "text-primary" : "text-blue-600 dark:text-blue-400")}
              />
              {!collapsed && <span>{route.title}</span>}
            </Link>
          ))}

          {/* Settings section - only show if user has access to any settings */}
          {availableSettingsRoutes.length > 0 && (
            <>
              {!collapsed ? (
                <div className="mt-2 pt-2 border-t border-cyan-100/70 dark:border-cyan-800/30">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between px-3 py-2.5 text-sm font-normal text-blue-700 dark:text-blue-200",
                      "hover:bg-cyan-100/50 dark:hover:bg-cyan-800/30",
                      openGroups.settings && "bg-cyan-100/30 dark:bg-cyan-800/20",
                    )}
                    onClick={() => toggleGroup("settings")}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span>Configuración</span>
                    </div>
                    {openGroups.settings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  {openGroups.settings && (
                    <div className="ml-4 mt-1 grid gap-1 pl-4 border-l border-cyan-200/70 dark:border-cyan-800/30">
                      {availableSettingsRoutes.map((route) => (
                        <Link
                          key={route.href}
                          href={route.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                            "hover:text-primary dark:hover:text-primary",
                            pathname === route.href ? "font-medium text-primary" : "text-blue-600 dark:text-blue-300",
                          )}
                        >
                          {route.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-center px-2 py-2.5 mt-2 border-t border-cyan-100/70 dark:border-cyan-800/30",
                    "hover:bg-cyan-100/50 dark:hover:bg-cyan-800/30",
                    pathname.startsWith("/settings") &&
                      "bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20",
                  )}
                  onClick={() => !isMobile && setCollapsed(false)}
                >
                  <Settings
                    className={cn(
                      "h-5 w-5",
                      pathname.startsWith("/settings") ? "text-primary" : "text-blue-600 dark:text-blue-400",
                    )}
                  />
                </Button>
              )}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* User section and logout */}
      <div className="p-3 border-t border-cyan-100/30 dark:border-cyan-800/20 relative">
        <div className="absolute inset-0 glass-liquid-colored"></div>
        {!collapsed ? (
          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200 truncate">
                  {user?.name || "Usuario"}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 truncate">
                  {user ? getRoleDisplayText(user.role) : ""}
                </p>
                {user && <p className="text-xs text-blue-500 dark:text-blue-400 truncate">{getUserAccessSummary()}</p>}
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full justify-start gap-3 px-2 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        ) : (
          <div className="space-y-2 relative z-10">
            {/* User avatar in collapsed mode */}
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="w-full justify-center p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          className="fixed left-4 top-4 z-40 md:hidden bg-white/80 backdrop-blur-sm border-cyan-200 text-primary hover:bg-cyan-50 dark:bg-blue-900/80 dark:border-cyan-800 dark:text-blue-200"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="p-0 border-r-cyan-200 dark:border-r-cyan-800 w-64">
            {sidebar}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return sidebar
}

export default Sidebar
