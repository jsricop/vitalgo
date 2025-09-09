"use client"

import { useState } from "react"
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

const mockCirugias = [
  { 
    id: "1", 
    nombre: "Apendicectomía", 
    fecha: "2018-05-12", 
    hospital: "Hospital San Juan",
    medico: "Dr. García Pérez",
    notas: "Sin complicaciones. Recuperación normal." 
  },
  { 
    id: "2", 
    nombre: "Extracción de vesícula", 
    fecha: "2020-11-08", 
    hospital: "Clínica Colombia",
    medico: "Dra. María López",
    notas: "Cirugía laparoscópica exitosa" 
  }
]

export default function CirugiasPage() {
  const [cirugias, setCirugias] = useState(mockCirugias)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCirugia, setEditingCirugia] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    nombre: "",
    fecha: "",
    hospital: "",
    medico: "",
    notas: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre de la cirugía es requerido"
    }

    if (!formData.fecha) {
      newErrors.fecha = "La fecha es requerida"
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
      if (editingCirugia) {
        // Actualizar cirugía existente
        setCirugias(prev => prev.map(c => 
          c.id === editingCirugia.id 
            ? { ...c, ...formData }
            : c
        ))
      } else {
        // Crear nueva cirugía
        const newCirugia = {
          id: Date.now().toString(),
          ...formData
        }
        setCirugias(prev => [...prev, newCirugia])
      }

      // Reset form
      setFormData({ 
        nombre: "", 
        fecha: "", 
        hospital: "", 
        medico: "",
        notas: "" 
      })
      setIsModalOpen(false)
      setEditingCirugia(null)
      
    } catch (error) {
      setError("Error al guardar la cirugía. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (cirugia: any) => {
    setEditingCirugia(cirugia)
    setFormData({
      nombre: cirugia.nombre,
      fecha: cirugia.fecha,
      hospital: cirugia.hospital,
      medico: cirugia.medico || "",
      notas: cirugia.notas || ""
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta cirugía?")) {
      return
    }

    try {
      setCirugias(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      setError("Error al eliminar la cirugía")
    }
  }

  const openCreateModal = () => {
    setEditingCirugia(null)
    setFormData({ 
      nombre: "", 
      fecha: "", 
      hospital: "", 
      medico: "",
      notas: "" 
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCirugia(null)
    setFormData({ 
      nombre: "", 
      fecha: "", 
      hospital: "", 
      medico: "",
      notas: "" 
    })
    setErrors({})
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
                          {cirugia.nombre}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(cirugia.fecha).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{cirugia.hospital}</span>
                          </div>
                          {cirugia.medico && (
                            <div className="flex items-center space-x-2">
                              <Scissors className="h-4 w-4" />
                              <span>Cirujano: {cirugia.medico}</span>
                            </div>
                          )}
                        </div>
                        {cirugia.notas && (
                          <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                            {cirugia.notas}
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
                  name="nombre"
                  placeholder="Ej: Apendicectomía, Cesárea, Artroscopia"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  error={errors.nombre}
                  required
                />

                <InputField
                  label="Fecha de la cirugía"
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  error={errors.fecha}
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
                  name="medico"
                  placeholder="Dr. Juan Pérez"
                  value={formData.medico}
                  onChange={handleInputChange}
                  error={errors.medico}
                />

                <TextareaField
                  label="Notas adicionales"
                  name="notas"
                  placeholder="Complicaciones, recuperación, observaciones..."
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