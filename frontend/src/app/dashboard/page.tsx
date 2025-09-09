"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { AllergySection } from "@/components/dashboard/AllergySection"
import { IllnessSection } from "@/components/dashboard/IllnessSection"
import { SurgerySection } from "@/components/dashboard/SurgerySection"
import { 
  Heart, 
  QrCode,
  Activity,
  Shield,
  Clock,
  User,
  Phone,
  Calendar,
  Droplets,
  Building2,
  Edit3,
  Stethoscope,
  MapPin,
  AlertTriangle,
  History,
  Eye,
  FileText,
  TrendingUp
} from "lucide-react"

// Types for real data
interface Patient {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  role: string
  is_active: boolean
  created_at: string
}

interface PatientData {
  user: Patient
}

// Fallback data while loading
const loadingPatient = {
  id: "",
  nombre: "Cargando...",
  email: "",
  tipo_documento: "",
  numero_documento: "",
  telefono: "",
  fecha_nacimiento: "",
  tipo_sangre: "",
  eps: "",
  created_at: ""
}

export default function DashboardPage() {
  const router = useRouter()
  const [patient, setPatient] = useState<any>(loadingPatient)
  const [alergias, setAlergias] = useState<any[]>([])
  const [enfermedades, setEnfermedades] = useState<any[]>([])
  const [cirugias, setCirugias] = useState<any[]>([])
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState<"patient" | "paramedic" | "admin">("patient")

  const fetchMedicalData = async (token: string) => {
    try {
      // Fetch allergies
      const allergiesResponse = await fetch('http://localhost:8000/api/v1/patients/me/allergies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Fetch illnesses
      const illnessesResponse = await fetch('http://localhost:8000/api/v1/patients/me/illnesses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Fetch surgeries
      const surgeriesResponse = await fetch('http://localhost:8000/api/v1/patients/me/surgeries', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Process responses
      if (allergiesResponse.ok) {
        const allergiesData = await allergiesResponse.json()
        setAlergias(Array.isArray(allergiesData.allergies) ? allergiesData.allergies : [])
      }

      if (illnessesResponse.ok) {
        const illnessesData = await illnessesResponse.json()
        setEnfermedades(Array.isArray(illnessesData.illnesses) ? illnessesData.illnesses : [])
      }

      if (surgeriesResponse.ok) {
        const surgeriesData = await surgeriesResponse.json()
        setCirugias(Array.isArray(surgeriesData.surgeries) ? surgeriesData.surgeries : [])
      }
    } catch (error) {
      console.error('Error fetching medical data:', error)
      // Don't fail the entire dashboard if medical data fails
      setAlergias([])
      setEnfermedades([])
      setCirugias([])
    }
  }

  const fetchParamedicScanHistory = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/qr/paramedic/scan-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setScanHistory(data.scan_history || [])
      }
    } catch (error) {
      console.error('Error fetching scan history:', error)
      setScanHistory([])
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('access_token')
        const userData = localStorage.getItem('user_data')
        
        if (!token || !userData) {
          router.push('/login')
          return
        }

        // Get user data from localStorage
        const user = JSON.parse(userData)
        
        // Fetch current user data from API to get fresh data
        const response = await fetch('http://localhost:8000/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }

        const currentUser = await response.json()
        
        // Set user role
        setUserRole(currentUser.role)
        
        // Update patient data with real information
        setPatient({
          id: currentUser.id,
          nombre: `${currentUser.first_name} ${currentUser.last_name}`,
          email: currentUser.email,
          tipo_documento: "CC", // Default for now
          numero_documento: "********", // Hidden for security
          telefono: currentUser.phone,
          fecha_nacimiento: "1990-01-01", // Default for now
          tipo_sangre: "O+", // Default for now
          eps: "N/A", // Default for now
          created_at: currentUser.created_at
        })

        // Fetch medical data only for patients
        if (currentUser.role === 'patient') {
          await fetchMedicalData(token)
        } else if (currentUser.role === 'paramedic' || currentUser.role === 'admin') {
          await fetchParamedicScanHistory(token)
        }
        
      } catch (error) {
        console.error('Error fetching user data:', error)
        setError('Error loading user data')
        // Redirect to login if token is invalid
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

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

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }
      await fetchMedicalData(token)
    } catch (error) {
      console.error('Error refreshing medical data:', error)
    }
  }

  if (loading) {
    return (
      <MainLayout isAuthenticated={true} user={{ name: "Usuario", role: userRole }}>
        <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vitalgo-green mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando tu información médica...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout isAuthenticated={true} user={{ name: "Usuario", role: userRole }}>
        <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white">Reintentar</Button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout isAuthenticated={true} user={{ name: patient.nombre, role: userRole }}>
      <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-vitalgo-dark mb-2">
                  {userRole === 'paramedic' 
                    ? `Bienvenido, ${patient.nombre.split(' ')[0]} (Paramédico)` 
                    : userRole === 'admin'
                    ? `Bienvenido, ${patient.nombre.split(' ')[0]} (Administrador)`
                    : `Bienvenido, ${patient.nombre.split(' ')[0]}`}
                </h1>
                <p className="text-gray-600">
                  {userRole === 'paramedic' 
                    ? 'Accede al historial de códigos QR escaneados'
                    : userRole === 'admin' 
                    ? 'Panel de administración del sistema'
                    : 'Gestiona tu información médica de forma segura'}
                </p>
              </div>
              {userRole === 'patient' && (
                <Link href="/qr-code">
                  <Button className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white">
                    <QrCode className="h-4 w-4 mr-2" />
                    Mi Código QR
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Stats - Different for each role */}
          {userRole === 'patient' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Alergias</p>
                      <p className="text-2xl font-bold text-gray-900">{alergias.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Enfermedades</p>
                      <p className="text-2xl font-bold text-gray-900">{enfermedades.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cirugías</p>
                      <p className="text-2xl font-bold text-gray-900">{cirugias.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-vitalgo-green/10 rounded-lg flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-vitalgo-green" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Sangre</p>
                      <p className="text-2xl font-bold text-gray-900">{patient.tipo_sangre}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">QR Escaneados</p>
                      <p className="text-2xl font-bold text-gray-900">{scanHistory.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Heart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Emergencias Atendidas</p>
                      <p className="text-2xl font-bold text-gray-900">{scanHistory.filter(s => s.status === 'completed').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Casos Críticos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {scanHistory.filter(s => s.critical_info?.critical_allergies?.length > 0 || 
                          s.emergency_type?.includes('Infarto') || s.emergency_type?.includes('alérgica')).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Esta Semana</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {scanHistory.filter(s => {
                          const scanDate = new Date(s.scanned_at);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return scanDate >= weekAgo;
                        }).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content - Different for each role */}
          {userRole === 'patient' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Personal Information */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Información Personal</span>
                    </span>
                    <Link href="/profile/edit">
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Nombre completo</p>
                      <p className="font-medium">{patient.nombre}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Edad</p>
                      <p className="font-medium">{calculateAge(patient.fecha_nacimiento)} años</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">{patient.telefono}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">EPS</p>
                      <p className="font-medium">{patient.eps}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information */}
              <div className="lg:col-span-2 space-y-8">
                {/* Alergias */}
                <AllergySection alergias={alergias} onUpdate={fetchAllData} />

                {/* Enfermedades */}
                <IllnessSection enfermedades={enfermedades} onUpdate={fetchAllData} />

                {/* Cirugías */}
                <SurgerySection cirugias={cirugias} onUpdate={fetchAllData} />
              </div>
            </div>
          ) : (
            /* Paramedic Scan History */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Historial de Códigos QR Escaneados</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scanHistory.length > 0 ? (
                    <div className="space-y-4">
                      {scanHistory.map((scan) => (
                        <Card key={scan.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-lg">{scan.patient_name}</h3>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    scan.critical_info?.critical_allergies?.length > 0 || 
                                    scan.emergency_type?.includes('Infarto') || scan.emergency_type?.includes('alérgica')
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {scan.critical_info?.critical_allergies?.length > 0 || 
                                     scan.emergency_type?.includes('Infarto') || scan.emergency_type?.includes('alérgica')
                                      ? 'CRÍTICO' : 'ESTABLE'}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <Stethoscope className="h-4 w-4 text-gray-500" />
                                      <span className="text-gray-600">Emergencia:</span>
                                      <span className="font-medium">{scan.emergency_type}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="h-4 w-4 text-gray-500" />
                                      <span className="text-gray-600">Ubicación:</span>
                                      <span className="font-medium">{scan.location}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4 text-gray-500" />
                                      <span className="text-gray-600">Fecha:</span>
                                      <span className="font-medium">
                                        {new Date(scan.scanned_at).toLocaleDateString('es-ES')} - 
                                        {new Date(scan.scanned_at).toLocaleTimeString('es-ES')}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <Droplets className="h-4 w-4 text-gray-500" />
                                      <span className="text-gray-600">Tipo de Sangre:</span>
                                      <span className="font-bold text-red-600">{scan.critical_info?.blood_type}</span>
                                    </div>
                                    {scan.critical_info?.critical_allergies?.length > 0 && (
                                      <div className="flex items-start space-x-2">
                                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                                        <div>
                                          <span className="text-gray-600">Alergias:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {scan.critical_info.critical_allergies.map((allergy, idx) => (
                                              <span key={idx} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                                {allergy}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {scan.critical_info?.chronic_conditions?.length > 0 && (
                                      <div className="flex items-start space-x-2">
                                        <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                                        <div>
                                          <span className="text-gray-600">Condiciones:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {scan.critical_info.chronic_conditions.map((condition, idx) => (
                                              <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                {condition}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="ml-4">
                                <Link href={`/emergency/${scan.qr_token}`}>
                                  <Button size="sm" variant="outline" className="flex items-center space-x-1">
                                    <Eye className="h-4 w-4" />
                                    <span>Ver Detalle</span>
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay códigos QR escaneados
                      </h3>
                      <p className="text-gray-600">
                        Los códigos QR que escanees aparecerán aquí con el historial médico de los pacientes.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}