"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { endOfDay, format, isSameDay, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/components/ui/use-mobile"

interface DateRangePickerProps {
  className?: string
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export function DateRangePicker({ className, dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [draftRange, setDraftRange] = React.useState<DateRange>(dateRange)
  const [month, setMonth] = React.useState<Date>(dateRange?.from ?? new Date())
  const isMobile = useIsMobile()

  React.useEffect(() => {
    if (isOpen) {
      setDraftRange(dateRange)
      setMonth(dateRange?.from ?? new Date())
      return
    }

    setDraftRange(dateRange)
  }, [dateRange, isOpen])

  const label = React.useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      if (isSameDay(dateRange.from, dateRange.to)) {
        return format(dateRange.from, "dd/MM/yyyy", { locale: es })
      }
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`
    }
    if (dateRange?.from) {
      return format(dateRange.from, "dd/MM/yyyy", { locale: es })
    }
    return "Seleccionar rango de fechas"
  }, [dateRange?.from, dateRange?.to])

  const handleApply = React.useCallback(() => {
    if (!draftRange?.from) {
      onDateRangeChange({ from: undefined, to: undefined })
      setIsOpen(false)
      return
    }

    const normalizedRange = {
      from: startOfDay(draftRange.from),
      to: endOfDay(draftRange.to ?? draftRange.from),
    }

    onDateRangeChange(normalizedRange)
    setIsOpen(false)
  }, [draftRange, onDateRangeChange])

  const handleClear = React.useCallback(() => {
    const emptyRange = { from: undefined, to: undefined }
    setDraftRange(emptyRange)
    onDateRangeChange(emptyRange)
    setIsOpen(false)
  }, [onDateRangeChange])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-[280px] sm:w-[330px] justify-start text-left font-normal", !dateRange?.from && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-[96vw] p-0" align="start">
          <div className="flex flex-col">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">Rango personalizado</p>
              <p className="text-xs text-muted-foreground">
                Selecciona el período y presiona aplicar para actualizar las gráficas.
              </p>
            </div>
            <Calendar
              initialFocus
              mode="range"
              month={month}
              onMonthChange={setMonth}
              selected={draftRange}
              onSelect={(range) => setDraftRange(range ?? { from: undefined, to: undefined })}
              numberOfMonths={isMobile ? 1 : 2}
              locale={es}
            />
            <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                {draftRange?.from
                  ? draftRange?.to
                    ? `${format(draftRange.from, "dd/MM/yyyy", { locale: es })} - ${format(draftRange.to, "dd/MM/yyyy", { locale: es })}`
                    : `Inicio: ${format(draftRange.from, "dd/MM/yyyy", { locale: es })}`
                  : "Sin rango seleccionado"}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleClear}>
                  Limpiar
                </Button>
                <Button type="button" size="sm" onClick={handleApply} disabled={!draftRange?.from}>
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
