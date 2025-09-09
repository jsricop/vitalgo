"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField, SelectField, TextareaField } from "@/shared/components/molecules/form-field"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { 
  Heart, 
  ArrowRight, 
  Plus, 
  X, 
  Activity, 
  Shield, 
  Calendar,
  Save,
  SkipForward
} from "lucide-react"

// Opciones para formularios
const severidades = [
  { value: "LEVE", label: "Leve" },
  { value: "MODERADA", label: "Moderada" },
  { value: "SEVERA", label: "Severa" },
  { value: "CRÍTICA", label: "Crítica" }
]

const tiposAnestesia = [
  { value: "GENERAL", label: "General" },
  { value: "LOCAL", label: "Local" },
  { value: "REGIONAL", label: "Regional" },
  { value: "SEDACION", label: "Sedación" }
]

interface AllergyForm {
  allergen: string
  severity: string
  symptoms: string
  treatment: string
  diagnosed_date: string
  notes: string
}

interface IllnessForm {
  name: string
  diagnosed_date: string
  cie10_code: string
  symptoms: string
  treatment: string
  prescribed_by: string
  notes: string
  is_chronic: boolean
}

interface SurgeryForm {
  name: string
  surgery_date: string
  surgeon: string
  hospital: string
  description: string
  diagnosis: string
  anesthesia_type: string
  surgery_duration_minutes: string
  notes: string
}

export default function CompleteMedicalProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Estados para formularios
  const [allergies, setAllergies] = useState<AllergyForm[]>([])
  const [illnesses, setIllnesses] = useState<IllnessForm[]>([])
  const [surgeries, setSurgeries] = useState<SurgeryForm[]>([])

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }
  }, [router])

  // Funciones para manejar alergias
  const addAllergy = () => {
    setAllergies([...allergies, {
      allergen: "",
      severity: "",
      symptoms: "",
      treatment: "",
      diagnosed_date: "",
      notes: ""
    }])
  }

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index))
  }

  const updateAllergy = (index: number, field: string, value: string) => {
    const updated = [...allergies]
    updated[index] = { ...updated[index], [field]: value }
    setAllergies(updated)
  }

  // Funciones para manejar enfermedades
  const addIllness = () => {
    setIllnesses([...illnesses, {
      name: "",
      diagnosed_date: "",
      cie10_code: "",
      symptoms: "",
      treatment: "",
      prescribed_by: "",
      notes: "",
      is_chronic: false
    }])
  }

  const removeIllness = (index: number) => {
    setIllnesses(illnesses.filter((_, i) => i !== index))
  }

  const updateIllness = (index: number, field: string, value: string | boolean) => {
    const updated = [...illnesses]
    updated[index] = { ...updated[index], [field]: value }
    setIllnesses(updated)
  }

  // Funciones para manejar cirugías
  const addSurgery = () => {
    setSurgeries([...surgeries, {
      name: "",
      surgery_date: "",
      surgeon: "",
      hospital: "",
      description: "",
      diagnosis: "",
      anesthesia_type: "",
      surgery_duration_minutes: "",
      notes: ""
    }])
  }

  const removeSurgery = (index: number) => {
    setSurgeries(surgeries.filter((_, i) => i !== index))
  }

  const updateSurgery = (index: number, field: string, value: string) => {
    const updated = [...surgeries]
    updated[index] = { ...updated[index], [field]: value }
    setSurgeries(updated)
  }

  // Función para enviar toda la información
  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Enviar alergias
      for (const allergy of allergies) {
        if (allergy.allergen.trim()) {
          const response = await fetch('http://localhost:8000/api/v1/patients/me/allergies', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...allergy,
              diagnosed_date: allergy.diagnosed_date ? new Date(allergy.diagnosed_date).toISOString() : null
            })
          })
          if (!response.ok) {
            throw new Error('Error al guardar alergia')
          }
        }
      }

      // Enviar enfermedades
      for (const illness of illnesses) {
        if (illness.name.trim()) {
          const response = await fetch('http://localhost:8000/api/v1/patients/me/illnesses', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...illness,
              diagnosed_date: new Date(illness.diagnosed_date).toISOString()
            })
          })
          if (!response.ok) {
            throw new Error('Error al guardar enfermedad')
          }
        }
      }

      // Enviar cirugías
      for (const surgery of surgeries) {
        if (surgery.name.trim()) {
          const response = await fetch('http://localhost:8000/api/v1/patients/me/surgeries', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...surgery,
              surgery_date: new Date(surgery.surgery_date).toISOString(),
              surgery_duration_minutes: surgery.surgery_duration_minutes ? parseInt(surgery.surgery_duration_minutes) : null
            })
          })
          if (!response.ok) {
            throw new Error('Error al guardar cirugía')
          }
        }
      }

      setSuccess("Información médica guardada exitosamente")
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      setError("Error al guardar la información médica")
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-vitalgo-green rounded-xl flex items-center justify-center">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-vitalgo-dark">VitalGo</span>
            </div>
            <h1 className="text-3xl font-light text-vitalgo-dark mb-2">
              Completa tu Perfil Médico
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Agrega tu información médica para que esté disponible en emergencias. 
              Puedes completar solo las secciones que consideres relevantes.
            </p>
          </div>

          {success && (
            <AlertWithIcon variant="success" description={success} className="mb-6" />
          )}

          {error && (
            <AlertWithIcon variant="destructive" description={error} className="mb-6" />
          )}

          <div className="space-y-8">
            {/* Alergias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-red-600" />
                    <span>Alergias</span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addAllergy}
                    className="border-vitalgo-green text-vitalgo-green hover:bg-vitalgo-green hover:text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Alergia
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allergies.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No has agregado alergias. Haz clic en "Agregar Alergia" si tienes alguna.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {allergies.map((allergy, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAllergy(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField
                            label="Alérgeno *"
                            type="text"
                            placeholder="Ej: Penicilina, Polen, Mariscos"
                            value={allergy.allergen}
                            onChange={(e) => updateAllergy(index, 'allergen', e.target.value)}
                            required
                          />

                          <SelectField
                            label="Severidad *"
                            options={severidades}
                            placeholder="Selecciona severidad"
                            value={allergy.severity}
                            onChange={(e) => updateAllergy(index, 'severity', e.target.value)}
                            required
                          />

                          <InputField
                            label="Síntomas"
                            type="text"
                            placeholder="Ej: Erupciones, dificultad respiratoria"
                            value={allergy.symptoms}
                            onChange={(e) => updateAllergy(index, 'symptoms', e.target.value)}
                          />

                          <InputField
                            label="Tratamiento"
                            type="text"
                            placeholder="Ej: Epinefrina, antihistamínicos"
                            value={allergy.treatment}
                            onChange={(e) => updateAllergy(index, 'treatment', e.target.value)}
                          />

                          <InputField
                            label="Fecha de diagnóstico"
                            type="date"
                            value={allergy.diagnosed_date}
                            onChange={(e) => updateAllergy(index, 'diagnosed_date', e.target.value)}
                          />
                        </div>

                        <div className="mt-4">
                          <TextareaField
                            label="Notas adicionales"
                            placeholder="Cualquier información adicional sobre esta alergia"
                            value={allergy.notes}
                            onChange={(e) => updateAllergy(index, 'notes', e.target.value)}
                            rows={2}
                          />
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
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Enfermedades</span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addIllness}
                    className="border-vitalgo-green text-vitalgo-green hover:bg-vitalgo-green hover:text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Enfermedad
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {illnesses.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No has agregado enfermedades. Haz clic en "Agregar Enfermedad" si tienes alguna condición médica.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {illnesses.map((illness, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIllness(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField
                            label="Nombre de la enfermedad *"
                            type="text"
                            placeholder="Ej: Diabetes, Hipertensión"
                            value={illness.name}
                            onChange={(e) => updateIllness(index, 'name', e.target.value)}
                            required
                          />

                          <InputField
                            label="Fecha de diagnóstico *"
                            type="date"
                            value={illness.diagnosed_date}
                            onChange={(e) => updateIllness(index, 'diagnosed_date', e.target.value)}
                            required
                          />

                          <InputField
                            label="Código CIE-10"
                            type="text"
                            placeholder="Ej: E11, I10"
                            value={illness.cie10_code}
                            onChange={(e) => updateIllness(index, 'cie10_code', e.target.value)}
                          />

                          <InputField
                            label="Médico prescriptor"
                            type="text"
                            placeholder="Nombre del médico que diagnosticó"
                            value={illness.prescribed_by}
                            onChange={(e) => updateIllness(index, 'prescribed_by', e.target.value)}
                          />

                          <InputField
                            label="Síntomas"
                            type="text"
                            placeholder="Síntomas principales"
                            value={illness.symptoms}
                            onChange={(e) => updateIllness(index, 'symptoms', e.target.value)}
                          />

                          <InputField
                            label="Tratamiento actual"
                            type="text"
                            placeholder="Medicamentos o tratamientos"
                            value={illness.treatment}
                            onChange={(e) => updateIllness(index, 'treatment', e.target.value)}
                          />
                        </div>

                        <div className="mt-4 flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={illness.is_chronic}
                              onChange={(e) => updateIllness(index, 'is_chronic', e.target.checked)}
                              className="h-4 w-4 text-vitalgo-green focus:ring-vitalgo-green border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-600">Enfermedad crónica</span>
                          </label>
                        </div>

                        <div className="mt-4">
                          <TextareaField
                            label="Notas adicionales"
                            placeholder="Información adicional sobre esta enfermedad"
                            value={illness.notes}
                            onChange={(e) => updateIllness(index, 'notes', e.target.value)}
                            rows={2}
                          />
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
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span>Cirugías</span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSurgery}
                    className="border-vitalgo-green text-vitalgo-green hover:bg-vitalgo-green hover:text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Cirugía
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {surgeries.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No has agregado cirugías. Haz clic en "Agregar Cirugía" si has tenido alguna intervención quirúrgica.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {surgeries.map((surgery, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSurgery(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField
                            label="Nombre de la cirugía *"
                            type="text"
                            placeholder="Ej: Apendicectomía, Cesárea"
                            value={surgery.name}
                            onChange={(e) => updateSurgery(index, 'name', e.target.value)}
                            required
                          />

                          <InputField
                            label="Fecha de cirugía *"
                            type="date"
                            value={surgery.surgery_date}
                            onChange={(e) => updateSurgery(index, 'surgery_date', e.target.value)}
                            required
                          />

                          <InputField
                            label="Cirujano"
                            type="text"
                            placeholder="Nombre del cirujano"
                            value={surgery.surgeon}
                            onChange={(e) => updateSurgery(index, 'surgeon', e.target.value)}
                          />

                          <InputField
                            label="Hospital"
                            type="text"
                            placeholder="Nombre del hospital"
                            value={surgery.hospital}
                            onChange={(e) => updateSurgery(index, 'hospital', e.target.value)}
                          />

                          <SelectField
                            label="Tipo de anestesia"
                            options={tiposAnestesia}
                            placeholder="Selecciona tipo"
                            value={surgery.anesthesia_type}
                            onChange={(e) => updateSurgery(index, 'anesthesia_type', e.target.value)}
                          />

                          <InputField
                            label="Duración (minutos)"
                            type="number"
                            placeholder="Ej: 90"
                            value={surgery.surgery_duration_minutes}
                            onChange={(e) => updateSurgery(index, 'surgery_duration_minutes', e.target.value)}
                          />

                          <div className="md:col-span-2">
                            <InputField
                              label="Diagnóstico"
                              type="text"
                              placeholder="Diagnóstico previo a la cirugía"
                              value={surgery.diagnosis}
                              onChange={(e) => updateSurgery(index, 'diagnosis', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <TextareaField
                            label="Descripción"
                            placeholder="Descripción detallada de la cirugía"
                            value={surgery.description}
                            onChange={(e) => updateSurgery(index, 'description', e.target.value)}
                            rows={2}
                          />
                        </div>

                        <div className="mt-4">
                          <TextareaField
                            label="Notas adicionales"
                            placeholder="Complicaciones, observaciones especiales, etc."
                            value={surgery.notes}
                            onChange={(e) => updateSurgery(index, 'notes', e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Botones de acción */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white px-8 py-3 text-lg"
            >
              {loading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              {loading ? "Guardando..." : "Guardar Información"}
            </Button>

            <Button
              onClick={handleSkip}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 px-8 py-3 text-lg"
            >
              <SkipForward className="mr-2 h-5 w-5" />
              Completar Después
            </Button>
          </div>

          <p className="text-sm text-gray-500 text-center mt-6">
            Puedes agregar o modificar esta información más tarde desde tu dashboard.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}