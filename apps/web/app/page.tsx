import Link from "next/link"
import {
  CopyIcon,
  DumbbellIcon,
  GlobeIcon,
  HeartIcon,
  ListChecksIcon,
  LockIcon,
  MoonIcon,
  PlusIcon,
  Rows3Icon,
} from "lucide-react"
import { buttonVariants } from "@workspace/ui/components/button"
import { getSession } from "@/lib/auth/session"
import { ThemeToggle } from "@/components/theme-toggle"

const FEATURES = [
  {
    icon: Rows3Icon,
    title: "Plan por sesiones",
    body: "Divide tu plan en sesiones nombradas y ordénalas. En cada ejercicio defines series, repeticiones o duración, peso y descanso.",
  },
  {
    icon: LockIcon,
    title: "Privado o público",
    body: "Tu plan empieza privado. Cuando lo publicas aparece en Explorar y cualquiera con cuenta puede darle corazón.",
  },
  {
    icon: CopyIcon,
    title: "Copia planes ajenos",
    body: "Guarda en Mis planes cualquier plan público. La copia es tuya e independiente, y atribuimos siempre al autor original.",
  },
] as const

const STEPS = [
  {
    icon: PlusIcon,
    title: "1 · Diseña",
    body: "Crea el plan, añade sesiones y escribe a mano los ejercicios que vas a hacer.",
  },
  {
    icon: GlobeIcon,
    title: "2 · Comparte",
    body: "Publícalo para la comunidad o manténlo privado. Despublicar lo oculta al instante.",
  },
  {
    icon: HeartIcon,
    title: "3 · Reutiliza",
    body: "Da corazón a los que te gusten y cópialos para adaptarlos a tu entrenamiento.",
  },
] as const

export default async function Page() {
  const session = await getSession()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <DumbbellIcon className="size-4" />
          </span>
          Liftly
        </Link>
        <nav aria-label="Cuenta" className="flex items-center gap-1.5">
          <Link
            href="/plans"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Explorar planes
          </Link>
          <ThemeToggle />
          {session?.user ? (
            <>
              <span className="hidden px-1 text-sm text-muted-foreground sm:inline">
                {session.user.name}
              </span>
              <Link
                href="/my-plans"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Mis planes
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ size: "sm" })}
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ListChecksIcon className="size-3.5" />
            Planes de entrenamiento, sesiones y ejercicios
          </span>
          <div className="flex flex-col items-center gap-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Diseña tu plan de gimnasio, sesión a sesión.
            </h1>
            <p className="max-w-xl text-muted-foreground md:text-lg">
              Crea planes con tus propios ejercicios, define series,
              repeticiones o duración, y comparte con la comunidad los que
              quieras. Los demás podrán copiarlos a su cuenta.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={session?.user ? "/plans/create" : "/register"}
              className={buttonVariants({ size: "lg" })}
            >
              <PlusIcon />
              {session?.user ? "Crear un plan" : "Empezar gratis"}
            </Link>
            <Link
              href="/plans"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <GlobeIcon />
              Explorar planes
            </Link>
          </div>

          <div className="grid w-full gap-4 text-left sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-xs"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h2 className="font-medium">{feature.title}</h2>
                <p className="text-sm text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-14 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="flex flex-col gap-2">
                <span className="flex size-8 w-fit items-center justify-center rounded-full border bg-background text-sm font-medium text-muted-foreground">
                  <step.icon className="size-4" />
                </span>
                <h2 className="font-medium">{step.title}</h2>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-4 py-8 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p>
          Liftly · planes, sesiones y ejercicios de entrenamiento. Sin
          recomendaciones médicas ni promesas de resultados.
        </p>
        <p>Tu plan es privado salvo que decidas publicarlo.</p>
      </footer>
    </div>
  )
}
