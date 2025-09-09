"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { 
  Heart, 
  QrCode, 
  Plus, 
  Edit3,
  Activity,
  Shield,
  Clock,
  User,
  Phone,
  Calendar,
  Droplets,
  Building2
} from "lucide-react"

const mockPatient = {
  id: "123",
  nombre: "Juan Carlos Pérez",
  email: "juan.perez@email.com",
  tipo_documento: "CC",
  numero_documento: "1234567890",
  telefono: "3001234567",
  fecha_nacimiento: "1985-06-15",
  tipo_sangre: "O+",
  eps: "Sura EPS",
  created_at: "2024-01-15"
}

const mockAlergias = [
  { id: "1", nombre: "Penicilina", severidad: "ALTA", notas: "Reacción cutánea severa" },
  { id: "2", nombre: "Polen", severidad: "MEDIA", notas: "Rinitis alérgica estacional" }
]

const mockEnfermedades = [
  { id: "1", nombre: "Hipertensión", cie10_code: "I10", estado: "ACTIVA", fecha_diagnostico: "2020-03-10" },
  { id: "2", nombre: "Diabetes tipo 2", cie10_code: "E11", estado: "CONTROLADA", fecha_diagnostico: "2019-08-22" }
]

const mockCirugias = [
  { id: "1", nombre: "Apendicectomía", fecha: "2018-05-12", hospital: "Hospital San Juan", notas: "Sin complicaciones" }
]

export default function DashboardPage() {
  const [patient] = useState(mockPatient)
  const [alergias] = useState(mockAlergias)
  const [enfermedades] = useState(mockEnfermedades)
  const [cirugias] = useState(mockCirugias)

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

  return (
    <MainLayout isAuthenticated={true} user={{ name: patient.nombre, role: "patient" }}>
      <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-vitalgo-dark mb-2">
                  Bienvenido, {patient.nombre.split(' ')[0]}
                </h1>
                <p className="text-gray-600">
                  Gestiona tu información médica de forma segura
                </p>
              </div>
              <Link href="/qr-code">
                <Button className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white">
                  <QrCode className="h-4 w-4 mr-2" />
                  Mi Código QR
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Alergias</span>
                    <Link href="/medical-info/alergias">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alergias.length > 0 ? (
                    <div className="space-y-3">
                      {alergias.map((alergia) => (
                        <div key={alergia.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{alergia.nombre}</p>
                            <p className="text-sm text-gray-600">{alergia.notas}</p>
                          </div>
                          <Badge className={getSeverityColor(alergia.severidad)}>
                            {alergia.severidad}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No tienes alergias registradas</p>
                  )}
                </CardContent>
              </Card>

              {/* Enfermedades */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Enfermedades</span>
                    <Link href="/medical-info/enfermedades">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {enfermedades.length > 0 ? (
                    <div className="space-y-3">
                      {enfermedades.map((enfermedad) => (
                        <div key={enfermedad.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{enfermedad.nombre}</p>
                            <p className="text-sm text-gray-600">
                              Código CIE-10: {enfermedad.cie10_code} | 
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
                    <p className="text-gray-500 text-center py-4">No tienes enfermedades registradas</p>
                  )}
                </CardContent>
              </Card>

              {/* Cirugías */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Cirugías</span>
                    <Link href="/medical-info/cirugias">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cirugias.length > 0 ? (
                    <div className="space-y-3">
                      {cirugias.map((cirugia) => (
                        <div key={cirugia.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{cirugia.nombre}</p>
                            <p className="text-sm text-gray-600">{new Date(cirugia.fecha).toLocaleDateString('es-CO')}</p>
                          </div>
                          <p className="text-sm text-gray-600">
                            Hospital: {cirugia.hospital}
                          </p>
                          {cirugia.notas && (
                            <p className="text-sm text-gray-500 mt-1">{cirugia.notas}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No tienes cirugías registradas</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}