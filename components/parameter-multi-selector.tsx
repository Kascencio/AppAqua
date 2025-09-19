"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface Parameter {
  id: string
  name: string
  unit: string
  color: string
  icon: React.ReactNode
  minValue?: number
  maxValue?: number
}

interface ParameterMultiSelectorProps {
  parameters: Parameter[]
  selectedParameters: string[]
  onParametersChange: (parameters: string[]) => void
  className?: string
}

export function ParameterMultiSelector({
  parameters,
  selectedParameters,
  onParametersChange,
  className,
}: ParameterMultiSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const toggleParameter = (parameterId: string) => {
    const newSelection = selectedParameters.includes(parameterId)
      ? selectedParameters.filter((id) => id !== parameterId)
      : [...selectedParameters, parameterId]

    onParametersChange(newSelection)
  }

  const getSelectedParametersText = () => {
    if (selectedParameters.length === 0) return "Seleccionar parámetros"
    if (selectedParameters.length === 1) {
      const param = parameters.find((p) => p.id === selectedParameters[0])
      return param?.name || "1 parámetro"
    }
    return `${selectedParameters.length} parámetros seleccionados`
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[300px] justify-between">
            {getSelectedParametersText()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Buscar parámetros..." />
            <CommandList>
              <CommandEmpty>No se encontraron parámetros.</CommandEmpty>
              <CommandGroup>
                {parameters.map((parameter) => (
                  <CommandItem
                    key={parameter.id}
                    onSelect={() => toggleParameter(parameter.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedParameters.includes(parameter.id)}
                      onChange={() => toggleParameter(parameter.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-4 h-4" style={{ color: parameter.color }}>
                        {parameter.icon}
                      </div>
                      <span>{parameter.name}</span>
                      <span className="text-xs text-muted-foreground">({parameter.unit})</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedParameters.includes(parameter.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedParameters.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedParameters.map((paramId) => {
            const param = parameters.find((p) => p.id === paramId)
            if (!param) return null

            return (
              <Badge key={paramId} variant="secondary" className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3" style={{ color: param.color }}>
                  {param.icon}
                </div>
                {param.name}
                <button onClick={() => toggleParameter(paramId)} className="ml-1 hover:bg-muted rounded-full p-0.5">
                  ×
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
