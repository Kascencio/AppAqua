"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react" // Import Plus from lucide-react
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProcesoForm } from "@/components/proceso-form"

interface AddProcessDialogProps {
  onProcessCreated?: (process: any) => void
}

export function AddProcessDialog({ onProcessCreated }: AddProcessDialogProps) {
  const [open, setOpen] = React.useState(false)

  const handleSuccess = (proceso: any) => {
    setOpen(false)
    onProcessCreated?.(proceso)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Crear Proceso {/* Corrected the Button usage */}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proceso de Cultivo</DialogTitle>
          <DialogDescription>
            Define un nuevo ciclo de cultivo especificando la especie, instalación y período de tiempo. El ID del
            proceso se generará automáticamente.
          </DialogDescription>
        </DialogHeader>
        <ProcesoForm onSubmit={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
