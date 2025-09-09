import Link from "next/link"
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-vitalgo-dark text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-vitalgo-green rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">VitalGo</span>
            </Link>
            <p className="text-vitalgo-dark-lighter mb-6 max-w-md leading-relaxed">
              La plataforma líder en salud digital de Colombia. Unificamos tu historial médico 
              y optimizamos la atención de emergencia con tecnología de vanguardia.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Producto</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                  Seguridad
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                  Integraciones
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Compañía</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                  Acerca de
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                  Trabaja con nosotros
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                  Prensa
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                  Socios
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-vitalgo-dark-light mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-vitalgo-green/10 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-vitalgo-green" />
              </div>
              <div>
                <div className="font-medium">Email</div>
                <div className="text-vitalgo-dark-lighter">contacto@vitalgo.com</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-vitalgo-green/10 rounded-lg flex items-center justify-center">
                <Phone className="h-5 w-5 text-vitalgo-green" />
              </div>
              <div>
                <div className="font-medium">Teléfono</div>
                <div className="text-vitalgo-dark-lighter">+57 (1) 234-5678</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-vitalgo-green/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-vitalgo-green" />
              </div>
              <div>
                <div className="font-medium">Oficina</div>
                <div className="text-vitalgo-dark-lighter">Bogotá, Colombia</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-vitalgo-dark-light pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-vitalgo-dark-lighter text-sm">
            © {currentYear} VitalGo. Todos los derechos reservados.
          </div>
          <div className="flex space-x-6 text-sm mt-4 md:mt-0">
            <Link href="/privacy" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
              Política de Privacidad
            </Link>
            <Link href="/terms" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
              Términos de Servicio
            </Link>
            <Link href="/cookies" className="text-vitalgo-dark-lighter hover:text-vitalgo-green transition-colors">
              Política de Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}