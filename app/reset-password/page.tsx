"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Droplets, Check, X, CheckCircle } from "lucide-react"
import Link from "next/link"

interface PasswordValidation {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
}

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Token de recuperación no válido")
    }
  }, [token])

  const validatePassword = (password: string): PasswordValidation => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  }

  const passwordValidation = validatePassword(formData.newPassword)
  const isPasswordValid = Object.values(passwordValidation).every(Boolean)
  const passwordsMatch = formData.newPassword === formData.confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setError("Token de recuperación no válido")
      return
    }

    setIsLoading(true)
    setError("")

    if (!isPasswordValid) {
      setError("La contraseña no cumple con los requisitos")
      setIsLoading(false)
      return
    }

    if (!passwordsMatch) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    const result = await resetPassword(token, formData.newPassword, formData.confirmPassword)
    
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || "Error al restablecer contraseña")
    }
    
    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-blue-950 dark:via-cyan-950 dark:to-indigo-950 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">¡Contraseña Restablecida!</CardTitle>
            <CardDescription>
              Tu contraseña ha sido cambiada exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Link href="/login">
              <Button className="w-full">
                Ir al Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-blue-950 dark:via-cyan-950 dark:to-indigo-950 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Droplets className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Token Inválido</CardTitle>
            <CardDescription>
              El enlace de recuperación no es válido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                El token de recuperación no es válido o ha expirado. 
                Solicita un nuevo enlace de recuperación.
              </AlertDescription>
            </Alert>
            <Link href="/forgot-password">
              <Button className="w-full">
                Solicitar Nuevo Enlace
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Volver al Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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
          <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña
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
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu nueva contraseña"
                  value={formData.newPassword}
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
              {formData.newPassword && (
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
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma tu nueva contraseña"
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
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restableciendo...
                </>
              ) : (
                "Restablecer Contraseña"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="ghost" className="w-full">
                Volver al Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
