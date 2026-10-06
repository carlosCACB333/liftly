import Link from "next/link"
import { DumbbellIcon } from "lucide-react"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-primary/10 [mask-image:radial-gradient(65%_100%_at_50%_0%,black,transparent)]"
      />

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <DumbbellIcon className="size-5" />
          </span>
          Liftly
        </Link>

        {children}
      </main>

      <footer className="relative px-6 pb-8 text-center text-xs text-muted-foreground">
        Entrena con un plan, registra cada serie y progresa semana a semana.
      </footer>
    </div>
  )
}