import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VitalGo - Tu Salud Unificada, La Medicina Simplificada",
  description: "Plataforma líder en salud digital de Colombia. Unifica tu historial médico, reduce tiempos de urgencias 70% con IA, y optimiza la gestión clínica.",
  keywords: [
    "VitalGo", "salud digital Colombia", "historial médico unificado", 
    "urgencias inteligentes", "IA médica", "QR emergencia médica",
    "telemedicina", "gestión hospitalaria", "historia clínica digital"
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logos-blue-light-background.png", type: "image/png" },
    ],
    apple: [
      { url: "/logos-blue-light-background.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VitalGo",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "VitalGo",
    title: "VitalGo - Tu Salud Unificada, La Medicina Simplificada",
    description: "Plataforma líder en salud digital de Colombia. Unifica tu historial médico y optimiza la atención de emergencia.",
    images: [
      {
        url: "/logos-blue-light-background.png",
        width: 120,
        height: 120,
        alt: "VitalGo Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "VitalGo - Tu Salud Unificada, La Medicina Simplificada",
    description: "Plataforma líder en salud digital de Colombia. Unifica tu historial médico y optimiza la atención de emergencia.",
    images: ["/logos-blue-light-background.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VitalGo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#10B981" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
