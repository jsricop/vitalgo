"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { InputField } from "@/shared/components/molecules/form-field"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { 
  Camera, 
  QrCode, 
  Search, 
  AlertTriangle, 
  ArrowRight,
  ScanLine,
  Type,
  Smartphone
} from "lucide-react"

export default function ScannerPage() {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera')
  const [manualCode, setManualCode] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [lastScanned, setLastScanned] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)

  const startCamera = async () => {
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Cámara trasera preferida
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
      }
    } catch (error) {
      setError("No se pudo acceder a la cámara. Verifica los permisos.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      navigateToEmergency(manualCode.trim())
    }
  }

  const navigateToEmergency = (qrCode: string) => {
    setLastScanned(qrCode)
    window.open(`/emergency/${qrCode}`, '_blank')
  }

  const mockScan = () => {
    // Simulación de escaneo exitoso
    const mockCode = "VG-123-ABC-789"
    setLastScanned(mockCode)
    stopCamera()
    navigateToEmergency(mockCode)
  }

  return (
    <MainLayout isAuthenticated={true} user={{ name: "Dr. Paramédico", role: "paramedic" }}>
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <QrCode className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-light text-blue-600">
                Scanner QR de Emergencia
              </h1>
            </div>
            <p className="text-gray-600">
              Escanea el código QR del paciente para acceder a su información médica
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <AlertWithIcon
              variant="destructive"
              description={error}
              className="mb-6 max-w-2xl mx-auto"
            />
          )}

          <div className="max-w-2xl mx-auto space-y-8">
            {/* Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Método de Escaneo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={scanMode === 'camera' ? 'default' : 'outline'}
                    onClick={() => setScanMode('camera')}
                    className="h-16 flex flex-col space-y-2"
                  >
                    <Camera className="h-6 w-6" />
                    <span>Escanear con Cámara</span>
                  </Button>
                  
                  <Button
                    variant={scanMode === 'manual' ? 'default' : 'outline'}
                    onClick={() => setScanMode('manual')}
                    className="h-16 flex flex-col space-y-2"
                  >
                    <Type className="h-6 w-6" />
                    <span>Ingreso Manual</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Camera Scanner */}
            {scanMode === 'camera' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-5 w-5" />
                    <span>Scanner de Cámara</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Camera View */}
                    <div className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                        {isScanning ? (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                              {/* Scanning frame */}
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-48 h-48 border-4 border-blue-500 rounded-lg relative">
                                  {/* Corner indicators */}
                                  <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-blue-500 rounded-tl"></div>
                                  <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-blue-500 rounded-tr"></div>
                                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-blue-500 rounded-bl"></div>
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-blue-500 rounded-br"></div>
                                  
                                  {/* Scanning line animation */}
                                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
                                </div>
                              </div>
                              
                              {/* Instructions */}
                              <div className="absolute bottom-4 left-0 right-0 text-center">
                                <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg mx-4">
                                  <div className="flex items-center justify-center space-x-2">
                                    <ScanLine className="h-4 w-4" />
                                    <span>Centra el código QR en el marco</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Camera className="h-16 w-16 mb-4" />
                            <p className="text-center">
                              Presiona "Iniciar Cámara" para comenzar el escaneo
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Camera Controls */}
                    <div className="flex justify-center space-x-4">
                      {!isScanning ? (
                        <Button
                          onClick={startCamera}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Iniciar Cámara
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={stopCamera}
                            variant="outline"
                          >
                            Detener
                          </Button>
                          
                          {/* Mock scan button for demo */}
                          <Button
                            onClick={mockScan}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Simular Escaneo
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual Input */}
            {scanMode === 'manual' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Type className="h-5 w-5" />
                    <span>Ingreso Manual</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualSubmit} className="space-y-6">
                    <InputField
                      label="Código QR"
                      type="text"
                      name="qrCode"
                      placeholder="VG-123-ABC-789"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      required
                    />
                    
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                      disabled={!manualCode.trim()}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Buscar Paciente
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Last Scanned */}
            {lastScanned && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">Último código escaneado</p>
                      <p className="text-sm text-green-600 font-mono">{lastScanned}</p>
                    </div>
                    <Button
                      onClick={() => navigateToEmergency(lastScanned)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Ver Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Instrucciones de Uso</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Localiza el código QR</h4>
                      <p className="text-sm text-gray-600">
                        Busca el código QR en el teléfono del paciente o en su tarjeta médica
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Escanea o ingresa el código</h4>
                      <p className="text-sm text-gray-600">
                        Usa la cámara para escanear automáticamente o ingresa el código manualmente
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Accede a la información</h4>
                      <p className="text-sm text-gray-600">
                        La información médica del paciente se abrirá automáticamente
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Nota importante</p>
                        <p>
                          Esta herramienta debe usarse únicamente en situaciones de emergencia médica 
                          o con el consentimiento explícito del paciente.
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