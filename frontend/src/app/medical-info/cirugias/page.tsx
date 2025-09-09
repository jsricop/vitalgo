"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField, TextareaField } from "@/shared/components/molecules/form-field"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  X,
  Scissors,
  Calendar,
  MapPin
} from "lucide-react"

interface Surgery {
  id: string
  surgery_name: string
  surgery_date: string
  hospital: string
  surgeon: string
  notes: string
}

export default function CirugiasPage() {
  const router = useRouter()
  const [cirugias, setCirugias] = useState<Surgery[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCirugia, setEditingCirugia] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    surgery_name: "",
    surgery_date: "",
    hospital: "",
    surgeon: "",
    notes: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadUserAndSurgeries()
  }, [])

  const loadUserAndSurgeries = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const userData = localStorage.getItem('user_data')
      
      if (!token || !userData) {
        router.push('/login')
        return
      }

      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Load surgeries
      const response = await fetch(`http://localhost:8000/api/v1/patients/me/surgeries`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCirugias(data.surgeries || [])
      } else if (response.status === 401) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Error loading surgeries:', error)
      setError('Error al cargar las cirugías')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.surgery_name.trim()) {
      newErrors.surgery_name = "El nombre de la cirugía es requerido"
    }

    if (!formData.surgery_date) {
      newErrors.surgery_date = "La fecha es requerida"
    }

    if (!formData.hospital.trim()) {
      newErrors.hospital = "El hospital es requerido"
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

      if (editingCirugia) {
        // Actualizar cirugía existente
        const response = await fetch(`http://localhost:8000/api/v1/patients/me/surgeries/${editingCirugia.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          throw new Error('Error al actualizar la cirugía')
        }

        const data = await response.json()
        setCirugias(prev => prev.map(c => 
          c.id === editingCirugia.id ? data.surgery : c
        ))
      } else {
        // Crear nueva cirugía
        const response = await fetch(`http://localhost:8000/api/v1/patients/me/surgeries`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          throw new Error('Error al crear la cirugía')
        }

        const data = await response.json()
        setCirugias(prev => [...prev, data.surgery])
      }

      // Reset form
      setFormData({ 
        surgery_name: "", 
        surgery_date: "", 
        hospital: "", 
        surgeon: "",
        notes: "" 
      })
      setIsModalOpen(false)
      setEditingCirugia(null)
      
    } catch (error: any) {
      console.error('Error saving surgery:', error)
      setError(error.message || "Error al guardar la cirugía. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (cirugia: Surgery) => {
    setEditingCirugia(cirugia)
    setFormData({
      surgery_name: cirugia.surgery_name,
      surgery_date: cirugia.surgery_date,
      hospital: cirugia.hospital,
      surgeon: cirugia.surgeon || "",
      notes: cirugia.notes || ""
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta cirugía?")) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/patients/me/surgeries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la cirugía')
      }

      setCirugias(prev => prev.filter(c => c.id !== id))
    } catch (error: any) {
      console.error('Error deleting surgery:', error)
      setError(error.message || "Error al eliminar la cirugía")
    }
  }

  const openCreateModal = () => {
    setEditingCirugia(null)
    setFormData({ 
      surgery_name: "", 
      surgery_date: "", 
      hospital: "", 
      surgeon: "",
      notes: "" 
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCirugia(null)
    setFormData({ 
      surgery_name: "", 
      surgery_date: "", 
      hospital: "", 
      surgeon: "",
      notes: "" 
    })
    setErrors({})
  }

  if (isLoadingData) {
    return (
      <MainLayout isAuthenticated={true} user={{ name: "Cargando...", role: "patient" }}>
        <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-gray-600">Cargando cirugías...</p>
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
                  Mis Cirugías
                </h1>
                <p className="text-gray-600">
                  Historial completo de intervenciones quirúrgicas
                </p>
              </div>
              <Button 
                onClick={openCreateModal}
                className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cirugía
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

          {/* Cirugías List */}
          <div className="grid gap-4">
            {cirugias.length > 0 ? (
              cirugias.map((cirugia) => (
                <Card key={cirugia.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {cirugia.surgery_name}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(cirugia.surgery_date).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{cirugia.hospital}</span>
                          </div>
                          {cirugia.surgeon && (
                            <div className="flex items-center space-x-2">
                              <Scissors className="h-4 w-4" />
                              <span>Cirujano: {cirugia.surgeon}</span>
                            </div>
                          )}
                        </div>
                        {cirugia.notes && (
                          <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                            {cirugia.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cirugia)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cirugia.id)}
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
                  <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes cirugías registradas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Mantén un registro de tus intervenciones quirúrgicas para referencia médica
                  </p>
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primera Cirugía
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
                  {editingCirugia ? "Editar Cirugía" : "Nueva Cirugía"}
                </span>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                  label="Nombre de la cirugía"
                  type="text"
                  name="surgery_name"
                  placeholder="Ej: Apendicectomía, Cesárea, Artroscopia"
                  value={formData.surgery_name}
                  onChange={handleInputChange}
                  error={errors.surgery_name}
                  required
                />

                <InputField
                  label="Fecha de la cirugía"
                  type="date"
                  name="surgery_date"
                  value={formData.surgery_date}
                  onChange={handleInputChange}
                  error={errors.surgery_date}
                  required
                />

                <InputField
                  label="Hospital o clínica"
                  type="text"
                  name="hospital"
                  placeholder="Hospital San Juan de Dios"
                  value={formData.hospital}
                  onChange={handleInputChange}
                  error={errors.hospital}
                  required
                />

                <InputField
                  label="Cirujano (opcional)"
                  type="text"
                  name="surgeon"
                  placeholder="Dr. Juan Pérez"
                  value={formData.surgeon}
                  onChange={handleInputChange}
                  error={errors.surgeon}
                />

                <TextareaField
                  label="Notas adicionales"
                  name="notes"
                  placeholder="Complicaciones, recuperación, observaciones..."
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