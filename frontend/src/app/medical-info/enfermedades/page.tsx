"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField, SelectField, TextareaField } from "@/shared/components/molecules/form-field"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  X,
  Activity,
  Calendar
} from "lucide-react"

const estadoOptions = [
  { value: "ACTIVA", label: "Activa" },
  { value: "CONTROLADA", label: "Controlada" },
  { value: "CURADA", label: "Curada" }
]

interface Illness {
  id: string
  illness_name: string
  cie10_code: string
  diagnosis_date: string
  status: string
  notes: string
}

export default function EnfermedadesPage() {
  const router = useRouter()
  const [enfermedades, setEnfermedades] = useState<Illness[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEnfermedad, setEditingEnfermedad] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    illness_name: "",
    cie10_code: "",
    status: "",
    diagnosis_date: "",
    notes: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadUserAndIllnesses()
  }, [])

  const loadUserAndIllnesses = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const userData = localStorage.getItem('user_data')
      
      if (!token || !userData) {
        router.push('/login')
        return
      }

      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Load illnesses
      const response = await fetch(`http://localhost:8000/api/v1/patients/me/illnesses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEnfermedades(data.illnesses || [])
      } else if (response.status === 401) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Error loading illnesses:', error)
      setError('Error al cargar las enfermedades')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.illness_name.trim()) {
      newErrors.illness_name = "El nombre de la enfermedad es requerido"
    }

    if (!formData.status) {
      newErrors.status = "El estado es requerido"
    }

    if (!formData.diagnosis_date) {
      newErrors.diagnosis_date = "La fecha de diagnóstico es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      if (editingEnfermedad) {
        // Actualizar enfermedad existente
        const response = await fetch(`http://localhost:8000/api/v1/patients/me/illnesses/${editingEnfermedad.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          throw new Error('Error al actualizar la enfermedad')
        }

        const data = await response.json()
        setEnfermedades(prev => prev.map(e => 
          e.id === editingEnfermedad.id ? data.illness : e
        ))
      } else {
        // Crear nueva enfermedad
        const response = await fetch(`http://localhost:8000/api/v1/patients/me/illnesses`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          throw new Error('Error al crear la enfermedad')
        }

        const data = await response.json()
        setEnfermedades(prev => [...prev, data.illness])
      }

      // Reset form
      setFormData({ 
        illness_name: "", 
        cie10_code: "", 
        status: "", 
        diagnosis_date: "", 
        notes: "" 
      })
      setIsModalOpen(false)
      setEditingEnfermedad(null)
      
    } catch (error: any) {
      console.error('Error saving illness:', error)
      setError(error.message || "Error al guardar la enfermedad. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (enfermedad: Illness) => {
    setEditingEnfermedad(enfermedad)
    setFormData({
      illness_name: enfermedad.illness_name,
      cie10_code: enfermedad.cie10_code || "",
      status: enfermedad.status,
      diagnosis_date: enfermedad.diagnosis_date,
      notes: enfermedad.notes || ""
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta enfermedad?")) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/patients/me/illnesses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la enfermedad')
      }

      setEnfermedades(prev => prev.filter(e => e.id !== id))
    } catch (error: any) {
      console.error('Error deleting illness:', error)
      setError(error.message || "Error al eliminar la enfermedad")
    }
  }

  const openCreateModal = () => {
    setEditingEnfermedad(null)
    setFormData({ 
      illness_name: "", 
      cie10_code: "", 
      status: "", 
      diagnosis_date: "", 
      notes: "" 
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEnfermedad(null)
    setFormData({ 
      illness_name: "", 
      cie10_code: "", 
      status: "", 
      diagnosis_date: "", 
      notes: "" 
    })
    setErrors({})
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "ACTIVA": return "bg-red-100 text-red-800 border-red-200"
      case "CONTROLADA": return "bg-blue-100 text-blue-800 border-blue-200"
      case "CURADA": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoadingData) {
    return (
      <MainLayout isAuthenticated={true} user={{ name: "Cargando...", role: "patient" }}>
        <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-gray-600">Cargando enfermedades...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout 
      isAuthenticated={true} 
      user={{ 
        name: user ? `${user.first_name} ${user.last_name}` : "Usuario", 
        role: "patient" 
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-vitalgo-dark mb-2">
                  Mis Enfermedades
                </h1>
                <p className="text-gray-600">
                  Gestiona tu historial médico de enfermedades y condiciones
                </p>
              </div>
              <Button 
                onClick={openCreateModal}
                className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Enfermedad
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <AlertWithIcon
              variant="destructive"
              description={error}
              className="mb-6"
            />
          )}

          {/* Enfermedades List */}
          <div className="grid gap-4">
            {enfermedades.length > 0 ? (
              enfermedades.map((enfermedad) => (
                <Card key={enfermedad.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {enfermedad.illness_name}
                          </h3>
                          <Badge className={getStatusColor(enfermedad.status)}>
                            {enfermedad.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          {enfermedad.cie10_code && (
                            <p>Código CIE-10: {enfermedad.cie10_code}</p>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Diagnosticada: {new Date(enfermedad.diagnosis_date).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                        </div>
                        {enfermedad.notes && (
                          <p className="text-gray-600">{enfermedad.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(enfermedad)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(enfermedad.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes enfermedades registradas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Mantén un registro de tus condiciones médicas para un mejor seguimiento
                  </p>
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primera Enfermedad
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {editingEnfermedad ? "Editar Enfermedad" : "Nueva Enfermedad"}
                </span>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                  label="Nombre de la enfermedad"
                  type="text"
                  name="illness_name"
                  placeholder="Ej: Hipertensión, Diabetes, Asma"
                  value={formData.illness_name}
                  onChange={handleInputChange}
                  error={errors.illness_name}
                  required
                />

                <InputField
                  label="Código CIE-10 (opcional)"
                  type="text"
                  name="cie10_code"
                  placeholder="Ej: I10, E11"
                  value={formData.cie10_code}
                  onChange={handleInputChange}
                  error={errors.cie10_code}
                />

                <SelectField
                  label="Estado actual"
                  name="status"
                  options={estadoOptions}
                  placeholder="Selecciona el estado"
                  value={formData.status}
                  onChange={handleInputChange}
                  error={errors.status}
                  required
                />

                <InputField
                  label="Fecha de diagnóstico"
                  type="date"
                  name="diagnosis_date"
                  value={formData.diagnosis_date}
                  onChange={handleInputChange}
                  error={errors.diagnosis_date}
                  required
                />

                <TextareaField
                  label="Notas adicionales"
                  name="notes"
                  placeholder="Tratamiento, medicamentos, observaciones..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  error={errors.notes}
                  rows={3}
                />

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-vitalgo-green hover:bg-vitalgo-green/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  )
}