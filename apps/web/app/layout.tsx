import type { Metadata } from "next"
import { Geist_Mono, Roboto } from "next/font/google"
import "@workspace/ui/globals.css"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { TimerTool } from "@/components/timer-tool"
import { cn } from "@workspace/ui/lib/utils"

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Liftly",
    template: "%s · Liftly",
  },
  description:
    "Crea planes de entrenamiento con sesiones y ejercicios, compártelos con la comunidad o copia los de otros.",
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
