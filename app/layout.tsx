import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AppProvider } from "@/context/app-context"
import { AuthProvider } from "@/context/auth-context"
import ProtectedLayout from "@/components/protected-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AquaMonitor - Sistema de Monitoreo Acuícola",
  description: "Sistema integral de monitoreo para instalaciones acuícolas",
  generator: "v0.dev"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-screen bg-background font-sans antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <AppProvider>
            <ProtectedLayout>{children}</ProtectedLayout>
            <Toaster />
          </AppProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
