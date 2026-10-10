"use client"

import Link from "next/link"
import { useEffect } from "react"
import { CircleAlertIcon, RotateCcwIcon } from "lucide-react"
import { Button, buttonVariants } from "@workspace/ui/components/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlertIcon className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Algo ha salido mal
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          No hemos podido cargar esta página. Puede ser un fallo puntual:
          inténtalo de nuevo.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={reset}>
          <RotateCcwIcon />
          Reintentar
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
