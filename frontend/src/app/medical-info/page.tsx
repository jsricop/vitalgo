"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { FileText, Stethoscope, Scissors, AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface MedicalData {
  allergies: Array<{
    id: string
    allergen: string
    severity: string
    reaction: string
    created_at: string
  }>
  illnesses: Array<{
    id: string
    name: string
    diagnosed_date: string
    status: string
    treatment: string
    created_at: string
  }>
  surgeries: Array<{
    id: string
    name: string
    date: string
    hospital: string
    doctor: string
    notes: string
    created_at: string
  }>
}

export default function MedicalInfoPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [medicalData, setMedicalData] = useState<MedicalData>({
    allergies: [],
    illnesses: [],
    surgeries: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'patient') {
      router.push('/dashboard')
      return
    }

    setUser(parsedUser)
    fetchMedicalData(token)
  }, [router])

  const fetchMedicalData = async (token: string) => {
    try {
      // Fetch allergies
      const allergiesResponse = await fetch('http://localhost:8000/api/v1/patients/me/allergies', {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      // Fetch illnesses  
      const illnessesResponse = await fetch('http://localhost:8000/api/v1/patients/me/illnesses', {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      // Fetch surgeries
      const surgeriesResponse = await fetch('http://localhost:8000/api/v1/patients/me/surgeries', {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      // Process responses like in dashboard
      const allergies = allergiesResponse.ok ? await allergiesResponse.json() : []
      const illnesses = illnessesResponse.ok ? await illnessesResponse.json() : []
      const surgeries = surgeriesResponse.ok ? await surgeriesResponse.json() : []

      setMedicalData({
        allergies: Array.isArray(allergies) ? allergies : (allergies.allergies || []),
        illnesses: Array.isArray(illnesses) ? illnesses : (illnesses.illnesses || []),
        surgeries: Array.isArray(surgeries) ? surgeries : (surgeries.surgeries || [])
      })
    } catch (error) {
      console.error("Error fetching medical data:", error)
      setError("Error al cargar información médica")
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    if (!severity) return 'bg-gray-100 text-gray-800 border-gray-300'
    
    switch (severity.toUpperCase()) {
      case 'CRITICA': return 'bg-red-100 text-red-800 border-red-300'
      case 'SEVERA': return 'bg-red-100 text-red-800 border-red-300'
      case 'ALTA': return 'bg-red-100 text-red-800 border-red-300'
      case 'MODERADA': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'MEDIA': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'LEVE': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'BAJA': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-300'
    
    switch (status.toUpperCase()) {
      case 'ACTIVA': return 'bg-red-100 text-red-800 border-red-300'
      case 'CRONICA': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'CONTROLADA': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'CURADA': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (isLoading) {
    return (
      <MainLayout isAuthenticated={true} user={{ name: "Cargando...", role: "patient" }}>
        <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-gray-600">Cargando información médica...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout isAuthenticated={true} user={{ name: user ? `${user.first_name} ${user.last_name}` : "Usuario", role: "patient" }}>
      <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-vitalgo-dark mb-2">
                  Mi Información Médica
                </h1>
                <p className="text-gray-600">
                  Gestiona tu información médica para emergencias
                </p>
              </div>
            </div>
          </div>

          {error && (
            <AlertWithIcon
              variant="destructive"
              description={error}
              className="mb-6"
            />
          )}

          <div className="grid gap-6">
            {/* Alergias */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                    Alergias ({medicalData.allergies.length})
                  </CardTitle>
                  <Link href="/medical-info/alergias">
                    <Button size="sm" className="bg-vitalgo-green hover:bg-vitalgo-green/90">
                      Editar la información
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {medicalData.allergies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No hay alergias registradas</p>
                    <Link href="/medical-info/alergias">
                      <Button className="mt-4 bg-vitalgo-green hover:bg-vitalgo-green/90">
                        Editar la información
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalData.allergies.map((allergy) => (
                      <div key={allergy.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{allergy.allergen}</h3>
                            <p className="text-sm text-gray-600 mt-1">{allergy.reaction}</p>
                          </div>
                          <Badge className={getSeverityColor(allergy.severity)}>
                            {allergy.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enfermedades */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Stethoscope className="mr-2 h-5 w-5 text-blue-500" />
                    Enfermedades ({medicalData.illnesses.length})
                  </CardTitle>
                  <Link href="/medical-info/enfermedades">
                    <Button size="sm" className="bg-vitalgo-green hover:bg-vitalgo-green/90">
                      Editar la información
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {medicalData.illnesses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Stethoscope className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No hay enfermedades registradas</p>
                    <Link href="/medical-info/enfermedades">
                      <Button className="mt-4 bg-vitalgo-green hover:bg-vitalgo-green/90">
                        Editar la información
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalData.illnesses.map((illness) => (
                      <div key={illness.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{illness.name}</h3>
                            {illness.diagnosed_date && (
                              <p className="text-sm text-gray-600 mt-1">
                                Diagnosticada: {new Date(illness.diagnosed_date).toLocaleDateString('es-ES')}
                              </p>
                            )}
                            {illness.treatment && (
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Tratamiento:</strong> {illness.treatment}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusColor(illness.status)}>
                            {illness.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cirugías */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Scissors className="mr-2 h-5 w-5 text-purple-500" />
                    Cirugías ({medicalData.surgeries.length})
                  </CardTitle>
                  <Link href="/medical-info/cirugias">
                    <Button size="sm" className="bg-vitalgo-green hover:bg-vitalgo-green/90">
                      Editar la información
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {medicalData.surgeries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Scissors className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No hay cirugías registradas</p>
                    <Link href="/medical-info/cirugias">
                      <Button className="mt-4 bg-vitalgo-green hover:bg-vitalgo-green/90">
                        Editar la información
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalData.surgeries.map((surgery) => (
                      <div key={surgery.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{surgery.name}</h3>
                            {surgery.date && (
                              <p className="text-sm text-gray-600 mt-1">
                                Fecha: {new Date(surgery.date).toLocaleDateString('es-ES')}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              Hospital: {surgery.hospital}
                            </p>
                            {surgery.doctor && (
                              <p className="text-sm text-gray-600">
                                Doctor: {surgery.doctor}
                              </p>
                            )}
                            {surgery.notes && (
                              <p className="text-sm text-gray-600 mt-2">
                                <strong>Notas:</strong> {surgery.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <FileText className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Información para Emergencias
              </h3>
              <p className="text-blue-700 mb-4">
                Esta información estará disponible a través de tu código QR para personal médico en casos de emergencia.
              </p>
              <Link href="/qr-code">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Ver mi Código QR
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}