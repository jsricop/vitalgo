"use client"

import { useState, useEffect } from "react"
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

const mockPatient = {
  id: "123",
  nombre: "Juan Carlos Pérez",
  qr_code: "VG-123-ABC-789",
  last_generated: "2024-01-15T10:30:00Z"
}

export default function QRCodePage() {
  const [patient] = useState(mockPatient)
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
      // Simular carga del QR existente
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // En un caso real, aquí se haría la petición al backend
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://vitalgo.com/emergency/${patient.qr_code}`)}`
      setQrCodeUrl(qrUrl)
      
    } catch (error) {
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
      // Simular generación de nuevo QR
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newCode = `VG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://vitalgo.com/emergency/${newCode}`)}`
      setQrCodeUrl(qrUrl)
      
    } catch (error) {
      setError("Error al generar nuevo código QR")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = `VitalGo_QR_${patient.nombre.replace(/\s+/g, '_')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`https://vitalgo.com/emergency/${patient.qr_code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const shareQR = async () => {
    if (navigator.share && qrCodeUrl) {
      try {
        await navigator.share({
          title: 'Mi Código QR VitalGo',
          text: 'Código QR de emergencia médica - VitalGo',
          url: `https://vitalgo.com/emergency/${patient.qr_code}`
        })
      } catch (error) {
        console.error('Error sharing:', error)
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <MainLayout isAuthenticated={true} user={{ name: patient.nombre, role: "patient" }}>
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
                      {patient.nombre}
                    </p>
                    <p className="text-sm text-gray-600 font-mono bg-gray-100 inline-block px-3 py-1 rounded">
                      {patient.qr_code}
                    </p>
                    <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>
                        Generado: {new Date(patient.last_generated).toLocaleDateString('es-CO')}
                      </span>
                    </div>
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

                    <Link href={`/emergency/${patient.qr_code}`}>
                      <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver página
                      </Button>
                    </Link>
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