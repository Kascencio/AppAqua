"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { endOfDay, format, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export function DateRangePicker({ className, dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const label = React.useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`
    }
    if (dateRange?.from) {
      return format(dateRange.from, "dd/MM/yyyy", { locale: es })
    }
    return "Seleccionar rango de fechas"
  }, [dateRange?.from, dateRange?.to])

  const handleSelect = React.useCallback(
    (range: DateRange | undefined) => {
      if (!range) {
        onDateRangeChange({ from: undefined, to: undefined })
        return
      }

      onDateRangeChange({
        from: range.from ? startOfDay(range.from) : undefined,
        to: range.to ? endOfDay(range.to) : undefined,
      })

      if (range.from && range.to) {
        setIsOpen(false)
      }
    },
    [onDateRangeChange],
  )

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-[280px] sm:w-[330px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from ?? new Date()}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
