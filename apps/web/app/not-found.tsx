import Link from "next/link"
import { CompassIcon, DumbbellIcon } from "lucide-react"
import { buttonVariants } from "@workspace/ui/components/button"

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <DumbbellIcon className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Página no encontrada
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          La dirección que buscas no existe o el plan ya no está disponible:
          puede que su autor lo haya hecho privado o lo haya eliminado.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/" className={buttonVariants()}>
          Inicio
        </Link>
        <Link href="/plans" className={buttonVariants({ variant: "outline" })}>
          <CompassIcon />
          Explorar planes
        </Link>
      </div>
    </main>
  )
}
