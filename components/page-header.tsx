import type React from "react"
import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  children?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, description, icon: Icon, children, actions }: PageHeaderProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{title}</h1>
            {description && <p className="text-blue-700 dark:text-blue-300 mt-1 text-sm sm:text-base">{description}</p>}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 w-full sm:w-auto">{actions}</div>}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
