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
  AlertTriangle
} from "lucide-react"

const severidadOptions = [
  { value: "LEVE", label: "Leve" },
  { value: "MODERADA", label: "Moderada" }, 
  { value: "SEVERA", label: "Severa" },
  { value: "CRITICA", label: "Crítica" }
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

interface AllergySectionProps {
  alergias: Allergy[]
  onUpdate: () => void
}

export function AllergySection({ alergias, onUpdate }: AllergySectionProps) {
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

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "LEVE": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "MODERADA": return "bg-orange-100 text-orange-800 border-orange-200" 
      case "SEVERA": return "bg-red-100 text-red-800 border-red-200"
      case "CRITICA": return "bg-red-200 text-red-900 border-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const resetForm = () => {
    setFormData({
      allergen: "",
      severity: "",
      symptoms: "",
      treatment: "",
      diagnosed_date: "",
      notes: ""
    })
    setErrors({})
  }

  const openCreateModal = () => {
    resetForm()
    setEditingAlergia(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingAlergia(null)
    resetForm()
    setError("")
  }

  const handleEdit = (alergia: Allergy) => {
    setEditingAlergia(alergia)
    setFormData({
      allergen: alergia.allergen,
      severity: alergia.severity,
      symptoms: alergia.symptoms,
      treatment: alergia.treatment || "",
      diagnosed_date: alergia.diagnosed_date ? alergia.diagnosed_date.split('T')[0] : "",
      notes: alergia.notes || ""
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

    if (!formData.allergen.trim()) {
      newErrors.allergen = "El alergeno es requerido"
    }

    if (!formData.severity) {
      newErrors.severity = "La severidad es requerida"
    }

    if (!formData.symptoms.trim()) {
      newErrors.symptoms = "Los síntomas son requeridos"
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

      const url = editingAlergia 
        ? `http://localhost:8000/api/v1/patients/me/allergies/${editingAlergia.id}`
        : 'http://localhost:8000/api/v1/patients/me/allergies'
      
      const method = editingAlergia ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          diagnosed_date: formData.diagnosed_date ? new Date(formData.diagnosed_date).toISOString() : null
        })
      })

      if (response.ok) {
        closeModal()
        onUpdate()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Error al guardar la alergia')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta alergia?')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/patients/me/allergies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        onUpdate()
      } else {
        setError('Error al eliminar la alergia')
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
            <span>Alergias</span>
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
          
          {alergias.length > 0 ? (
            <div className="space-y-3">
              {alergias.map((alergia) => (
                <div key={alergia.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">{alergia.allergen}</p>
                      <Badge className={getSeverityColor(alergia.severity)}>
                        {alergia.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{alergia.symptoms}</p>
                    {alergia.notes && (
                      <p className="text-sm text-gray-500 mt-1">{alergia.notes}</p>
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
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">No tienes alergias registradas</p>
              <p className="text-sm text-gray-400 mb-4">Agrega tus alergias para que los médicos tengan acceso a esta información crítica</p>
              <Button onClick={openCreateModal} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Alergia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  required
                />

                <TextareaField
                  label="Tratamiento"
                  name="treatment"
                  placeholder="Tratamiento o medicamentos utilizados..."
                  value={formData.treatment}
                  onChange={handleInputChange}
                  error={errors.treatment}
                  rows={2}
                />

                <InputField
                  label="Fecha de diagnóstico"
                  type="date"
                  name="diagnosed_date"
                  value={formData.diagnosed_date}
                  onChange={handleInputChange}
                  error={errors.diagnosed_date}
                />

                <TextareaField
                  label="Notas adicionales"
                  name="notes"
                  placeholder="Información adicional sobre la alergia..."
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
                    {editingAlergia ? "Actualizar" : "Guardar"}
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