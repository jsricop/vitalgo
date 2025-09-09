"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField, SelectField } from "@/shared/components/molecules/form-field"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { Heart, ArrowRight, Eye, EyeOff, Shield } from "lucide-react"

const tiposDocumento = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "PPT", label: "Permiso por Protección Temporal" },
  { value: "TI", label: "Tarjeta de Identidad" },
  { value: "PA", label: "Pasaporte" }
]

const especialidades = [
  { value: "PARAMEDICO", label: "Paramédico" },
  { value: "ENFERMERO", label: "Enfermero/a" },
  { value: "MEDICO", label: "Médico General" },
  { value: "TECNICO_URGENCIAS", label: "Técnico en Urgencias" },
  { value: "AUXILIAR_ENFERMERIA", label: "Auxiliar de Enfermería" }
]

export default function SignupParamedicoPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    tipoDocumento: "",
    numeroDocumento: "",
    telefono: "",
    especialidad: "",
    numeroLicencia: "",
    institucionLaboral: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signupError, setSignupError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    if (!formData.nombre) {
      newErrors.nombre = "El nombre es requerido"
    }

    if (!formData.tipoDocumento) {
      newErrors.tipoDocumento = "El tipo de documento es requerido"
    }

    if (!formData.numeroDocumento) {
      newErrors.numeroDocumento = "El número de documento es requerido"
    }

    if (!formData.telefono) {
      newErrors.telefono = "El teléfono es requerido"
    } else if (!/^\d{10}$/.test(formData.telefono)) {
      newErrors.telefono = "Ingresa un teléfono válido (10 dígitos)"
    }

    if (!formData.especialidad) {
      newErrors.especialidad = "La especialidad es requerida"
    }

    if (!formData.numeroLicencia) {
      newErrors.numeroLicencia = "El número de licencia profesional es requerido"
    }

    if (!formData.institucionLaboral) {
      newErrors.institucionLaboral = "La institución laboral es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/v1/auth/register/paramedic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.nombre.split(' ')[0],
          last_name: formData.nombre.split(' ').slice(1).join(' '),
          phone: formData.telefono,
          medical_license: formData.numeroLicencia,
          specialty: formData.especialidad,
          institution: formData.institucionLaboral,
          years_experience: 5, // Hardcoded por ahora
          license_expiry_date: "2030-12-31T23:59:59" // Hardcoded por ahora
        }),
      })

      if (!response.ok) {
        throw new Error("Error al registrar el paramédico")
      }

      const data = await response.json()
      console.log("Registro exitoso:", data)
      
    } catch (error) {
      setSignupError("Error al registrar la cuenta. Verifica que tu información profesional sea correcta.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="w-12 h-12 bg-vitalgo-green rounded-xl flex items-center justify-center">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-vitalgo-dark">VitalGo</span>
            </Link>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="h-6 w-6 text-vitalgo-green" />
              <h1 className="text-3xl font-light text-vitalgo-dark">
                Profesional de Salud
              </h1>
            </div>
            <p className="text-gray-600">
              Únete como paramédico certificado
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-normal text-center text-gray-900">
                Registro Profesional
              </CardTitle>
            </CardHeader>
            <CardContent>
              {signupError && (
                <AlertWithIcon
                  variant="destructive"
                  description={signupError}
                  className="mb-6"
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                  label="Nombre completo"
                  type="text"
                  name="nombre"
                  placeholder="Tu nombre completo"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  error={errors.nombre}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Tipo de documento"
                    name="tipoDocumento"
                    options={tiposDocumento}
                    placeholder="Selecciona"
                    value={formData.tipoDocumento}
                    onChange={handleInputChange}
                    error={errors.tipoDocumento}
                    required
                  />

                  <InputField
                    label="Número de documento"
                    type="text"
                    name="numeroDocumento"
                    placeholder="1234567890"
                    value={formData.numeroDocumento}
                    onChange={handleInputChange}
                    error={errors.numeroDocumento}
                    required
                  />
                </div>

                <InputField
                  label="Teléfono"
                  type="tel"
                  name="telefono"
                  placeholder="3001234567"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  error={errors.telefono}
                  required
                />

                <SelectField
                  label="Especialidad"
                  name="especialidad"
                  options={especialidades}
                  placeholder="Selecciona tu especialidad"
                  value={formData.especialidad}
                  onChange={handleInputChange}
                  error={errors.especialidad}
                  required
                />

                <InputField
                  label="Número de licencia profesional"
                  type="text"
                  name="numeroLicencia"
                  placeholder="123456789"
                  value={formData.numeroLicencia}
                  onChange={handleInputChange}
                  error={errors.numeroLicencia}
                  required
                />

                <InputField
                  label="Institución laboral"
                  type="text"
                  name="institucionLaboral"
                  placeholder="Hospital San Juan de Dios"
                  value={formData.institucionLaboral}
                  onChange={handleInputChange}
                  error={errors.institucionLaboral}
                  required
                />

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

                <div className="relative">
                  <InputField
                    label="Confirmar contraseña"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={errors.confirmPassword}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Verificación profesional</p>
                      <p>Tu registro será validado por nuestro equipo antes de aprobar tu acceso.</p>
                    </div>
                  </div>
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
                  {isLoading ? "Registrando..." : "Solicitar Registro"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes una cuenta?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-vitalgo-green hover:text-vitalgo-green/80"
                  >
                    Inicia sesión
                  </Link>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  ¿Eres paciente?{" "}
                  <Link
                    href="/signup/paciente"
                    className="font-medium text-vitalgo-green hover:text-vitalgo-green/80"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}