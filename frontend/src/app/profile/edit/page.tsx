"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField, SelectField } from "@/shared/components/molecules/form-field"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { User, Save, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react"

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

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    document_type: "",
    document_number: "",
    birth_date: "",
    gender: "M",
    blood_type: "",
    eps: "",
    emergency_contact_name: "",
    emergency_contact_phone: ""
  })
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch('http://localhost:8000/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }

        const userData = await response.json()
        setUser(userData)

        // Try to get patient data
        try {
          const patientResponse = await fetch(`http://localhost:8000/api/v1/patients/${userData.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (patientResponse.ok) {
            const patientData = await patientResponse.json()
            setFormData({
              first_name: userData.first_name || "",
              last_name: userData.last_name || "",
              email: userData.email || "",
              phone: userData.phone || "",
              document_type: patientData.document_type || "",
              document_number: patientData.document_number || "",
              birth_date: patientData.birth_date ? patientData.birth_date.split('T')[0] : "",
              gender: patientData.gender || "M",
              blood_type: patientData.blood_type || "",
              eps: patientData.eps || "",
              emergency_contact_name: patientData.emergency_contact_name || "",
              emergency_contact_phone: patientData.emergency_contact_phone || ""
            })
          } else {
            // If no patient data, fill with user data only
            setFormData({
              first_name: userData.first_name || "",
              last_name: userData.last_name || "",
              email: userData.email || "",
              phone: userData.phone || "",
              document_type: "",
              document_number: "",
              birth_date: "",
              gender: "M",
              blood_type: "",
              eps: "",
              emergency_contact_name: "",
              emergency_contact_phone: ""
            })
          }
        } catch (patientError) {
          console.error('Error fetching patient data:', patientError)
          setFormData({
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            document_type: "",
            document_number: "",
            birth_date: "",
            gender: "M",
            blood_type: "",
            eps: "",
            emergency_contact_name: "",
            emergency_contact_phone: ""
          })
        }

      } catch (error) {
        console.error('Error fetching user data:', error)
        setErrorMessage('Error loading user data')
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name) newErrors.first_name = "El nombre es requerido"
    if (!formData.last_name) newErrors.last_name = "El apellido es requerido"
    if (!formData.email) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Ingresa un email válido"
    }
    if (!formData.phone) {
      newErrors.phone = "El teléfono es requerido"
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Ingresa un teléfono válido (10 dígitos)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {}

    if (passwordData.current_password || passwordData.new_password || passwordData.confirm_password) {
      if (!passwordData.current_password) {
        newErrors.current_password = "La contraseña actual es requerida"
      }
      if (!passwordData.new_password) {
        newErrors.new_password = "La nueva contraseña es requerida"
      } else if (passwordData.new_password.length < 8) {
        newErrors.new_password = "La nueva contraseña debe tener al menos 8 caracteres"
      }
      if (!passwordData.confirm_password) {
        newErrors.confirm_password = "Confirma tu nueva contraseña"
      } else if (passwordData.new_password !== passwordData.confirm_password) {
        newErrors.confirm_password = "Las contraseñas no coinciden"
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('access_token')

      // Update user basic info
      const userUpdateResponse = await fetch(`http://localhost:8000/api/v1/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone
        }),
      })

      if (!userUpdateResponse.ok) {
        throw new Error("Error al actualizar datos del usuario")
      }

      // Update patient specific data if available
      if (formData.document_type || formData.document_number || formData.birth_date || formData.blood_type || formData.eps) {
        const patientUpdateResponse = await fetch(`http://localhost:8000/api/v1/patients/${user.id}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document_type: formData.document_type,
            document_number: formData.document_number,
            birth_date: formData.birth_date,
            gender: formData.gender,
            blood_type: formData.blood_type,
            eps: formData.eps,
            emergency_contact_name: formData.emergency_contact_name,
            emergency_contact_phone: formData.emergency_contact_phone
          }),
        })

        if (!patientUpdateResponse.ok) {
          console.warn("Could not update patient data, but user data was updated")
        }
      }

      setSuccessMessage("Perfil actualizado exitosamente")
      
      // Update localStorage user data
      const updatedUserData = {
        ...user,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone
      }
      localStorage.setItem('user_data', JSON.stringify(updatedUserData))

    } catch (error) {
      setErrorMessage("Error al actualizar el perfil. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")

    if (!validatePasswordForm()) {
      return
    }

    // Only proceed if all password fields have values
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(`http://localhost:8000/api/v1/auth/change-password`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al cambiar contraseña")
      }

      setSuccessMessage("Contraseña cambiada exitosamente")
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      })

    } catch (error: any) {
      setErrorMessage(error.message || "Error al cambiar contraseña. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout isAuthenticated={true} user={{ name: "Usuario", role: "patient" }}>
        <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vitalgo-green mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando perfil...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout isAuthenticated={true} user={{ name: `${formData.first_name} ${formData.last_name}`, role: "patient" }}>
      <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="text-gray-600 hover:text-vitalgo-green"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-vitalgo-green/10 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-vitalgo-green" />
              </div>
              <div>
                <h1 className="text-3xl font-light text-vitalgo-dark">
                  Editar Perfil
                </h1>
                <p className="text-gray-600">
                  Actualiza tu información personal y médica
                </p>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6">
              <AlertWithIcon
                variant="default"
                icon={<CheckCircle className="h-4 w-4" />}
                description={successMessage}
                className="border-green-200 bg-green-50 text-green-800"
              />
            </div>
          )}

          {errorMessage && (
            <div className="mb-6">
              <AlertWithIcon
                variant="destructive"
                description={errorMessage}
              />
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información Personal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Nombre"
                      type="text"
                      name="first_name"
                      placeholder="Tu nombre"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      error={errors.first_name}
                      required
                    />

                    <InputField
                      label="Apellido"
                      type="text"
                      name="last_name"
                      placeholder="Tu apellido"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      error={errors.last_name}
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

                  <InputField
                    label="Teléfono"
                    type="tel"
                    name="phone"
                    placeholder="3001234567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    error={errors.phone}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <SelectField
                      label="Tipo de documento"
                      name="document_type"
                      options={tiposDocumento}
                      placeholder="Selecciona"
                      value={formData.document_type}
                      onChange={handleInputChange}
                      error={errors.document_type}
                    />

                    <InputField
                      label="Número de documento"
                      type="text"
                      name="document_number"
                      placeholder="1234567890"
                      value={formData.document_number}
                      onChange={handleInputChange}
                      error={errors.document_number}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Fecha de nacimiento"
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                      error={errors.birth_date}
                    />

                    <SelectField
                      label="Tipo de sangre"
                      name="blood_type"
                      options={tiposSangre}
                      placeholder="Selecciona"
                      value={formData.blood_type}
                      onChange={handleInputChange}
                      error={errors.blood_type}
                    />
                  </div>

                  <InputField
                    label="EPS"
                    type="text"
                    name="eps"
                    placeholder="Tu EPS"
                    value={formData.eps}
                    onChange={handleInputChange}
                    error={errors.eps}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Contacto de emergencia"
                      type="text"
                      name="emergency_contact_name"
                      placeholder="Nombre completo"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      error={errors.emergency_contact_name}
                    />

                    <InputField
                      label="Teléfono de emergencia"
                      type="tel"
                      name="emergency_contact_phone"
                      placeholder="3001234567"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      error={errors.emergency_contact_phone}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-vitalgo-green hover:bg-vitalgo-green/90 text-white"
                    disabled={saving}
                  >
                    {saving ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Cambiar Contraseña</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="relative">
                    <InputField
                      label="Contraseña actual"
                      type={showCurrentPassword ? "text" : "password"}
                      name="current_password"
                      placeholder="••••••••"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      error={errors.current_password}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <InputField
                      label="Nueva contraseña"
                      type={showNewPassword ? "text" : "password"}
                      name="new_password"
                      placeholder="••••••••"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      error={errors.new_password}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <InputField
                      label="Confirmar nueva contraseña"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      placeholder="••••••••"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      error={errors.confirm_password}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Requisitos de contraseña:</strong>
                    </p>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Al menos 8 caracteres</li>
                      <li>• Solo completa los campos si deseas cambiar tu contraseña</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving || (!passwordData.current_password && !passwordData.new_password && !passwordData.confirm_password)}
                  >
                    {saving ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {saving ? "Cambiando..." : "Cambiar Contraseña"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}