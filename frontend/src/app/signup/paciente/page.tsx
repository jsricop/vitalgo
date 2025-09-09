"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField, SelectField } from "@/shared/components/molecules/form-field"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { Heart, ArrowRight, Eye, EyeOff, CheckCircle, X } from "lucide-react"

const tiposDocumento = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "PPT", label: "Permiso por Protección Temporal" },
  { value: "TI", label: "Tarjeta de Identidad" },
  { value: "PA", label: "Pasaporte" }
]

const tiposSangre = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" }
]

export default function SignupPacientePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    tipoDocumento: "",
    numeroDocumento: "",
    telefono: "",
    fechaNacimiento: "",
    tipoSangre: "",
    eps: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signupError, setSignupError] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [registeredData, setRegisteredData] = useState<any>(null)

  const handleGoToLogin = () => {
    setShowSuccessModal(false)
    router.push('/login')
  }

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

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = "La fecha de nacimiento es requerida"
    }

    if (!formData.tipoSangre) {
      newErrors.tipoSangre = "El tipo de sangre es requerido"
    }

    if (!formData.eps) {
      newErrors.eps = "La EPS es requerida"
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
      const response = await fetch("http://localhost:8000/api/v1/auth/register/patient", {
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
          document_type: formData.tipoDocumento,
          document_number: formData.numeroDocumento,
          birth_date: formData.fechaNacimiento,
          gender: "M", // Por ahora hardcoded, después se puede agregar selector
          blood_type: formData.tipoSangre,
          eps: formData.eps,
          emergency_contact_name: "Contacto de Emergencia",
          emergency_contact_phone: formData.telefono
        }),
      })

      if (!response.ok) {
        throw new Error("Error al registrar el paciente")
      }

      const data = await response.json()
      console.log("Registro exitoso:", data)
      
      // Mostrar modal de éxito
      setRegisteredData(data)
      setShowSuccessModal(true)
      
    } catch (error) {
      setSignupError("Error al registrar la cuenta. Inténtalo de nuevo.")
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
            <h1 className="text-3xl font-light text-vitalgo-dark mb-2">
              Únete a VitalGo
            </h1>
            <p className="text-gray-600">
              Registra tu información médica de forma segura
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-normal text-center text-gray-900">
                Registro de Paciente
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

                <div className="grid grid-cols-2 gap-4">
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

                  <InputField
                    label="Fecha de nacimiento"
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleInputChange}
                    error={errors.fechaNacimiento}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Tipo de sangre"
                    name="tipoSangre"
                    options={tiposSangre}
                    placeholder="Selecciona"
                    value={formData.tipoSangre}
                    onChange={handleInputChange}
                    error={errors.tipoSangre}
                    required
                  />

                  <InputField
                    label="EPS"
                    type="text"
                    name="eps"
                    placeholder="Tu EPS"
                    value={formData.eps}
                    onChange={handleInputChange}
                    error={errors.eps}
                    required
                  />
                </div>

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
                  {isLoading ? "Registrando..." : "Crear Cuenta"}
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
            {/* Botón cerrar */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Contenido del modal */}
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Registro Exitoso!
              </h3>

              <p className="text-gray-600 mb-6">
                Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión con tus credenciales.
              </p>

              {registeredData && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Datos registrados:</h4>
                  <p className="text-sm text-gray-600">
                    <strong>Nombre:</strong> {registeredData.user?.first_name} {registeredData.user?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {registeredData.user?.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Tipo de sangre:</strong> {registeredData.patient?.blood_type}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={handleGoToLogin}
                  className="flex-1 bg-vitalgo-green hover:bg-vitalgo-green/90"
                >
                  Ir al Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}