"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertWithIcon } from "@/shared/components/atoms/alert"
import { Spinner } from "@/shared/components/atoms/spinner"
import { MainLayout } from "@/shared/components/templates/main-layout"
import { User, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react"

interface PendingParamedic {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  created_at: string
  status: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [pendingParamedics, setPendingParamedics] = useState<PendingParamedic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setUser(parsedUser)
    fetchPendingParamedics(token)
  }, [router])

  const fetchPendingParamedics = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/admin/pending-paramedics", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPendingParamedics(data)
      } else {
        throw new Error("Error al cargar paramédicos pendientes")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar paramédicos pendientes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (paramedicId: string) => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    setProcessingIds(prev => new Set(prev).add(paramedicId))

    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/approve-paramedic/${paramedicId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        setPendingParamedics(prev => prev.filter(p => p.id !== paramedicId))
      } else {
        throw new Error("Error al aprobar paramédico")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al aprobar paramédico")
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(paramedicId)
        return newSet
      })
    }
  }

  const handleReject = async (paramedicId: string) => {
    const token = localStorage.getItem('access_token')
    const reason = rejectionReasons[paramedicId]
    
    if (!token) return
    if (!reason || reason.trim() === "") {
      setError("La razón de rechazo es obligatoria")
      return
    }

    setProcessingIds(prev => new Set(prev).add(paramedicId))

    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/reject-paramedic/${paramedicId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rejection_reason: reason
        })
      })

      if (response.ok) {
        setPendingParamedics(prev => prev.filter(p => p.id !== paramedicId))
        setRejectionReasons(prev => {
          const newReasons = { ...prev }
          delete newReasons[paramedicId]
          return newReasons
        })
      } else {
        throw new Error("Error al rechazar paramédico")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al rechazar paramédico")
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(paramedicId)
        return newSet
      })
    }
  }

  const handleReasonChange = (paramedicId: string, reason: string) => {
    setRejectionReasons(prev => ({
      ...prev,
      [paramedicId]: reason
    }))
    if (error) setError("")
  }

  if (isLoading) {
    return (
      <MainLayout user={user}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout user={user}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-vitalgo-dark">Dashboard de Administración</h1>
            <p className="text-gray-600 mt-2">
              Gestiona las solicitudes de registro de paramédicos
            </p>
          </div>

          {error && (
            <AlertWithIcon
              variant="destructive"
              description={error}
              className="mb-6"
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-orange-500" />
                Solicitudes Pendientes ({pendingParamedics.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingParamedics.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay solicitudes pendientes
                  </h3>
                  <p className="text-gray-600">
                    Todas las solicitudes de paramédicos han sido procesadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingParamedics.map((paramedic) => (
                    <div key={paramedic.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {paramedic.first_name} {paramedic.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">{paramedic.email}</p>
                            <p className="text-sm text-gray-600">{paramedic.phone}</p>
                            <p className="text-xs text-gray-500">
                              Solicitud enviada: {new Date(paramedic.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-start space-x-3">
                          <MessageSquare className="h-4 w-4 text-gray-400 mt-1" />
                          <div className="flex-1">
                            <Textarea
                              placeholder="Razón de rechazo (obligatorio para rechazar)"
                              value={rejectionReasons[paramedic.id] || ""}
                              onChange={(e) => handleReasonChange(paramedic.id, e.target.value)}
                              rows={2}
                              className="resize-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <Button
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(paramedic.id)}
                            disabled={processingIds.has(paramedic.id)}
                          >
                            {processingIds.has(paramedic.id) ? (
                              <Spinner size="sm" className="mr-2" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Rechazar
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(paramedic.id)}
                            disabled={processingIds.has(paramedic.id)}
                          >
                            {processingIds.has(paramedic.id) ? (
                              <Spinner size="sm" className="mr-2" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Aprobar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}