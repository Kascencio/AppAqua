"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"

interface DateRange {
  from: Date
  to: Date
}

interface MonitoringTimeSelectorProps {
  selectedRange: string
  onRangeChange: (range: string, dateRange: DateRange) => void
}

const timeRanges = [
  { value: "1hour", label: "Última hora", days: 0, hours: 1 },
  { value: "6hours", label: "Últimas 6 horas", days: 0, hours: 6 },
  { value: "24hours", label: "Últimas 24 horas", days: 1, hours: 0 },
  { value: "7days", label: "Últimos 7 días", days: 7, hours: 0 },
  { value: "30days", label: "Últimos 30 días", days: 30, hours: 0 },
  { value: "3months", label: "Últimos 3 meses", days: 90, hours: 0 },
  { value: "6months", label: "Últimos 6 meses", days: 180, hours: 0 },
  { value: "1year", label: "Último año", days: 365, hours: 0 },
  { value: "custom", label: "Personalizado", days: 0, hours: 0 },
]

export function MonitoringTimeSelector({ selectedRange, onRangeChange }: MonitoringTimeSelectorProps) {
  const [customDateRange, setCustomDateRange] = React.useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [showCustomPicker, setShowCustomPicker] = React.useState(false)

  const handleRangeSelect = (value: string) => {
    if (value === "custom") {
      setShowCustomPicker(true)
      onRangeChange(value, customDateRange)
    } else {
      setShowCustomPicker(false)
      const range = timeRanges.find((r) => r.value === value)
      if (range) {
        const to = new Date()
        const from = range.hours > 0 ? new Date(to.getTime() - range.hours * 60 * 60 * 1000) : subDays(to, range.days)

        const dateRange = { from, to }
        onRangeChange(value, dateRange)
      }
    }
  }

  const handleCustomDateChange = (newRange: DateRange | undefined) => {
    if (!newRange || !newRange.from || !newRange.to) return
    setCustomDateRange(newRange)
    onRangeChange("custom", newRange)
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedRange} onValueChange={handleRangeSelect}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          {timeRanges.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCustomPicker && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-64 justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customDateRange.from && customDateRange.to ? (
                <>
                  {format(customDateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                  {format(customDateRange.to, "dd/MM/yyyy", { locale: es })}
                </>
              ) : (
                "Seleccionar fechas"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={customDateRange.from}
              selected={{
                from: customDateRange.from,
                to: customDateRange.to,
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  handleCustomDateChange({ from: range.from, to: range.to })
                }
              }}
              numberOfMonths={2}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
