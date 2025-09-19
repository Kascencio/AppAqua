"use client"

import { Building2 } from "lucide-react"

interface EmpresaHeaderProps {
  nombreEmpresa?: string
  logo?: string
  className?: string
}

export function EmpresaHeader({
  nombreEmpresa = "Cooperativa Transformando Mecoacán",
  logo,
  className = "",
}: EmpresaHeaderProps) {
  return (
    <div
      className={`flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm ${className}`}
    >
      {logo ? (
        <img
          src={logo || "/placeholder.svg"}
          alt="Logo de empresa"
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
        />
      ) : (
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-sm">
          <Building2 className="w-6 h-6 text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Sistema de Monitoreo Acuícola</p>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{nombreEmpresa}</h1>
      </div>
    </div>
  )
}
