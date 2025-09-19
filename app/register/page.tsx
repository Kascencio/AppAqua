"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Droplets, Check, X } from "lucide-react"
import Link from "next/link"

interface PasswordValidation {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
}

export default function RegisterPage() {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo: "",
    telefono: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const validatePassword = (password: string): PasswordValidation => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  }

  const passwordValidation = validatePassword(formData.password)
  const isPasswordValid = Object.values(passwordValidation).every(Boolean)
  const passwordsMatch = formData.password === formData.confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("El registro público está deshabilitado. Contacte a un administrador.")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-blue-950 dark:via-cyan-950 dark:to-indigo-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Droplets className="h-12 w-12 text-primary" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md -z-10 animate-pulse"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">AquaMonitor</CardTitle>
          <CardDescription>
            Crea tu cuenta nueva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="nombre_completo">Nombre Completo</Label>
              <Input
                id="nombre_completo"
                name="nombre_completo"
                type="text"
                placeholder="Tu nombre completo"
                value={formData.nombre_completo}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo">Email</Label>
              <Input
                id="correo"
                name="correo"
                type="email"
                placeholder="tu@email.com"
                value={formData.correo}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (Opcional)</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="+52 999 123 4567"
                value={formData.telefono}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Validación de contraseña */}
              {formData.password && (
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-2 ${passwordValidation.length ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    Al menos 8 caracteres
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    Una letra mayúscula
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    Una letra minúscula
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.number ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    Un número
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.special ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    Un carácter especial
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {formData.confirmPassword && (
                <div className={`flex items-center gap-2 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  Las contraseñas coinciden
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !isPasswordValid || !passwordsMatch}
            >
              Solicitar cuenta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
