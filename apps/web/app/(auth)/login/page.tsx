import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/auth/login-form"
import { getSession } from "@/lib/auth/session"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Accede a Liftly para seguir con tus rutinas y registrar cada entrenamiento.",
}

export default async function LoginPage() {
  const session = await getSession()

  if (session) {
    redirect("/")
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-xl">Inicia sesión</CardTitle>
          <CardDescription>
            Entra para continuar con tus rutinas y ver tu progreso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        ¿Todavía no tienes cuenta?{" "}
        <Link
          href="/registro"
          className="rounded-sm font-medium text-foreground underline underline-offset-4 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Crear cuenta
        </Link>
      </p>
    </>
  )
}