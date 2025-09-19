"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"
import { format, subDays, isAfter, isBefore } from "date-fns"
import { es } from "date-fns/locale"

interface DateRange {
  from: Date
  to: Date
}

interface ProcessDateFilterProps {
  processDateRange: DateRange
  selectedFilter: string
  onFilterChange: (filter: string, dateRange: DateRange) => void
}

const filterOptions = [
  { value: "24hours", label: "Últimas 24 horas", days: 1 },
  { value: "7days", label: "Últimos 7 días", days: 7 },
  { value: "1month", label: "Último mes", days: 30 },
  { value: "3months", label: "Últimos 3 meses", days: 90 },
  { value: "full", label: "Desde el inicio del proceso", days: null },
]

export function ProcessDateFilter({ processDateRange, selectedFilter, onFilterChange }: ProcessDateFilterProps) {
  const handleFilterSelect = (value: string) => {
    const option = filterOptions.find((opt) => opt.value === value)
    if (!option) return

    let newRange: DateRange

    if (option.value === "full") {
      // Mostrar todo el rango del proceso
      newRange = processDateRange
    } else {
      // Calcular el rango basado en los días seleccionados
      const now = new Date()
      const fromDate = subDays(now, option.days!)

      // Asegurar que no exceda los límites del proceso
      const constrainedFrom = isAfter(fromDate, processDateRange.from) ? fromDate : processDateRange.from
      const constrainedTo = isBefore(now, processDateRange.to) ? now : processDateRange.to

      newRange = {
        from: constrainedFrom,
        to: constrainedTo,
      }
    }

    onFilterChange(value, newRange)
  }

  const getFilterDescription = () => {
    const option = filterOptions.find((opt) => opt.value === selectedFilter)
    if (!option) return ""

    if (option.value === "full") {
      return `Todo el proceso (${format(processDateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(
        processDateRange.to,
        "dd/MM/yyyy",
        { locale: es },
      )})`
    }

    return option.label
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Período de visualización:</span>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedFilter} onValueChange={handleFilterSelect}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="outline" className="text-xs">
          {getFilterDescription()}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground ml-auto">
        <span className="font-medium">Límites del proceso:</span>{" "}
        {format(processDateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
        {format(processDateRange.to, "dd/MM/yyyy", { locale: es })}
      </div>
    </div>
  )
}
