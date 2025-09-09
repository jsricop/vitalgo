"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField } from "@/shared/components/molecules/form-field"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { Heart, ArrowRight, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Ingresa un email válido"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // TODO: Implement API call
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Error al iniciar sesión")
      }

      const data = await response.json()
      console.log("Login successful:", data)
      
      // Store token and user data in localStorage
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user_data', JSON.stringify(data.user))
      localStorage.setItem('user_role', data.role)
      
      // Redirect based on user role
      if (data.role === 'patient') {
        router.push('/dashboard')
      } else if (data.role === 'paramedic') {
        router.push('/dashboard')
      } else {
        router.push('/dashboard')
      }
      
    } catch (error) {
      setLoginError("Email o contraseña incorrectos. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background patterns */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-vitalgo-green/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-0 w-64 h-64 bg-vitalgo-green/5 rounded-full blur-2xl"></div>
        </div>
        <div className="max-w-md w-full space-y-8 relative z-10">
          {/* Logo and Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-3 mb-8">
              <img 
                src="/logoh-blue-light-background.png" 
                alt="VitalGo Logo" 
                className="h-12 w-auto"
              />
            </Link>
            <h1 className="text-3xl font-light text-vitalgo-dark mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-gray-600">
              Accede a tu información médica de forma segura
            </p>
          </div>

          {/* Login Form */}
          <Card className="shadow-2xl border border-white/20 backdrop-blur-sm bg-white/95">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-normal text-center text-gray-900">
                Iniciar Sesión
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loginError && (
                <AlertWithIcon
                  variant="destructive"
                  description={loginError}
                  className="mb-6"
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                  label="Email"
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                  required
                />

                <div className="relative">
                  <InputField
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-vitalgo-green focus:ring-vitalgo-green border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">Recordarme</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-vitalgo-green hover:text-vitalgo-green/80"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-vitalgo-green hover:bg-vitalgo-green/90 text-white h-12 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes una cuenta?{" "}
                  <Link
                    href="/signup/paciente"
                    className="font-medium text-vitalgo-green hover:text-vitalgo-green/80"
                  >
                    Regístrate como paciente
                  </Link>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  ¿Eres profesional de la salud?{" "}
                  <Link
                    href="/signup/paramedico"
                    className="font-medium text-vitalgo-green hover:text-vitalgo-green/80"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Access */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">¿Acceso de emergencia?</p>
            <Link href="/emergency">
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Acceso de Emergencia QR
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}