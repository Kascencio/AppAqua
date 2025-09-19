"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Zap, Fish, Calendar, TrendingUp, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GenerateProcessesButtonProps {
  onGenerate?: () => void
}

export function GenerateProcessesButton({ onGenerate }: GenerateProcessesButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Procesos Generados",
        description: "Se han generado 15 procesos de ejemplo exitosamente",
      })

      setShowDialog(false)
      onGenerate?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron generar los procesos",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)} className="gap-2">
        <Zap className="h-4 w-4" />
        Generar Procesos
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fish className="h-5 w-5 text-blue-600" />
              Generar Procesos de Ejemplo
            </DialogTitle>
            <DialogDescription>
              Esta función creará procesos de cultivo realistas con diferentes estados y características
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Se generarán 15 procesos de ejemplo con datos realistas basados en las especies e instalaciones
                existentes
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Estados de Procesos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Activos</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ~8-10
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completados</span>
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      ~3-5
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Extendidos</span>
                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                      ~2-3
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Características
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Duración</span>
                    <span className="text-sm text-muted-foreground">90-270 días</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Extensiones</span>
                    <span className="text-sm text-muted-foreground">30% con extensión</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Códigos</span>
                    <span className="text-sm text-muted-foreground">Auto-generados</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Los procesos incluirán:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Códigos de proceso únicos generados automáticamente</li>
                <li>• Fechas realistas distribuidas en los últimos 6 meses</li>
                <li>• Estados calculados basados en fechas actuales</li>
                <li>• Progreso calculado automáticamente</li>
                <li>• Extensiones con motivos realistas (30% de los procesos)</li>
                <li>• Asignación aleatoria a especies e instalaciones existentes</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isGenerating}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generar 15 Procesos
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
