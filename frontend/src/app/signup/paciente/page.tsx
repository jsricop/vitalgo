"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField, SelectField } from "@/shared/components/molecules/form-field"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { Heart, ArrowRight, Eye, EyeOff, CheckCircle, X, Stethoscope, Search, ChevronDown } from "lucide-react"

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
  const [isCheckingDocument, setIsCheckingDocument] = useState(false)
  const [documentAlert, setDocumentAlert] = useState("")
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailAlert, setEmailAlert] = useState("")
  const [epsOptions, setEpsOptions] = useState<Array<{ value: string; label: string }>>([])
  const [isLoadingEps, setIsLoadingEps] = useState(false)
  const [epsSearch, setEpsSearch] = useState("")
  const [showEpsDropdown, setShowEpsDropdown] = useState(false)
  const [filteredEpsOptions, setFilteredEpsOptions] = useState<Array<{ value: string; label: string }>>([])
  const [selectedEpsIndex, setSelectedEpsIndex] = useState(-1)

  // Fetch EPS list on component mount
  useEffect(() => {
    const fetchEpsList = async () => {
      setIsLoadingEps(true)
      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/eps', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const epsData = await response.json()
          const formattedOptions = epsData.map((eps: any) => ({
            value: eps.name,
            label: eps.name
          }))
          setEpsOptions(formattedOptions)
        }
      } catch (error) {
        console.error('Error fetching EPS list:', error)
      } finally {
        setIsLoadingEps(false)
      }
    }

    fetchEpsList()
  }, [])

  // Filter EPS options based on search
  useEffect(() => {
    if (epsSearch.trim() === "") {
      setFilteredEpsOptions(epsOptions)
    } else {
      const filtered = epsOptions.filter(eps =>
        eps.label.toLowerCase().includes(epsSearch.toLowerCase())
      )
      setFilteredEpsOptions(filtered)
    }
    // Reset selection when options change
    setSelectedEpsIndex(-1)
  }, [epsSearch, epsOptions])

  // Close EPS dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.eps-autocomplete')) {
        setShowEpsDropdown(false)
      }
    }

    if (showEpsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEpsDropdown])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedEpsIndex >= 0 && showEpsDropdown) {
      const dropdownElement = document.querySelector('.eps-dropdown')
      const selectedElement = dropdownElement?.children[selectedEpsIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedEpsIndex, showEpsDropdown])

  const handleGoToCompleteProfile = () => {
    setShowSuccessModal(false)
    router.push('/complete-medical-profile')
  }

  const handleEpsSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEpsSearch(value)
    setFormData(prev => ({ ...prev, eps: value }))
    setShowEpsDropdown(true)
    setSelectedEpsIndex(-1) // Reset selection when typing
    
    // Clear error if exists
    if (errors.eps) {
      setErrors(prev => ({ ...prev, eps: "" }))
    }
  }

  const handleEpsSelect = (eps: { value: string; label: string }) => {
    setFormData(prev => ({ ...prev, eps: eps.value }))
    setEpsSearch(eps.label)
    setShowEpsDropdown(false)
    setSelectedEpsIndex(-1)
    
    // Clear error if exists
    if (errors.eps) {
      setErrors(prev => ({ ...prev, eps: "" }))
    }
  }

  const handleEpsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showEpsDropdown || filteredEpsOptions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedEpsIndex(prev => 
          prev < filteredEpsOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedEpsIndex(prev => 
          prev > 0 ? prev - 1 : filteredEpsOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedEpsIndex >= 0 && selectedEpsIndex < filteredEpsOptions.length) {
          handleEpsSelect(filteredEpsOptions[selectedEpsIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowEpsDropdown(false)
        setSelectedEpsIndex(-1)
        break
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
    if (documentAlert && name !== "numeroDocumento" && name !== "tipoDocumento") {
      setDocumentAlert("")
    }
    if (emailAlert && name !== "email") {
      setEmailAlert("")
    }
  }

  const checkDocumentExists = async (documentType: string, documentNumber: string) => {
    if (!documentType || !documentNumber || documentNumber.length < 5) {
      return
    }

    setIsCheckingDocument(true)
    setDocumentAlert("")

    try {
      const response = await fetch(`http://localhost:8000/api/v1/auth/check-document?document_type=${documentType}&document_number=${documentNumber}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setDocumentAlert(`Este número de documento ya está registrado. Si es tu cuenta, puedes iniciar sesión.`)
          setErrors(prev => ({ ...prev, numeroDocumento: "Este documento ya está registrado" }))
        }
      }
    } catch (error) {
      console.error("Error checking document:", error)
    } finally {
      setIsCheckingDocument(false)
    }
  }

  const checkEmailExists = async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return
    }

    setIsCheckingEmail(true)
    setEmailAlert("")

    try {
      const response = await fetch(`http://localhost:8000/api/v1/auth/check-email?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setEmailAlert(`Este email ya está registrado. Si es tu cuenta, puedes iniciar sesión.`)
          setErrors(prev => ({ ...prev, email: "Este email ya está registrado" }))
        }
      }
    } catch (error) {
      console.error("Error checking email:", error)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e)
    
    // Clear alerts when user starts typing
    if (emailAlert) {
      setEmailAlert("")
    }
    
    // Trigger email check with debounce
    const timeoutId = setTimeout(() => {
      checkEmailExists(e.target.value)
    }, 1000) // Wait 1 second after user stops typing
    
    return () => clearTimeout(timeoutId)
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    handleInputChange(e)
    
    // Trigger document check when both type and number are available
    if (e.target.name === "numeroDocumento" && formData.tipoDocumento) {
      const timeoutId = setTimeout(() => {
        checkDocumentExists(formData.tipoDocumento, e.target.value)
      }, 1000) // Wait 1 second after user stops typing
      
      return () => clearTimeout(timeoutId)
    } else if (e.target.name === "tipoDocumento" && formData.numeroDocumento) {
      const timeoutId = setTimeout(() => {
        checkDocumentExists(e.target.value, formData.numeroDocumento)
      }, 500)
      
      return () => clearTimeout(timeoutId)
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
    } else if (!epsOptions.find(eps => eps.value === formData.eps || eps.label === formData.eps)) {
      newErrors.eps = "Selecciona una EPS válida de la lista"
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
        const errorData = await response.json().catch(() => ({}))
        
        // Handle specific error messages from the server
        if (response.status === 400) {
          if (errorData.detail && errorData.detail.includes("email")) {
            setErrors(prev => ({ ...prev, email: "Este email ya está registrado" }))
            setEmailAlert("Este email ya está registrado. Si es tu cuenta, puedes iniciar sesión.")
            return
          } else if (errorData.detail && errorData.detail.includes("document")) {
            setErrors(prev => ({ ...prev, numeroDocumento: "Este documento ya está registrado" }))
            setDocumentAlert("Este documento ya está registrado. Si es tu cuenta, puedes iniciar sesión.")
            return
          }
        }
        
        throw new Error(errorData.detail || "Error al registrar el paciente")
      }

      const data = await response.json()
      console.log("Registro exitoso:", data)

      // Hacer login automático después del registro
      const loginResponse = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      })

      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        
        // Store token and user data in localStorage
        localStorage.setItem('access_token', loginData.access_token)
        localStorage.setItem('user_data', JSON.stringify(loginData.user))
        localStorage.setItem('user_role', loginData.role)
        
        // Mostrar modal de éxito y después redirigir
        setRegisteredData(data)
        setShowSuccessModal(true)
      } else {
        // Si el login falla, mostrar modal de éxito sin auto-login
        setRegisteredData(data)
        setShowSuccessModal(true)
      }
      
    } catch (error: any) {
      const errorMessage = error.message || "Error al registrar la cuenta. Inténtalo de nuevo."
      setSignupError(errorMessage)
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
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-3 mb-8">
              <img 
                src="/logoh-blue-light-background.png" 
                alt="VitalGo Logo" 
                className="h-12 w-auto"
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-vitalgo-dark">VitalGo</span>
                <span className="text-xs text-gray-600">Diagnóstico rápido y atención prioritaria</span>
              </div>
            </Link>
            <h1 className="text-3xl font-light text-vitalgo-dark mb-2">
              Únete a VitalGo
            </h1>
            <p className="text-gray-600">
              Registra tu información médica de forma segura
            </p>
          </div>

          <Card className="shadow-2xl border border-white/20 backdrop-blur-sm bg-white/95">
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

              {documentAlert && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        {documentAlert}
                      </p>
                      <div className="mt-2">
                        <Link href="/login">
                          <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                            Ir al Login
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
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
                    onChange={handleDocumentChange}
                    error={errors.tipoDocumento}
                    required
                  />

                  <div className="relative">
                    <InputField
                      label="Número de documento"
                      type="text"
                      name="numeroDocumento"
                      placeholder="1234567890"
                      value={formData.numeroDocumento}
                      onChange={handleDocumentChange}
                      error={errors.numeroDocumento}
                      required
                    />
                    {isCheckingDocument && (
                      <div className="absolute right-3 top-9 flex items-center">
                        <Spinner size="sm" />
                      </div>
                    )}
                  </div>
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

                  {/* EPS Autocomplete */}
                  <div className="relative eps-autocomplete">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EPS *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="epsSearch"
                        placeholder={isLoadingEps ? "Cargando EPS..." : "Busca tu EPS..."}
                        value={epsSearch}
                        onChange={handleEpsSearch}
                        onKeyDown={handleEpsKeyDown}
                        onFocus={() => setShowEpsDropdown(true)}
                        disabled={isLoadingEps}
                        className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-vitalgo-green focus:border-transparent transition-colors ${
                          errors.eps ? 'border-red-300' : 'border-gray-300'
                        }`}
                        autoComplete="off"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      {showEpsDropdown && (
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    {showEpsDropdown && !isLoadingEps && (
                      <div className="eps-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredEpsOptions.length > 0 ? (
                          filteredEpsOptions.map((eps, index) => (
                            <div
                              key={index}
                              className={`px-3 py-2 cursor-pointer transition-colors ${
                                index === selectedEpsIndex 
                                  ? 'bg-vitalgo-green/20 text-vitalgo-dark' 
                                  : 'hover:bg-vitalgo-green/10'
                              }`}
                              onClick={() => handleEpsSelect(eps)}
                              onMouseEnter={() => setSelectedEpsIndex(index)}
                            >
                              {eps.label}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            No se encontraron EPS que coincidan
                          </div>
                        )}
                      </div>
                    )}
                    
                    {errors.eps && (
                      <p className="mt-1 text-sm text-red-600">{errors.eps}</p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <InputField
                    label="Email"
                    type="email"
                    name="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleEmailChange}
                    error={errors.email}
                    required
                  />
                  {isCheckingEmail && (
                    <div className="absolute right-3 top-9 flex items-center">
                      <Spinner size="sm" />
                    </div>
                  )}
                  {emailAlert && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">{emailAlert}</p>
                    </div>
                  )}
                </div>

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

              <div className="mt-6 text-center space-y-4">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes una cuenta?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-vitalgo-green hover:text-vitalgo-green/80"
                  >
                    Inicia sesión
                  </Link>
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    ¿Eres profesional de la salud?
                  </p>
                  <Link href="/signup/paramedico">
                    <Button
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Stethoscope className="mr-2 h-4 w-4" />
                      Registrarse como Profesional
                    </Button>
                  </Link>
                </div>
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
                Tu cuenta ha sido creada exitosamente. Ahora completa tu perfil médico para tener toda tu información disponible en emergencias.
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
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="flex-1"
                >
                  Ir al Login
                </Button>
                <Button
                  onClick={handleGoToCompleteProfile}
                  className="flex-1 bg-vitalgo-green hover:bg-vitalgo-green/90"
                >
                  Completar Perfil Médico
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}