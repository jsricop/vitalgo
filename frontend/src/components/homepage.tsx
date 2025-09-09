"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  Shield, 
  FileText, 
  QrCode, 
  Smartphone, 
  Clock, 
  Users, 
  Activity,
  HeartHandshake,
  Stethoscope,
  Brain,
  Globe,
  Star,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
}

interface StatCardProps {
  number: string
  label: string
  icon: React.ReactNode
}

interface TestimonialProps {
  name: string
  role: string
  content: string
  rating: number
}

function FeatureCard({ icon, title, description, badge }: FeatureCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-vitalgo-green/20">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-vitalgo-green/10 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ number, label, icon }: StatCardProps) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-2">
        <div className="w-10 h-10 bg-vitalgo-green/10 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-vitalgo-dark mb-1">{number}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

function TestimonialCard({ name, role, content, rating }: TestimonialProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center mb-3">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
            />
          ))}
        </div>
        <p className="text-gray-600 mb-4 leading-relaxed">&ldquo;{content}&rdquo;</p>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{name}</div>
            <div className="text-sm text-gray-500">{role}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Homepage() {
  const features = [
    {
      icon: <FileText className="h-6 w-6 text-vitalgo-green" />,
      title: "Historial Médico Unificado",
      description: "Centraliza toda tu información médica en una sola plataforma segura y accesible desde cualquier dispositivo.",
      badge: "Popular"
    },
    {
      icon: <QrCode className="h-6 w-6 text-vitalgo-green" />,
      title: "QR de Emergencia",
      description: "Acceso inmediato a tu información médica crítica en situaciones de emergencia, disponible 24/7 sin internet.",
      badge: "Innovador"
    },
    {
      icon: <Brain className="h-6 w-6 text-vitalgo-green" />,
      title: "IA Médica Avanzada",
      description: "Triaje inteligente y transcripción automática que optimiza la atención médica y reduce tiempos de espera hasta 70%."
    },
    {
      icon: <Shield className="h-6 w-6 text-vitalgo-green" />,
      title: "Seguridad Hospitalaria",
      description: "Encriptación AES-256 y cumplimiento total con HIPAA, GDPR y normativas colombianas de protección de datos."
    },
    {
      icon: <Stethoscope className="h-6 w-6 text-vitalgo-green" />,
      title: "Para Profesionales",
      description: "Herramientas especializadas para médicos, paramédicos y centros de salud con dashboards inteligentes."
    },
    {
      icon: <Smartphone className="h-6 w-6 text-vitalgo-green" />,
      title: "PWA Offline",
      description: "Aplicación web progresiva que funciona sin conexión, garantizando acceso a tu información médica siempre."
    }
  ]

  const stats = [
    { number: "10K+", label: "Pacientes Activos", icon: <Users className="h-5 w-5 text-vitalgo-green" /> },
    { number: "500+", label: "Centros de Salud", icon: <HeartHandshake className="h-5 w-5 text-vitalgo-green" /> },
    { number: "70%", label: "Reducción Tiempos", icon: <Clock className="h-5 w-5 text-vitalgo-green" /> },
    { number: "99.9%", label: "Disponibilidad", icon: <Activity className="h-5 w-5 text-vitalgo-green" /> }
  ]

  const testimonials = [
    {
      name: "Dr. María González",
      role: "Médica Internista - Hospital San Ignacio",
      content: "VitalGo ha transformado completamente nuestra atención en urgencias. La información está disponible al instante.",
      rating: 5
    },
    {
      name: "Carlos Rodríguez",
      role: "Paciente Diabético",
      content: "Por fin tengo todo mi historial médico organizado. El QR de emergencia me da mucha tranquilidad.",
      rating: 5
    },
    {
      name: "Enf. Ana Patricia Silva",
      role: "Paramédica - Cruz Roja Colombia",
      content: "El scanner QR nos permite actuar más rápido en emergencias. Es una herramienta invaluable.",
      rating: 5
    }
  ]

  const benefits = [
    "Integración con Odoo ERP para citas médicas",
    "Scanner QR nativo para paramédicos",
    "Transcripción automática de consultas",
    "Métricas en tiempo real para centros de salud",
    "Notificaciones push inteligentes",
    "Soporte 24/7 especializado"
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-vitalgo-green/5 to-white py-16 lg:py-24">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-vitalgo-green/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-vitalgo-green/10 text-vitalgo-green hover:bg-vitalgo-green/20">
              <Globe className="w-3 h-3 mr-1" />
              Líder en Salud Digital Colombia
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight text-vitalgo-dark mb-6">
              Tu salud.
              <br />
              <span className="text-vitalgo-green font-normal">Simplificada.</span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Unifica tu historial médico, optimiza urgencias con IA y mejora la gestión clínica. 
              La revolución de la salud digital que reduce tiempos de espera hasta <strong className="text-vitalgo-green">70%</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/signup/paciente">
                <Button size="lg" className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white px-8 py-4 text-lg">
                  Crear mi cuenta gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-vitalgo-green text-vitalgo-green hover:bg-vitalgo-green hover:text-white px-8 py-4 text-lg"
                >
                  Iniciar sesión
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-vitalgo-green/10 text-vitalgo-green">
              Funcionalidades
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-light text-vitalgo-dark mb-4">
              Todo lo que necesitas para gestionar tu salud
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tecnología de vanguardia diseñada específicamente para el sistema de salud colombiano
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-vitalgo-green/10 text-vitalgo-green">
                ¿Por qué VitalGo?
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-light text-vitalgo-dark mb-6">
                La plataforma más completa de salud digital
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Diseñada con arquitectura hexagonal y principios SOLID para garantizar 
                escalabilidad, seguridad y una experiencia de usuario excepcional.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-vitalgo-green flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card className="p-6 shadow-xl border-0 bg-gradient-to-br from-vitalgo-green/5 to-blue-50/30">
                <CardContent className="p-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-vitalgo-green rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">V</span>
                        </div>
                        <span className="font-bold text-vitalgo-dark">Dashboard Médico</span>
                      </div>
                      <Badge className="bg-vitalgo-green text-white">En vivo</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-2xl font-bold text-vitalgo-green">1,247</div>
                        <div className="text-sm text-gray-600">Pacientes Activos</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-2xl font-bold text-vitalgo-green">98.7%</div>
                        <div className="text-sm text-gray-600">Satisfacción</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center space-x-3 mb-3">
                        <QrCode className="h-5 w-5 text-vitalgo-green" />
                        <span className="font-medium">Últimos Escaneos QR</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Emergencia - Hospital Central</span>
                          <span className="text-vitalgo-green">Activo</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Consulta - Clínica Norte</span>
                          <span className="text-gray-500">2 min ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-vitalgo-green/10 text-vitalgo-green">
              Testimonios
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-light text-vitalgo-dark mb-4">
              Confiado por profesionales de la salud
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Miles de médicos y pacientes ya transformaron su experiencia en salud con VitalGo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-vitalgo-green to-vitalgo-green/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-light text-white mb-6">
              Comienza tu transformación digital en salud
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Únete a miles de pacientes y profesionales que ya revolucionaron 
              su experiencia en salud con tecnología de vanguardia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup/paciente">
                <Button size="lg" className="bg-white text-vitalgo-green hover:bg-gray-100 px-8 py-4 text-lg">
                  Registrarse como Paciente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup/paramedico">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-vitalgo-green px-8 py-4 text-lg"
                >
                  Registrarse como Profesional
                </Button>
              </Link>
            </div>

            <p className="text-sm text-white/80 mt-6">
              Gratis para siempre • Sin tarjeta de crédito • Configuración en 2 minutos
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}