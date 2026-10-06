import Link from "next/link"
import { buttonVariants } from "@workspace/ui/components/button"
import { getSession } from "@/lib/auth/session"

export default async function Page() {
  const session = await getSession()
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Liftly</h1>
        <p className="max-w-sm text-muted-foreground">
          Crea tus rutinas de gimnasio y registra cada entrenamiento.
        </p>
      </div>

      <pre>{JSON.stringify(session, null, 2)}</pre>

      {session ? (
        <Link
          href="/logout"
          className={buttonVariants({ size: "lg", className: "px-4" })}
        >
          Cerrar sesión
        </Link>
      ) : (
        <Link
          href="/login"
          className={buttonVariants({ size: "lg", className: "px-4" })}
        >
          Iniciar sesión
        </Link>
      )}
    </main>
  )
}
