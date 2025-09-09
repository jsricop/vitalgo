"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { Spinner } from "@/shared/components/atoms/spinner"
import { 
  Heart, 
  AlertTriangle, 
  User, 
  Phone, 
  Calendar, 
  Droplets, 
  Building2,
  Activity,
  Shield,
  Clock,
  MapPin,
  Scissors,
  Lock,
  Unlock,
  ArrowLeft,
  Home
} from "lucide-react"

interface PatientData {
  id: string
  first_name: string
  last_name: string
  document_type: string
  document_number: string
  phone: string
  birth_date: string
  gender: string
  blood_type: string
  eps: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  allergies?: Array<{
    allergen: string
    severity: string
    symptoms: string
    treatment: string
    diagnosed_date: string
    notes: string
  }>
  illnesses?: Array<{
    illness_name: string
    cie10_code: string
    diagnosis_date: string
    status: string
    notes: string
  }>
  surgeries?: Array<{
    surgery_name: string
    surgery_date: string
    hospital: string
    surgeon: string
    notes: string
  }>
}

export default function EmergencyPage() {
  const params = useParams()
  const qrCode = params?.qrCode as string

  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")

  useEffect(() => {
    loadPatientData()
    checkAuthenticationStatus()
  }, [qrCode])

  const checkAuthenticationStatus = async () => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    
    if (!token || !userData) {
      setIsAuthenticated(false)
      return
    }

    try {
      // Verify token is still valid and get current user info
      const response = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // Token is invalid, clear localStorage
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('user_role')
        setIsAuthenticated(false)
        return
      }

      const currentUser = await response.json()
      
      // Only allow access if user is a paramedic OR the patient who owns this QR
      if (currentUser.role === 'paramedic') {
        setIsAuthenticated(true)
        return
      }

      // If it's a patient, we need to verify they own this QR code
      if (currentUser.role === 'patient') {
        // For now, we'll need to implement QR ownership verification
        // This would require checking if the current patient's QR token matches the URL
        // For security, this verification should be done on the backend
        await verifyPatientQROwnership(currentUser.id, token)
        return
      }

      // Admin users should also have access
      if (currentUser.role === 'admin') {
        setIsAuthenticated(true)
        return
      }

      // Any other role is not allowed
      setIsAuthenticated(false)
      
    } catch (error) {
      console.error('Error validating authentication:', error)
      setIsAuthenticated(false)
    }
  }

  const verifyPatientQROwnership = async (patientId: string, token: string) => {
    try {
      // This would be an endpoint to verify QR ownership
      // For now, we'll implement a basic check but this should be secured on backend
      const response = await fetch(`http://localhost:8000/api/v1/qr/verify-ownership/${qrCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(data.isOwner === true)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error verifying QR ownership:', error)
      setIsAuthenticated(false)
    }
  }

  const BackButton = () => (
    <div className="absolute top-4 left-4">
      <Link href={isAuthenticated ? "/dashboard" : "/"}>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          {isAuthenticated ? <ArrowLeft className="h-4 w-4" /> : <Home className="h-4 w-4" />}
          <span>{isAuthenticated ? "Volver al Dashboard" : "Ir a VitalGo"}</span>
        </Button>
      </Link>
    </div>
  )

  const loadPatientData = async () => {
    setIsLoading(true)
    setError("")

    try {
      if (!qrCode || qrCode === 'invalid') {
        throw new Error("Código QR inválido")
      }

      const token = localStorage.getItem('access_token')
      
      if (!token) {
        // If no token, only show basic emergency info (no sensitive data)
        setError("Se requiere autenticación para ver la información médica completa")
        return
      }

      // Get patient data from QR code with authentication
      const response = await fetch(`http://localhost:8000/api/v1/qr/emergency/${qrCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_data') 
          localStorage.removeItem('user_role')
          throw new Error("Sesión expirada. Por favor, inicie sesión nuevamente")
        }
        if (response.status === 403) {
          throw new Error("No tiene permisos para acceder a esta información médica")
        }
        if (response.status === 404) {
          throw new Error("Código QR no encontrado o inválido")
        }
        throw new Error("Error al cargar información del paciente")
      }

      const data = await response.json()
      setPatientData(data.patient)
      
    } catch (error: any) {
      console.error('Error loading patient data:', error)
      setError(error.message || "No se pudo cargar la información del paciente. Verifica que el código QR sea válido.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    try {
      if (!loginData.email || !loginData.password) {
        setLoginError("Email y contraseña son requeridos")
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        }),
      })

      if (!response.ok) {
        throw new Error("Credenciales inválidas")
      }

      const data = await response.json()
      
      // Check if user is a paramedic
      if (data.role !== 'paramedic') {
        setLoginError("Solo paramédicos pueden acceder a esta información")
        return
      }

      setIsAuthenticated(true)
      setShowLoginForm(false)
      
    } catch (error: any) {
      console.error('Login error:', error)
      setLoginError(error.message || "Error al iniciar sesión")
    }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getPatientFullName = (patient: PatientData) => {
    return `${patient.first_name} ${patient.last_name}`
  }

  const getSeverityColor = (severidad: string) => {
    switch (severidad) {
      case "ALTA": return "bg-red-100 text-red-800 border-red-200"
      case "MEDIA": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "BAJA": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "ACTIVA": return "bg-red-100 text-red-800 border-red-200"
      case "CONTROLADA": return "bg-blue-100 text-blue-800 border-blue-200"
      case "CURADA": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white flex items-center justify-center relative">
        <BackButton />
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600">Cargando información médica...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white flex items-center justify-center p-4 relative">
        <BackButton />
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Código QR Inválido</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href={isAuthenticated ? "/dashboard" : "/"}>
              <Button className="bg-vitalgo-green hover:bg-vitalgo-green/90">
                {isAuthenticated ? "Volver al Dashboard" : "Ir a VitalGo"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated && patientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white relative">
        <BackButton />
        <div className="container mx-auto px-4 py-8">
            {/* Emergency Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-red-600">EMERGENCIA MÉDICA</h1>
              </div>
              <p className="text-lg text-gray-700">
                Información médica de emergencia para <strong>{getPatientFullName(patientData)}</strong>
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Basic Emergency Info - Always Visible */}
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardHeader className="bg-red-100">
                  <CardTitle className="text-red-800 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Información Crítica de Emergencia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Datos del Paciente</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span><strong>Nombre:</strong> {getPatientFullName(patientData)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span><strong>Edad:</strong> {calculateAge(patientData.birth_date)} años</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Droplets className="h-4 w-4 text-gray-500" />
                          <span><strong>Tipo de Sangre:</strong> {patientData.blood_type}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Contacto de Emergencia</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span><strong>Contacto:</strong> {patientData.emergency_contact_name || 'No disponible'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span><strong>Teléfono:</strong> {patientData.emergency_contact_phone || 'No disponible'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span><strong>EPS:</strong> {patientData.eps}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Critical Allergies */}
                  {patientData.allergies && patientData.allergies.filter((a) => a.severity === "ALTA").length > 0 && (
                    <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                      <h3 className="font-bold text-red-800 mb-2 flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>ALERGIAS CRÍTICAS</span>
                      </h3>
                      <div className="space-y-1">
                        {patientData.allergies
                          .filter((allergy) => allergy.severity === "ALTA")
                          .map((allergy, index) => (
                            <div key={index} className="text-red-800 font-medium">
                              • {allergy.allergen} - {allergy.notes}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Authentication Required */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Lock className="h-5 w-5" />
                      <span>Información Médica Completa</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!showLoginForm ? (
                    <div className="text-center py-8">
                      <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Acceso Restringido
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Para ver el historial médico completo, debe autenticarse como paramédico certificado
                      </p>
                      <Button 
                        onClick={() => setShowLoginForm(true)}
                        className="bg-vitalgo-green hover:bg-vitalgo-green/90"
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Acceder como Paramédico
                      </Button>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto">
                      <div className="text-center mb-6">
                        <Shield className="h-12 w-12 text-vitalgo-green mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">
                          Autenticación de Paramédico
                        </h3>
                        <p className="text-gray-600">
                          Ingresa tus credenciales profesionales
                        </p>
                      </div>

                      {loginError && (
                        <AlertWithIcon
                          variant="destructive"
                          description={loginError}
                          className="mb-4"
                        />
                      )}

                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email profesional
                          </label>
                          <input
                            type="email"
                            required
                            value={loginData.email}
                            onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-vitalgo-green focus:border-vitalgo-green"
                            placeholder="paramedico@hospital.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                          </label>
                          <input
                            type="password"
                            required
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-vitalgo-green focus:border-vitalgo-green"
                            placeholder="••••••••"
                          />
                        </div>

                        <div className="flex space-x-3">
                          <Button 
                            type="submit"
                            className="flex-1 bg-vitalgo-green hover:bg-vitalgo-green/90"
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Acceder
                          </Button>
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => setShowLoginForm(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    )
  }

  // Full medical information for authenticated paramedics
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white relative">
      <BackButton />
      <div className="container mx-auto px-4 py-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <Unlock className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-green-600">ACCESO AUTORIZADO</h1>
            </div>
            <p className="text-lg text-gray-700">
              Historial médico completo de <strong>{getPatientFullName(patientData)}</strong>
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Patient Info */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información del Paciente</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre completo</p>
                  <p className="font-medium">{getPatientFullName(patientData)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium">{patientData.document_type}: {patientData.document_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Edad</p>
                  <p className="font-medium">{calculateAge(patientData.birth_date)} años</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Sangre</p>
                  <p className="font-medium text-red-600 text-lg">{patientData.blood_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">EPS</p>
                  <p className="font-medium">{patientData.eps}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">{patientData.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Alergias */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Alergias</CardTitle>
                </CardHeader>
                <CardContent>
                  {patientData.allergies && patientData.allergies.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.allergies.map((allergy, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <p className="font-medium text-red-800">{allergy.allergen}</p>
                            <p className="text-sm text-red-600">{allergy.notes}</p>
                          </div>
                          <Badge className={getSeverityColor(allergy.severity)}>
                            {allergy.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Sin alergias registradas</p>
                  )}
                </CardContent>
              </Card>

              {/* Enfermedades */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Enfermedades</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patientData.illnesses && patientData.illnesses.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.illnesses.map((illness, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{illness.illness_name}</p>
                            <p className="text-sm text-gray-600">
                              CIE-10: {illness.cie10_code} | 
                              Diagnosticada: {new Date(illness.diagnosis_date).toLocaleDateString('es-CO')}
                            </p>
                          </div>
                          <Badge className={getStatusColor(illness.status)}>
                            {illness.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Sin enfermedades registradas</p>
                  )}
                </CardContent>
              </Card>

              {/* Cirugías */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Scissors className="h-5 w-5" />
                    <span>Cirugías</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patientData.surgeries && patientData.surgeries.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.surgeries.map((surgery, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{surgery.surgery_name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(surgery.surgery_date).toLocaleDateString('es-CO')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{surgery.hospital}</span>
                          </div>
                          {surgery.notes && (
                            <p className="text-sm text-gray-500 mt-1">{surgery.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Sin cirugías registradas</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <Clock className="h-4 w-4 inline mr-1" />
              Información consultada el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO')}
            </p>
          </div>
      </div>
    </div>
  )
}