"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Heart, User, LogOut, Settings, QrCode } from "lucide-react"

interface HeaderProps {
  isAuthenticated?: boolean
  user?: {
    name: string
    role: "patient" | "paramedic" | "admin"
  }
}

export function Header({ isAuthenticated = false, user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-vitalgo-green rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-vitalgo-dark">VitalGo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {!isAuthenticated ? (
              <>
                <Link href="/features" className="text-gray-600 hover:text-vitalgo-green transition-colors">
                  Funcionalidades
                </Link>
                <Link href="/pricing" className="text-gray-600 hover:text-vitalgo-green transition-colors">
                  Precios
                </Link>
                <Link href="/about" className="text-gray-600 hover:text-vitalgo-green transition-colors">
                  Acerca de
                </Link>
                <Link href="/contact" className="text-gray-600 hover:text-vitalgo-green transition-colors">
                  Contacto
                </Link>
              </>
            ) : (
              <>
                {user?.role === "patient" && (
                  <>
                    <Link href="/dashboard" className="text-gray-600 hover:text-vitalgo-green transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/medical-info" className="text-gray-600 hover:text-vitalgo-green transition-colors">
                      Información Médica
                    </Link>
                    <Link href="/qr-code" className="text-gray-600 hover:text-vitalgo-green transition-colors">
                      Mi QR
                    </Link>
                  </>
                )}
                {user?.role === "paramedic" && (
                  <>
                    <Link href="/scanner" className="text-gray-600 hover:text-vitalgo-green transition-colors">
                      Scanner QR
                    </Link>
                    <Link href="/emergency" className="text-gray-600 hover:text-vitalgo-green transition-colors">
                      Emergencias
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-vitalgo-green text-vitalgo-green hover:bg-vitalgo-green hover:text-white">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/signup/paciente">
                  <Button className="bg-vitalgo-green hover:bg-vitalgo-green/90 text-white">
                    Registrarse
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-vitalgo-green/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-vitalgo-green" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{user?.name}</div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Link href="/settings">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-vitalgo-green">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {!isAuthenticated ? (
                <>
                  <Link href="/features" className="block px-3 py-2 text-gray-600 hover:text-vitalgo-green">
                    Funcionalidades
                  </Link>
                  <Link href="/pricing" className="block px-3 py-2 text-gray-600 hover:text-vitalgo-green">
                    Precios
                  </Link>
                  <Link href="/about" className="block px-3 py-2 text-gray-600 hover:text-vitalgo-green">
                    Acerca de
                  </Link>
                  <Link href="/contact" className="block px-3 py-2 text-gray-600 hover:text-vitalgo-green">
                    Contacto
                  </Link>
                  <div className="px-3 py-2 space-y-2">
                    <Link href="/login" className="block">
                      <Button variant="outline" className="w-full border-vitalgo-green text-vitalgo-green">
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/signup/paciente" className="block">
                      <Button className="w-full bg-vitalgo-green hover:bg-vitalgo-green/90 text-white">
                        Registrarse
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {user?.role === "patient" && (
                    <>
                      <Link href="/dashboard" className="block px-3 py-2 text-gray-600 hover:text-vitalgo-green">
                        Dashboard
                      </Link>
                      <Link href="/medical-info" className="block px-3 py-2 text-gray-600 hover:text-vitalgo-green">
                        Información Médica
                      </Link>
                      <Link href="/qr-code" className="block px-3 py-2 text-gray-600 hover:text-vitalgo-green">
                        Mi QR
                      </Link>
                    </>
                  )}
                  {user?.role === "paramedic" && (
                    <>
                      <Link href="/scanner" className="block px-3 py-2 text-gray-600 hover:text-vitalgo-green">
                        Scanner QR
                      </Link>
                      <Link href="/emergency" className="block px-3 py-2 text-gray-600 hover:text-vitalgo-green">
                        Emergencias
                      </Link>
                    </>
                  )}
                  <div className="px-3 py-2 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-vitalgo-green/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-vitalgo-green" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user?.name}</div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {user?.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link href="/settings" className="block">
                        <Button variant="outline" className="w-full text-left justify-start">
                          <Settings className="h-4 w-4 mr-2" />
                          Configuración
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full text-left justify-start text-red-600 hover:text-red-700">
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar Sesión
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}