"use client"

import { useState } from "react"
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

const mockAlergias = [
  { id: "1", nombre: "Penicilina", severidad: "ALTA", notas: "Reacción cutánea severa" },
  { id: "2", nombre: "Polen", severidad: "MEDIA", notas: "Rinitis alérgica estacional" }
]

export default function AlergiasPage() {
  const [alergias, setAlergias] = useState(mockAlergias)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAlergia, setEditingAlergia] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    nombre: "",
    severidad: "",
    notas: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre de la alergia es requerido"
    }

    if (!formData.severidad) {
      newErrors.severidad = "La severidad es requerida"
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
      if (editingAlergia) {
        // Actualizar alergia existente
        setAlergias(prev => prev.map(a => 
          a.id === editingAlergia.id 
            ? { ...a, ...formData }
            : a
        ))
      } else {
        // Crear nueva alergia
        const newAlergia = {
          id: Date.now().toString(),
          ...formData
        }
        setAlergias(prev => [...prev, newAlergia])
      }

      // Reset form
      setFormData({ nombre: "", severidad: "", notas: "" })
      setIsModalOpen(false)
      setEditingAlergia(null)
      
    } catch (error) {
      setError("Error al guardar la alergia. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (alergia: any) => {
    setEditingAlergia(alergia)
    setFormData({
      nombre: alergia.nombre,
      severidad: alergia.severidad,
      notas: alergia.notas
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta alergia?")) {
      return
    }

    try {
      setAlergias(prev => prev.filter(a => a.id !== id))
    } catch (error) {
      setError("Error al eliminar la alergia")
    }
  }

  const openCreateModal = () => {
    setEditingAlergia(null)
    setFormData({ nombre: "", severidad: "", notas: "" })
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingAlergia(null)
    setFormData({ nombre: "", severidad: "", notas: "" })
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

  return (
    <MainLayout isAuthenticated={true} user={{ name: "Juan Carlos", role: "patient" }}>
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
                            {alergia.nombre}
                          </h3>
                          <Badge className={getSeverityColor(alergia.severidad)}>
                            {alergia.severidad}
                          </Badge>
                        </div>
                        {alergia.notas && (
                          <p className="text-gray-600">{alergia.notas}</p>
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
                  label="Nombre de la alergia"
                  type="text"
                  name="nombre"
                  placeholder="Ej: Penicilina, Polen, Maní"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  error={errors.nombre}
                  required
                />

                <SelectField
                  label="Severidad"
                  name="severidad"
                  options={severidadOptions}
                  placeholder="Selecciona la severidad"
                  value={formData.severidad}
                  onChange={handleInputChange}
                  error={errors.severidad}
                  required
                />

                <TextareaField
                  label="Notas adicionales"
                  name="notas"
                  placeholder="Describe los síntomas o reacciones..."
                  value={formData.notas}
                  onChange={handleInputChange}
                  error={errors.notas}
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