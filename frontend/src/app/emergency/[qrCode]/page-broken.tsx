"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
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
  Unlock
} from "lucide-react"

const mockPatientData = {
  id: "123",
  nombre: "Juan Carlos Pérez",
  tipo_documento: "CC",
  numero_documento: "1234567890",
  telefono: "3001234567",
  fecha_nacimiento: "1985-06-15",
  tipo_sangre: "O+",
  eps: "Sura EPS",
  contacto_emergencia: {
    nombre: "María Pérez",
    relacion: "Esposa",
    telefono: "3009876543"
  },
  alergias: [
    { nombre: "Penicilina", severidad: "ALTA", notas: "Reacción cutánea severa" },
    { nombre: "Polen", severidad: "MEDIA", notas: "Rinitis alérgica estacional" }
  ],
  enfermedades: [
    { nombre: "Hipertensión", cie10_code: "I10", estado: "ACTIVA", fecha_diagnostico: "2020-03-10" },
    { nombre: "Diabetes tipo 2", cie10_code: "E11", estado: "CONTROLADA", fecha_diagnostico: "2019-08-22" }
  ],
  cirugias: [
    { nombre: "Apendicectomía", fecha: "2018-05-12", hospital: "Hospital San Juan", notas: "Sin complicaciones" }
  ]
}

export default function EmergencyPage() {
  const params = useParams()
  const qrCode = params?.qrCode as string

  const [patientData, setPatientData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")

  useEffect(() => {
    loadPatientData()
  }, [qrCode])

  const loadPatientData = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Simular carga de datos del paciente
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (!qrCode || qrCode === 'invalid') {
        throw new Error("Código QR inválido")
      }

      setPatientData(mockPatientData)
      
    } catch (error) {
      setError("No se pudo cargar la información del paciente. Verifica que el código QR sea válido.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    try {
      // Simular login de paramédico
      if (loginData.email && loginData.password) {
        setIsAuthenticated(true)
        setShowLoginForm(false)
      } else {
        setLoginError("Email y contraseña son requeridos")
      }
    } catch (error) {
      setLoginError("Credenciales inválidas")
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
      <MainLayout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-gray-600">Cargando información médica...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Código QR Inválido</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/">
                <Button className="bg-vitalgo-green hover:bg-vitalgo-green/90">
                  Ir a VitalGo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated && patientData) {
    return (
      <MainLayout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white">
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
                Información médica de emergencia para <strong>{patientData.nombre}</strong>
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
                          <span><strong>Nombre:</strong> {patientData.nombre}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span><strong>Edad:</strong> {calculateAge(patientData.fecha_nacimiento)} años</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Droplets className="h-4 w-4 text-gray-500" />
                          <span><strong>Tipo de Sangre:</strong> {patientData.tipo_sangre}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Contacto de Emergencia</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span><strong>{patientData.contacto_emergencia.relacion}:</strong> {patientData.contacto_emergencia.nombre}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span><strong>Teléfono:</strong> {patientData.contacto_emergencia.telefono}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span><strong>EPS:</strong> {patientData.eps}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Critical Allergies */}
                  {patientData.alergias.filter((a: any) => a.severidad === "ALTA").length > 0 && (
                    <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                      <h3 className="font-bold text-red-800 mb-2 flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>ALERGIAS CRÍTICAS</span>
                      </h3>
                      <div className="space-y-1">
                        {patientData.alergias
                          .filter((alergia: any) => alergia.severidad === "ALTA")
                          .map((alergia: any, index: number) => (
                            <div key={index} className="text-red-800 font-medium">
                              • {alergia.nombre} - {alergia.notas}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
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
      </MainLayout>
    )
  }

  // Full medical information for authenticated paramedics
  return (
    <MainLayout 
      isAuthenticated={true} 
      user={{ name: "Paramédico Autorizado", role: "paramedic" }}
      showFooter={false}
    >
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white">
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
              Historial médico completo de <strong>{patientData.nombre}</strong>
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
                  <p className="font-medium">{patientData.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium">{patientData.tipo_documento}: {patientData.numero_documento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Edad</p>
                  <p className="font-medium">{calculateAge(patientData.fecha_nacimiento)} años</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Sangre</p>
                  <p className="font-medium text-red-600 text-lg">{patientData.tipo_sangre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">EPS</p>
                  <p className="font-medium">{patientData.eps}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">{patientData.telefono}</p>
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
                  {patientData.alergias.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.alergias.map((alergia: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <p className="font-medium text-red-800">{alergia.nombre}</p>
                            <p className="text-sm text-red-600">{alergia.notas}</p>
                          </div>
                          <Badge className={getSeverityColor(alergia.severidad)}>
                            {alergia.severidad}
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
                  {patientData.enfermedades.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.enfermedades.map((enfermedad: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{enfermedad.nombre}</p>
                            <p className="text-sm text-gray-600">
                              CIE-10: {enfermedad.cie10_code} | 
                              Diagnosticada: {new Date(enfermedad.fecha_diagnostico).toLocaleDateString('es-CO')}
                            </p>
                          </div>
                          <Badge className={getStatusColor(enfermedad.estado)}>
                            {enfermedad.estado}
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
                  {patientData.cirugias.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.cirugias.map((cirugia: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{cirugia.nombre}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(cirugia.fecha).toLocaleDateString('es-CO')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{cirugia.hospital}</span>
                          </div>
                          {cirugia.notas && (
                            <p className="text-sm text-gray-500 mt-1">{cirugia.notas}</p>
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
    </MainLayout>
  )
}