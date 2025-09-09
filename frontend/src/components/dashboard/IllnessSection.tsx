"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField, SelectField, TextareaField } from "@/shared/components/molecules/form-field"
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  X,
  Stethoscope
} from "lucide-react"

const statusOptions = [
  { value: "ACTIVA", label: "Activa" },
  { value: "CONTROLADA", label: "Controlada" },
  { value: "CURADA", label: "Curada" },
  { value: "CRONICA", label: "Crónica" }
]

interface Illness {
  id: string
  name: string
  status: string
  diagnosed_date: string
  cie10_code?: string
  symptoms?: string
  treatment?: string
  prescribed_by?: string
  notes?: string
  is_chronic: boolean
}

interface IllnessSectionProps {
  enfermedades: Illness[]
  onUpdate: () => void
}

export function IllnessSection({ enfermedades, onUpdate }: IllnessSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIllness, setEditingIllness] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    diagnosed_date: "",
    cie10_code: "",
    symptoms: "",
    treatment: "",
    prescribed_by: "",
    notes: "",
    is_chronic: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVA": return "bg-red-100 text-red-800 border-red-200"
      case "CRONICA": return "bg-orange-100 text-orange-800 border-orange-200"
      case "CONTROLADA": return "bg-blue-100 text-blue-800 border-blue-200"
      case "CURADA": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      diagnosed_date: "",
      cie10_code: "",
      symptoms: "",
      treatment: "",
      prescribed_by: "",
      notes: "",
      is_chronic: false
    })
    setErrors({})
  }

  const openCreateModal = () => {
    resetForm()
    setEditingIllness(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingIllness(null)
    resetForm()
    setError("")
  }

  const handleEdit = (illness: Illness) => {
    setEditingIllness(illness)
    setFormData({
      name: illness.name,
      diagnosed_date: illness.diagnosed_date ? illness.diagnosed_date.split('T')[0] : "",
      cie10_code: illness.cie10_code || "",
      symptoms: illness.symptoms || "",
      treatment: illness.treatment || "",
      prescribed_by: illness.prescribed_by || "",
      notes: illness.notes || "",
      is_chronic: illness.is_chronic
    })
    setIsModalOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre de la enfermedad es requerido"
    }

    if (!formData.diagnosed_date) {
      newErrors.diagnosed_date = "La fecha de diagnóstico es requerida"
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

      const url = editingIllness 
        ? `http://localhost:8000/api/v1/patients/me/illnesses/${editingIllness.id}`
        : 'http://localhost:8000/api/v1/patients/me/illnesses'
      
      const method = editingIllness ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          diagnosed_date: new Date(formData.diagnosed_date).toISOString()
        })
      })

      if (response.ok) {
        closeModal()
        onUpdate()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Error al guardar la enfermedad')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta enfermedad?')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/patients/me/illnesses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        onUpdate()
      } else {
        setError('Error al eliminar la enfermedad')
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
            <span>Enfermedades</span>
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
          
          {enfermedades.length > 0 ? (
            <div className="space-y-3">
              {enfermedades.map((enfermedad) => (
                <div key={enfermedad.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">{enfermedad.name}</p>
                      <Badge className={getStatusColor(enfermedad.status)}>
                        {enfermedad.status}
                      </Badge>
                      {enfermedad.is_chronic && (
                        <Badge variant="outline">Crónica</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Diagnosticada: {new Date(enfermedad.diagnosed_date).toLocaleDateString('es-CO')}
                    </p>
                    {enfermedad.treatment && (
                      <p className="text-sm text-gray-500 mt-1">Tratamiento: {enfermedad.treatment}</p>
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
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Stethoscope className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">No tienes enfermedades registradas</p>
              <p className="text-sm text-gray-400 mb-4">Mantén un registro de tu historial médico</p>
              <Button onClick={openCreateModal} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Enfermedad
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
                  {editingIllness ? "Editar Enfermedad" : "Nueva Enfermedad"}
                </span>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField
                  label="Nombre de la enfermedad"
                  type="text"
                  name="name"
                  placeholder="Ej: Diabetes tipo 2, Hipertensión"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
                  required
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

                <InputField
                  label="Código CIE-10"
                  type="text"
                  name="cie10_code"
                  placeholder="Ej: E11 (opcional)"
                  value={formData.cie10_code}
                  onChange={handleInputChange}
                  error={errors.cie10_code}
                />

                <TextareaField
                  label="Síntomas"
                  name="symptoms"
                  placeholder="Describe los síntomas principales..."
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  error={errors.symptoms}
                  rows={3}
                />

                <TextareaField
                  label="Tratamiento"
                  name="treatment"
                  placeholder="Medicamentos y tratamientos actuales..."
                  value={formData.treatment}
                  onChange={handleInputChange}
                  error={errors.treatment}
                  rows={3}
                />

                <InputField
                  label="Médico que prescribe"
                  type="text"
                  name="prescribed_by"
                  placeholder="Ej: Dr. García - Endocrinólogo"
                  value={formData.prescribed_by}
                  onChange={handleInputChange}
                  error={errors.prescribed_by}
                />

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_chronic"
                    name="is_chronic"
                    checked={formData.is_chronic}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-vitalgo-green focus:ring-vitalgo-green"
                  />
                  <label htmlFor="is_chronic" className="text-sm font-medium text-gray-700">
                    Es una enfermedad crónica
                  </label>
                </div>

                <TextareaField
                  label="Notas adicionales"
                  name="notes"
                  placeholder="Información adicional relevante..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  error={errors.notes}
                  rows={2}
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
                    {editingIllness ? "Actualizar" : "Guardar"}
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