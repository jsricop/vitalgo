"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { 
  ArrowLeft, 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  Eye,
  Shield,
  Clock,
  RefreshCw,
  Smartphone
} from "lucide-react"

interface PatientData {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  qr_code?: string
  qr_generated_at?: string
}

export default function QRCodePage() {
  const router = useRouter()
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadQRCode()
  }, [])

  const loadQRCode = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      // Check authentication
      const token = localStorage.getItem('access_token')
      const userData = localStorage.getItem('user_data')
      
      if (!token || !userData) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userData)
      
      // Get current user data from API
      const userResponse = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!userResponse.ok) {
        throw new Error('Error al obtener datos del usuario')
      }

      const currentUser = await userResponse.json()
      
      // Get or generate QR code
      try {
        const qrResponse = await fetch('http://localhost:8000/api/v1/qr/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ expires_in_days: 365 })
        })

        if (qrResponse.ok) {
          const qrData = await qrResponse.json()
          setPatient({
            id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            email: currentUser.email,
            phone: currentUser.phone,
            qr_code: qrData.qr_token,
            qr_generated_at: qrData.expires_at
          })
          
          // Use the QR image from backend directly or create external URL
          if (qrData.qr_image) {
            setQrCodeUrl(qrData.qr_image)
          } else {
            // Fallback to external service
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.access_url || `http://localhost:3000/emergency/${qrData.qr_token}`)}`
            setQrCodeUrl(qrUrl)
          }
        } else {
          // If QR doesn't exist or there's an error, set patient data without QR
          console.warn('QR Code not available or error:', qrResponse.status, qrResponse.statusText)
          setPatient({
            id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            email: currentUser.email,
            phone: currentUser.phone
          })
        }
      } catch (qrError) {
        // If QR API fails, still show patient data
        console.error('Error calling QR API:', qrError)
        setPatient({
          id: currentUser.id,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          email: currentUser.email,
          phone: currentUser.phone
        })
      }
      
    } catch (error) {
      console.error('Error loading QR code:', error)
      setError("Error al cargar el código QR")
    } finally {
      setIsLoading(false)
    }
  }

  const generateNewQR = async () => {
    if (!confirm("¿Estás seguro de que quieres generar un nuevo código QR? El anterior dejará de funcionar.")) {
      return
    }

    setIsGenerating(true)
    setError("")

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      const qrResponse = await fetch('http://localhost:8000/api/v1/qr/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expires_in_days: 365 })
      })

      if (!qrResponse.ok) {
        const errorData = await qrResponse.json().catch(() => ({ message: 'Error desconocido' }))
        console.error('QR Generation Error:', errorData)
        throw new Error(errorData.message || `Error ${qrResponse.status}: ${qrResponse.statusText}`)
      }

      const qrData = await qrResponse.json()
      
      // Update patient data with new QR
      if (patient) {
        setPatient({
          ...patient,
          qr_code: qrData.qr_token,
          qr_generated_at: qrData.expires_at
        })
      }
      
      // Use the QR image from backend directly or create external URL
      if (qrData.qr_image) {
        setQrCodeUrl(qrData.qr_image)
      } else {
        // Fallback to external service
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.access_url || `http://localhost:3000/emergency/${qrData.qr_token}`)}`
        setQrCodeUrl(qrUrl)
      }
      
    } catch (error) {
      console.error('Error generating new QR:', error)
      setError("Error al generar nuevo código QR")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQR = () => {
    if (qrCodeUrl && patient) {
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = `VitalGo_QR_${patient.first_name}_${patient.last_name}.png`.replace(/\s+/g, '_')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const copyToClipboard = async () => {
    if (!patient?.qr_code) return
    
    try {
      await navigator.clipboard.writeText(`http://localhost:3000/emergency/${patient.qr_code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const shareQR = async () => {
    if (navigator.share && qrCodeUrl && patient?.qr_code) {
      try {
        await navigator.share({
          title: 'Mi Código QR VitalGo',
          text: 'Código QR de emergencia médica - VitalGo',
          url: `http://localhost:3000/emergency/${patient.qr_code}`
        })
      } catch (error) {
        console.error('Error sharing:', error)
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  if (!patient) {
    return (
      <MainLayout isAuthenticated={true} user={{ name: "Usuario", role: "patient" }}>
        <div className="min-h-screen bg-gradient-to-br from-white via-vitalgo-green/5 to-white">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="text-gray-600 mt-4">Cargando información del usuario...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout isAuthenticated={true} user={{ name: `${patient.first_name} ${patient.last_name}`, role: "patient" }}>
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
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <QrCode className="h-8 w-8 text-vitalgo-green" />
                <h1 className="text-3xl font-light text-vitalgo-dark">
                  Mi Código QR
                </h1>
              </div>
              <p className="text-gray-600">
                Tu código de emergencia médica personal
              </p>
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

          <div className="max-w-2xl mx-auto space-y-8">
            {/* QR Code Display */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Shield className="h-5 w-5 text-vitalgo-green" />
                  <span>Código de Emergencia</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-lg border-4 border-vitalgo-green/20">
                      {isLoading ? (
                        <div className="w-48 h-48 flex items-center justify-center">
                          <Spinner size="lg" />
                        </div>
                      ) : qrCodeUrl ? (
                        <img 
                          src={qrCodeUrl} 
                          alt="Código QR VitalGo" 
                          className="w-48 h-48"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                          <QrCode className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Info */}
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                    {patient.qr_code ? (
                      <>
                        <p className="text-sm text-gray-600 font-mono bg-gray-100 inline-block px-3 py-1 rounded">
                          {patient.qr_code}
                        </p>
                        <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>
                            Generado: {patient.qr_generated_at ? new Date(patient.qr_generated_at).toLocaleDateString('es-CO') : 'Fecha no disponible'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Genera tu primer código QR para emergencias
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      onClick={downloadQR}
                      variant="outline"
                      className="border-vitalgo-green text-vitalgo-green hover:bg-vitalgo-green hover:text-white"
                      disabled={!qrCodeUrl || isLoading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                    
                    <Button
                      onClick={shareQR}
                      variant="outline"
                      disabled={!qrCodeUrl || isLoading}
                    >
                      {copied ? (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartir
                        </>
                      )}
                    </Button>

                    {patient.qr_code && (
                      <Link href={`/emergency/${patient.qr_code}`}>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver página
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Generate New */}
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={generateNewQR}
                      variant="outline"
                      disabled={isGenerating}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      {isGenerating ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {isGenerating ? "Generando..." : "Generar Nuevo QR"}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Solo genera un nuevo código si has perdido el anterior
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>¿Cómo usar tu código QR?</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-vitalgo-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Guarda tu código</h4>
                      <p className="text-sm text-gray-600">
                        Descarga la imagen o guárdala en tu teléfono para tenerla siempre disponible
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-vitalgo-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">En caso de emergencia</h4>
                      <p className="text-sm text-gray-600">
                        Los paramédicos pueden escanear tu código para acceder a tu información médica vital
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-vitalgo-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Acceso seguro</h4>
                      <p className="text-sm text-gray-600">
                        Solo los paramédicos certificados pueden ver tu información completa
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                    <div className="flex items-start space-x-2">
                      <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Información importante</p>
                        <p>
                          Mantén actualizada tu información médica para que los paramédicos 
                          tengan acceso a datos precisos en caso de emergencia.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}