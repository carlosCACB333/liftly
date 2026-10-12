import type { Metadata, Viewport } from "next"
import { Geist_Mono, Roboto } from "next/font/google"
import "@workspace/ui/globals.css"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { TimerTool } from "@/components/timer-tool"
import { cn } from "@workspace/ui/lib/utils"
import { site } from "@/lib/site"

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Liftly · Crea y comparte planes de entrenamiento",
    template: "%s · Liftly",
  },
  description: site.description,
  applicationName: site.name,
  keywords: [...site.keywords],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  category: "fitness",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: site.url,
    title: "Liftly · Crea y comparte planes de entrenamiento",
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Liftly · Crea y comparte planes de entrenamiento",
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", roboto.variable)}
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
          <TimerTool />
        </ThemeProvider>
      </body>
    </html>
  )
}
