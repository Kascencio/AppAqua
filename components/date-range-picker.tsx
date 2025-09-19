"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateRangePickerProps {
  className?: string
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export function DateRangePicker({ className, dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Predefined ranges
  const handleRangeSelect = (value: string) => {
    const today = new Date()
    let from: Date
    let to: Date = today

    switch (value) {
      case "today":
        from = today
        break
      case "yesterday":
        from = addDays(today, -1)
        to = addDays(today, -1)
        break
      case "last7":
        from = addDays(today, -6)
        break
      case "last30":
        from = addDays(today, -29)
        break
      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case "lastMonth":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        to = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      default:
        return
    }

    onDateRangeChange({ from, to })
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: es })
              )
            ) : (
              <span>Seleccionar rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <Select onValueChange={handleRangeSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rango predefinido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="yesterday">Ayer</SelectItem>
                <SelectItem value="last7">Últimos 7 días</SelectItem>
                <SelectItem value="last30">Últimos 30 días</SelectItem>
                <SelectItem value="thisMonth">Este mes</SelectItem>
                <SelectItem value="lastMonth">Mes anterior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => {
              if (range) {
                onDateRangeChange(range)
                if (range.to) {
                  setIsOpen(false)
                }
              }
            }}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
