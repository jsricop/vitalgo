"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField, TextareaField } from "@/shared/components/molecules/form-field"
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  X,
  Scissors
} from "lucide-react"

interface Surgery {
  id: string
  name: string
  surgery_date: string
  surgeon: string
  hospital: string
  description?: string
  diagnosis?: string
  anesthesia_type?: string
  surgery_duration_minutes?: number
  notes?: string
}

interface SurgerySectionProps {
  cirugias: Surgery[]
  onUpdate: () => void
}

export function SurgerySection({ cirugias, onUpdate }: SurgerySectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSurgery, setEditingSurgery] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    surgery_date: "",
    surgeon: "",
    hospital: "",
    description: "",
    diagnosis: "",
    anesthesia_type: "",
    surgery_duration_minutes: "",
    notes: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = () => {
    setFormData({
      name: "",
      surgery_date: "",
      surgeon: "",
      hospital: "",
      description: "",
      diagnosis: "",
      anesthesia_type: "",
      surgery_duration_minutes: "",
      notes: ""
    })
    setErrors({})
  }

  const openCreateModal = () => {
    resetForm()
    setEditingSurgery(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSurgery(null)
    resetForm()
    setError("")
  }

  const handleEdit = (surgery: Surgery) => {
    setEditingSurgery(surgery)
    setFormData({
      name: surgery.name,
      surgery_date: surgery.surgery_date ? surgery.surgery_date.split('T')[0] : "",
      surgeon: surgery.surgeon,
      hospital: surgery.hospital,
      description: surgery.description || "",
      diagnosis: surgery.diagnosis || "",
      anesthesia_type: surgery.anesthesia_type || "",
      surgery_duration_minutes: surgery.surgery_duration_minutes?.toString() || "",
      notes: surgery.notes || ""
    })
    setIsModalOpen(true)
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

    if (!formData.name.trim()) {
      newErrors.name = "El nombre de la cirugía es requerido"
    }

    if (!formData.surgery_date) {
      newErrors.surgery_date = "La fecha de la cirugía es requerida"
    }

    if (!formData.surgeon.trim()) {
      newErrors.surgeon = "El nombre del cirujano es requerido"
    }

    if (!formData.hospital.trim()) {
      newErrors.hospital = "El hospital es requerido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const url = editingSurgery 
        ? `http://localhost:8000/api/v1/patients/me/surgeries/${editingSurgery.id}`
        : 'http://localhost:8000/api/v1/patients/me/surgeries'
      
      const method = editingSurgery ? 'PUT' : 'POST'

      const requestData = {
        ...formData,
        surgery_date: new Date(formData.surgery_date).toISOString(),
        surgery_duration_minutes: formData.surgery_duration_minutes ? parseInt(formData.surgery_duration_minutes) : null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        closeModal()
        onUpdate()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Error al guardar la cirugía')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cirugía?')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/patients/me/surgeries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        onUpdate()
      } else {
        setError('Error al eliminar la cirugía')
      }
    } catch (error) {
      setError('Error de conexión')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Cirugías</span>
            <Button variant="outline" size="sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <AlertWithIcon
              variant="destructive"
              description={error}
              className="mb-4"
            />
          )}
          
          {cirugias.length > 0 ? (
            <div className="space-y-3">
              {cirugias.map((cirugia) => (
                <div key={cirugia.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{cirugia.name}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {new Date(cirugia.surgery_date).toLocaleDateString('es-CO')}
                      </Badge>
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
                  <p className="text-sm text-gray-600">
                    <strong>Cirujano:</strong> {cirugia.surgeon}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Hospital:</strong> {cirugia.hospital}
                  </p>
                  {cirugia.description && (
                    <p className="text-sm text-gray-500 mt-1">{cirugia.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Scissors className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">No tienes cirugías registradas</p>
              <p className="text-sm text-gray-400 mb-4">Mantén un registro de tu historial quirúrgico</p>
              <Button onClick={openCreateModal} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Cirugía
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {editingSurgery ? "Editar Cirugía" : "Nueva Cirugía"}
                </span>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField
                  label="Nombre de la cirugía"
                  type="text"
                  name="name"
                  placeholder="Ej: Apendicectomía, Cesárea"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
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
                  label="Cirujano"
                  type="text"
                  name="surgeon"
                  placeholder="Ej: Dr. García - Cirugía General"
                  value={formData.surgeon}
                  onChange={handleInputChange}
                  error={errors.surgeon}
                  required
                />

                <InputField
                  label="Hospital"
                  type="text"
                  name="hospital"
                  placeholder="Ej: Hospital San José"
                  value={formData.hospital}
                  onChange={handleInputChange}
                  error={errors.hospital}
                  required
                />

                <TextareaField
                  label="Descripción"
                  name="description"
                  placeholder="Descripción del procedimiento realizado..."
                  value={formData.description}
                  onChange={handleInputChange}
                  error={errors.description}
                  rows={3}
                />

                <InputField
                  label="Diagnóstico"
                  type="text"
                  name="diagnosis"
                  placeholder="Ej: Apendicitis aguda"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  error={errors.diagnosis}
                />

                <InputField
                  label="Tipo de anestesia"
                  type="text"
                  name="anesthesia_type"
                  placeholder="Ej: General, Local, Raquídea"
                  value={formData.anesthesia_type}
                  onChange={handleInputChange}
                  error={errors.anesthesia_type}
                />

                <InputField
                  label="Duración (minutos)"
                  type="number"
                  name="surgery_duration_minutes"
                  placeholder="Ej: 60"
                  value={formData.surgery_duration_minutes}
                  onChange={handleInputChange}
                  error={errors.surgery_duration_minutes}
                />

                <TextareaField
                  label="Notas adicionales"
                  name="notes"
                  placeholder="Complicaciones, resultados, observaciones..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  error={errors.notes}
                  rows={3}
                />

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-vitalgo-green hover:bg-vitalgo-green/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {editingSurgery ? "Actualizar" : "Guardar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}