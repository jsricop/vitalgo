"use client"

import { Header } from "@/shared/components/organisms/header"
import { Footer } from "@/shared/components/organisms/footer"

interface MainLayoutProps {
  children: React.ReactNode
  isAuthenticated?: boolean
  user?: {
    name: string
    role: "patient" | "paramedic" | "admin"
  }
  showFooter?: boolean
}

export function MainLayout({ 
  children, 
  isAuthenticated = false, 
  user, 
  showFooter = true 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={isAuthenticated} user={user} />
      
      <main className="flex-1">
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  )
}