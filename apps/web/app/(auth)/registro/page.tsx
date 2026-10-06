import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { RegisterForm } from "@/components/auth/register-form"
import { getSession } from "@/lib/auth/session"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { buttonVariants } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta de Liftly y empieza a diseñar tus rutinas.",
}

export default async function RegistroPage() {
  const session = await getSession()

  if (session) {
    redirect("/")
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
          <CardDescription>
            Empieza a diseñar tus rutinas y a registrar cada entrenamiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className={buttonVariants({ variant: "link", size: "sm" })}
        >
          Iniciar sesión
        </Link>
      </p>
    </>
  )
}