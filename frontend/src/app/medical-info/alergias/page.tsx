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
  AlertTriangle
} from "lucide-react"

const severidadOptions = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" }
]

interface Allergy {
  id: string
  allergen: string
  severity: string
  symptoms: string
  treatment: string
  diagnosed_date: string
  notes: string
}

export default function AlergiasPage() {
  const router = useRouter()
  const [alergias, setAlergias] = useState<Allergy[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAlergia, setEditingAlergia] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    allergen: "",
    severity: "",
    symptoms: "",
    treatment: "",
    diagnosed_date: "",
    notes: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUserAndAllergies()
  }, [])

  const loadUserAndAllergies = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const userData = localStorage.getItem('user_data')
      
      if (!token || !userData) {
        router.push('/login')
        return
      }

      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Load allergies
      const response = await fetch(`http://localhost:8000/api/v1/patients/me/allergies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAlergias(data.allergies || [])
      } else if (response.status === 401) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Error loading allergies:', error)
      setError('Error al cargar las alergias')
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

    if (!formData.allergen.trim()) {
      newErrors.allergen = "El alergeno es requerido"
    }

    if (!formData.severity) {
      newErrors.severity = "La severidad es requerida"
    }

    if (!formData.diagnosed_date) {
      newErrors.diagnosed_date = "La fecha de diagnóstico es requerida"
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

      if (editingAlergia) {
        // Actualizar alergia existente
        const response = await fetch(`http://localhost:8000/api/v1/patients/me/allergies/${editingAlergia.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          throw new Error('Error al actualizar la alergia')
        }

        const data = await response.json()
        setAlergias(prev => prev.map(a => 
          a.id === editingAlergia.id ? data.allergy : a
        ))
      } else {
        // Crear nueva alergia
        const response = await fetch(`http://localhost:8000/api/v1/patients/me/allergies`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          throw new Error('Error al crear la alergia')
        }

        const data = await response.json()
        setAlergias(prev => [...prev, data.allergy])
      }

      // Reset form
      setFormData({ allergen: "", severity: "", symptoms: "", treatment: "", diagnosed_date: "", notes: "" })
      setIsModalOpen(false)
      setEditingAlergia(null)
      
    } catch (error: any) {
      console.error('Error saving allergy:', error)
      setError(error.message || "Error al guardar la alergia. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (alergia: Allergy) => {
    setEditingAlergia(alergia)
    setFormData({
      allergen: alergia.allergen,
      severity: alergia.severity,
      symptoms: alergia.symptoms,
      treatment: alergia.treatment,
      diagnosed_date: alergia.diagnosed_date,
      notes: alergia.notes
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta alergia?")) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/patients/me/allergies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la alergia')
      }

      setAlergias(prev => prev.filter(a => a.id !== id))
    } catch (error: any) {
      console.error('Error deleting allergy:', error)
      setError(error.message || "Error al eliminar la alergia")
    }
  }

  const openCreateModal = () => {
    setEditingAlergia(null)
    setFormData({ allergen: "", severity: "", symptoms: "", treatment: "", diagnosed_date: "", notes: "" })
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingAlergia(null)
    setFormData({ allergen: "", severity: "", symptoms: "", treatment: "", diagnosed_date: "", notes: "" })
    setErrors({})
  }

  const getSeverityColor = (severidad: string) => {
    switch (severidad) {
      case "ALTA": return "bg-red-100 text-red-800 border-red-200"
      case "MEDIA": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "BAJA": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoadingData) {
    return (
      <MainLayout isAuthenticated={true} user={{ name: "Cargando...", role: "patient" }}>
        <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-gray-600">Cargando alergias...</p>
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
                  Mis Alergias
                </h1>
                <p className="text-gray-600">
                  Gestiona tu información sobre alergias y reacciones
                </p>
              </div>
              <Button 
                onClick={openCreateModal}
                className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Alergia
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

          {/* Alergias List */}
          <div className="grid gap-4">
            {alergias.length > 0 ? (
              alergias.map((alergia) => (
                <Card key={alergia.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alergia.allergen}
                          </h3>
                          <Badge className={getSeverityColor(alergia.severity)}>
                            {alergia.severity}
                          </Badge>
                        </div>
                        {alergia.notes && (
                          <p className="text-gray-600">{alergia.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(alergia)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(alergia.id)}
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
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes alergias registradas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Agrega información sobre tus alergias para tener un historial completo
                  </p>
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primera Alergia
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
                  {editingAlergia ? "Editar Alergia" : "Nueva Alergia"}
                </span>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                  label="Alergeno"
                  type="text"
                  name="allergen"
                  placeholder="Ej: Penicilina, Polen, Maní"
                  value={formData.allergen}
                  onChange={handleInputChange}
                  error={errors.allergen}
                  required
                />

                <SelectField
                  label="Severidad"
                  name="severity"
                  options={severidadOptions}
                  placeholder="Selecciona la severidad"
                  value={formData.severity}
                  onChange={handleInputChange}
                  error={errors.severity}
                  required
                />

                <TextareaField
                  label="Síntomas"
                  name="symptoms"
                  placeholder="Describe los síntomas que experimentas..."
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  error={errors.symptoms}
                  rows={3}
                />

                <TextareaField
                  label="Tratamiento"
                  name="treatment"
                  placeholder="Tratamiento o medicamentos utilizados..."
                  value={formData.treatment}
                  onChange={handleInputChange}
                  error={errors.treatment}
                  rows={3}
                />

                <InputField
                  label="Fecha de diagnóstico"
                  type="date"
                  name="diagnosed_date"
                  value={formData.diagnosed_date}
                  onChange={handleInputChange}
                  error={errors.diagnosed_date}
                  required
                />

                <TextareaField
                  label="Notas adicionales"
                  name="notes"
                  placeholder="Información adicional relevante..."
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