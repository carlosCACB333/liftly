"use client"

import { authClient } from "@workspace/db/client"
import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"

export default function LogoutPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Liftly</h1>
        <p className="max-w-sm text-muted-foreground">
          Cierra tu sesión y vuelve pronto.
        </p>
      </div>

      <Button onClick={handleLogout}>Cerrar sesión</Button>
    </main>
  )
}
