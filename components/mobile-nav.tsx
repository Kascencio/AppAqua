"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

const routes = [
  {
    href: "/",
    label: "Dashboard",
    active: (pathname: string) => pathname === "/",
  },
  {
    href: "/branches",
    label: "Sucursales",
    active: (pathname: string) => pathname === "/branches",
  },
  {
    href: "/facilities",
    label: "Instalaciones",
    active: (pathname: string) => pathname === "/facilities",
  },
  {
    href: "/sensors",
    label: "Sensores",
    active: (pathname: string) => pathname === "/sensors",
  },
  {
    href: "/analytics",
    label: "Analítica",
    active: (pathname: string) => pathname === "/analytics",
  },
  {
    href: "/map",
    label: "Mapa",
    active: (pathname: string) => pathname === "/map",
  },
  {
    href: "/notifications",
    label: "Notificaciones",
    active: (pathname: string) => pathname === "/notifications",
  },
  {
    href: "/users",
    label: "Usuarios",
    active: (pathname: string) => pathname === "/users",
  },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] pr-0">
        <nav className="flex flex-col gap-4 mt-8">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setOpen(false)}
              className={cn(
                "px-2 py-1 text-lg transition-colors hover:text-primary rounded-md",
                route.active(pathname) ? "bg-muted font-medium" : "font-normal",
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
