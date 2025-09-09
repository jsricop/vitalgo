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
      title: "Tu Historial Siempre Contigo",
      description: "Toda tu información médica organizada en un solo lugar. Consulta tus datos desde cualquier dispositivo cuando los necesites.",
      badge: "Popular"
    },
    {
      icon: <QrCode className="h-6 w-6 text-vitalgo-green" />,
      title: "QR para Emergencias",
      description: "Un código QR que puede salvarte la vida. Los paramédicos acceden al instante a tus alergias y condiciones médicas críticas.",
      badge: "Vital"
    },
    {
      icon: <Clock className="h-6 w-6 text-vitalgo-green" />,
      title: "Consultas Más Rápidas",
      description: "El médico ya tiene tu historial antes de verte. Consultas más eficientes que te ahorran hasta 70% del tiempo de espera."
    },
    {
      icon: <Shield className="h-6 w-6 text-vitalgo-green" />,
      title: "Máxima Seguridad",
      description: "Tus datos médicos protegidos con los más altos estándares de seguridad. Solo tú decides quién puede verlos."
    },
    {
      icon: <Stethoscope className="h-6 w-6 text-vitalgo-green" />,
      title: "Ideal para Profesionales",
      description: "Si eres médico o paramédico, accede rápidamente a la información de tus pacientes para brindar mejor atención."
    },
    {
      icon: <Smartphone className="h-6 w-6 text-vitalgo-green" />,
      title: "Funciona Sin Internet",
      description: "Accede a tu información médica básica incluso sin conexión. Siempre disponible cuando más lo necesitas."
    }
  ]

  const stats = [
    { number: "10K+", label: "Pacientes Confían en Nosotros", icon: <Users className="h-5 w-5 text-vitalgo-green" /> },
    { number: "500+", label: "Centros de Salud Conectados", icon: <HeartHandshake className="h-5 w-5 text-vitalgo-green" /> },
    { number: "70%", label: "Menos Tiempo de Espera", icon: <Clock className="h-5 w-5 text-vitalgo-green" /> },
    { number: "24/7", label: "Siempre Disponible", icon: <Activity className="h-5 w-5 text-vitalgo-green" /> }
  ]

  const testimonials = [
    {
      name: "Dr. María González",
      role: "Médica Internista - Hospital San Ignacio",
      content: "VitalGo cambió mi forma de atender urgencias. Ahora tengo la información del paciente al instante, sin esperas ni papeles.",
      rating: 5
    },
    {
      name: "Carlos Rodríguez",
      role: "Paciente Diabético",
      content: "Llevaba años cargando carpetas con mis exámenes. Ahora todo está en mi teléfono y mi familia puede acceder si me pasa algo.",
      rating: 5
    },
    {
      name: "Ana Patricia Silva",
      role: "Paramédica - Cruz Roja Colombia",
      content: "En emergencias cada segundo cuenta. Con VitalGo veo las alergias y condiciones del paciente antes de llegar al hospital.",
      rating: 5
    }
  ]

  const benefits = [
    "✅ Acceso seguro con tu email y contraseña desde cualquier lugar",
    "✅ Registro gratuito en menos de 2 minutos",
    "✅ Historial médico completo: alergias, enfermedades y cirugías",
    "✅ Código QR personal para emergencias médicas",
    "✅ Panel personalizado según seas paciente o profesional de salud",
    "✅ Información disponible 24/7 sin necesidad de papeles"
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
            {/* Logo principal */}
            <div className="flex justify-center mb-8">
              <img 
                src="/logoh-blue-light-background.png" 
                alt="VitalGo Logo" 
                className="h-16 w-auto"
              />
            </div>
            
            <Badge className="mb-6 bg-vitalgo-green/10 text-vitalgo-green hover:bg-vitalgo-green/20">
              <Globe className="w-3 h-3 mr-1" />
              Líder en Salud Digital Colombia
            </Badge>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight text-vitalgo-dark mb-6">
              Tu salud.
              <br />
              <span className="text-vitalgo-green font-normal">Simplificada.</span>
            </h2>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Toda tu información médica en un solo lugar, siempre disponible cuando la necesites. 
              Acceso inmediato en emergencias y consultas más rápidas que te ahorran hasta <strong className="text-vitalgo-green">70%</strong> del tiempo de espera.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/signup/paciente">
                <Button size="lg" className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white px-8 py-4 text-lg">
                  Soy Paciente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup/paramedico">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                >
                  Soy Profesional de Salud
                  <Stethoscope className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex justify-center mb-12">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-8 py-4 text-lg"
                >
                  Ya tengo cuenta - Iniciar sesión
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
              Todo lo que necesitas para cuidar tu salud
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Herramientas simples y poderosas para que tengas el control total de tu información médica
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
                <strong>Ya disponible para ti:</strong> Crea tu cuenta gratuita y accede inmediatamente a tu historial médico digital. 
                Registra tus alergias, enfermedades y cirugías de forma segura. Genera tu código QR personal para que los paramédicos 
                puedan acceder a tu información vital en emergencias. Todo desde cualquier dispositivo, las 24 horas del día.
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
                        <img 
                          src="/logoh-blue-light-background.png" 
                          alt="VitalGo" 
                          className="h-8 w-auto"
                        />
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

      {/* Use Cases Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-vitalgo-green/10 text-vitalgo-green">
              Ideal Para
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-light text-vitalgo-dark mb-4">
              Perfecto para cualquier situación de tu vida
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              VitalGo se adapta a tu estilo de vida, protegiendo tu salud en cada momento
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-vitalgo-green/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-vitalgo-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-vitalgo-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">Colegios y Excursiones</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Profesores y padres tienen acceso inmediato a alergias y medicamentos de los estudiantes. 
                  Esencial para salidas escolares y campamentos.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-vitalgo-green/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-vitalgo-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-vitalgo-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">Deportistas</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Ideal para atletas en competencias. Los médicos deportivos acceden rápidamente 
                  a lesiones previas, alergias a medicamentos y condiciones especiales.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-vitalgo-green/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-vitalgo-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="h-8 w-8 text-vitalgo-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">Empleados</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Empresas pueden implementar VitalGo para emergencias laborales. 
                  Los brigadistas acceden instantáneamente a información médica crítica.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-vitalgo-green/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-vitalgo-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-vitalgo-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">Viajeros</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Viaja tranquilo sabiendo que cualquier hospital en el mundo puede acceder 
                  a tu historial médico, sin barreras de idioma ni papeles perdidos.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-vitalgo-green/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-vitalgo-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-vitalgo-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">Adultos Mayores</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Perfecto para personas con múltiples medicamentos y condiciones. 
                  Los familiares pueden acceder si hay una emergencia.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-vitalgo-green/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-vitalgo-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="h-8 w-8 text-vitalgo-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">Personas con Condiciones Crónicas</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Diabetes, hipertensión, epilepsia: toda la información crítica 
                  siempre disponible para cualquier profesional de salud.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-vitalgo-green/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-vitalgo-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-vitalgo-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">Familias</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Padres pueden gestionar la información médica de toda la familia. 
                  Un solo lugar para todos los historiales médicos.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-vitalgo-green/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-vitalgo-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-vitalgo-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">Trabajadores de Alto Riesgo</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Mineros, bomberos, policías: profesiones de riesgo donde 
                  el acceso rápido a información médica puede salvar vidas.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-vitalgo-green/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-vitalgo-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-vitalgo-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">Motociclistas</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Fundamental para quienes usan moto como transporte diario. 
                  En accidentes, los paramédicos acceden inmediatamente a tipo de sangre, alergias y contactos de emergencia.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-6">
              <strong>¿Te identificas con alguna de estas situaciones?</strong> VitalGo está diseñado para protegerte en cada momento.
            </p>
            <Link href="/signup/paciente">
              <Button className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white px-8 py-3">
                Empieza gratis ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
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
              Historias reales de personas como tú
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre cómo VitalGo está mejorando la vida de pacientes y profesionales de la salud en Colombia
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
              Tu salud merece estar en buenas manos
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Únete a miles de personas que ya tienen su información médica segura y siempre disponible. 
              Es gratis y te toma menos de 2 minutos.
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
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-white px-8 py-4 text-lg"
                >
                  Registrarse como Profesional
                  <Stethoscope className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <p className="text-sm text-white/80 mt-6">
              Gratis para siempre • Sin tarjeta de crédito • Solo necesitas tu email
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}