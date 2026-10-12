import type { Metadata } from "next"
import Link from "next/link"
import {
  ActivityIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  CopyIcon,
  DumbbellIcon,
  GlobeIcon,
  HeartIcon,
  ListChecksIcon,
  LockIcon,
  PlusIcon,
  Rows3Icon,
  TimerIcon,
} from "lucide-react"
import { buttonVariants } from "@workspace/ui/components/button"
import { getSession } from "@/lib/auth/session"
import { getPublishedWorkouts } from "@/lib/data/workouts"
import { WorkoutCard } from "@/components/workouts/workout-card"
import { PlanPreview } from "@/components/home/plan-preview"
import { ThemeToggle } from "@/components/theme-toggle"
import { site, absoluteUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: { absolute: "Liftly · Crea y comparte planes de entrenamiento" },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "Liftly · Crea y comparte planes de entrenamiento",
    description: site.description,
  },
}

const FEATURES = [
  {
    icon: Rows3Icon,
    title: "Plan por sesiones",
    body: "Divide tu plan en sesiones nombradas y ordénalas. En cada ejercicio defines series, repeticiones o duración, peso y descanso.",
  },
  {
    icon: ActivityIcon,
    title: "Ejecuta y registra",
    body: "Sigue tus sesiones desde el móvil, marca cada serie y consulta el historial de lo que ya has entrenado.",
  },
  {
    icon: TimerIcon,
    title: "Temporizador de descanso",
    body: "Cuenta atrás integrada para cada descanso, con avisos claros para no perder el ritmo entre series.",
  },
  {
    icon: LockIcon,
    title: "Privado o público",
    body: "Tu plan empieza privado. Cuando lo publicas aparece en Explorar y cualquiera con cuenta puede darle corazón.",
  },
  {
    icon: CopyIcon,
    title: "Copia planes ajenos",
    body: "Guarda en Mis planes cualquier plan público. La copia es tuya e independiente y siempre atribuimos al autor original.",
  },
  {
    icon: BadgeCheckIcon,
    title: "Sin promesas médicas",
    body: "Liftly organiza tu entrenamiento. No inventamos progresiones, diagnósticos ni planes médicos: tú decides qué haces.",
  },
] as const

const STEPS = [
  {
    icon: PlusIcon,
    title: "Diseña",
    body: "Crea el plan, añade sesiones y escribe a mano los ejercicios que vas a hacer.",
  },
  {
    icon: GlobeIcon,
    title: "Comparte",
    body: "Publícalo para la comunidad o mantenlo privado. Despublicar lo oculta al instante.",
  },
  {
    icon: HeartIcon,
    title: "Reutiliza",
    body: "Da corazón a los que te gusten y cópialos para adaptarlos a tu entrenamiento.",
  },
] as const

const HIGHLIGHTS = [
  "Sesiones ordenadas",
  "Series, peso y descanso",
  "Copia con atribución",
] as const

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: site.name,
  url: site.url,
  description: site.description,
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  inLanguage: "es",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
}

export default async function Page() {
  const session = await getSession()
  const featured = await getPublishedWorkouts(session?.user?.id, "popular")
  const plans = featured.slice(0, 3)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        suppressHydrationWarning
      />

      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-sm font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <DumbbellIcon className="size-4" />
            </span>
            {site.name}
          </Link>
          <nav aria-label="Cuenta" className="flex items-center gap-1.5">
            <Link
              href="/plans"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <span className="hidden sm:inline">Explorar planes</span>
              <span className="sm:hidden">Explorar</span>
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
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[-14rem] size-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -right-24 top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                <ListChecksIcon className="size-3.5 text-primary" />
                Planes de entrenamiento, sesiones y ejercicios
              </span>

              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-[3.25rem]">
                Diseña tu plan de gimnasio,{" "}
                <span className="text-primary">sesión a sesión</span>.
              </h1>

              <p className="max-w-xl text-lg text-muted-foreground">
                Crea planes con tus propios ejercicios, define series,
                repeticiones o duración, y comparte con la comunidad los que
                quieras. Los demás podrán copiarlos a su cuenta.
              </p>

              <div className="flex flex-wrap items-center gap-3">
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
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>

              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground">
                {HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <BadgeCheckIcon className="size-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <PlanPreview />
          </div>
        </section>

        {plans.length > 0 ? (
          <section
            aria-labelledby="planes-comunidad"
            className="border-y bg-muted/30"
          >
            <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex max-w-xl flex-col gap-2">
                  <h2
                    id="planes-comunidad"
                    className="text-2xl font-semibold tracking-tight md:text-3xl"
                  >
                    Planes de la comunidad
                  </h2>
                  <p className="text-muted-foreground">
                    Descubre lo que otros ya están entrenando. Dale corazón o
                    cópialo a tu cuenta en un clic.
                  </p>
                </div>
                <Link
                  href="/plans"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Ver todos
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    currentUserId={session?.user?.id}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section
          aria-labelledby="caracteristicas"
          className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24"
        >
          <div className="flex max-w-2xl flex-col gap-2">
            <h2
              id="caracteristicas"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              Todo lo que necesitas para organizar tu entrenamiento
            </h2>
            <p className="text-muted-foreground">
              Escribe tus planes a mano, ejecútalos y compártelos. Sin recetas
              mágicas ni promesas de resultados.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="como-funciona"
          className="border-t bg-muted/30"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="flex max-w-2xl flex-col gap-2">
              <h2
                id="como-funciona"
                className="text-2xl font-semibold tracking-tight md:text-3xl"
              >
                Cómo funciona
              </h2>
              <p className="text-muted-foreground">
                De la idea al entrenamiento en tres pasos.
              </p>
            </div>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="relative flex flex-col gap-3 rounded-2xl border bg-card p-6"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </span>
                  <h3 className="font-medium">
                    <span className="text-muted-foreground">{index + 1} ·</span>{" "}
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary to-primary/70 px-6 py-14 text-center text-primary-foreground sm:px-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl"
            />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                Empieza a entrenar con un plan a tu medida
              </h2>
              <p className="text-primary-foreground/80">
                Crea tu primer plan gratis. Tus datos son tuyos y tu plan es
                privado hasta que decidas publicarlo.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={session?.user ? "/plans/create" : "/register"}
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  {session?.user ? "Crear un plan" : "Empezar gratis"}
                  <ArrowRightIcon className="size-4" />
                </Link>
                <Link
                  href="/plans"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-white/30 px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
                >
                  Explorar planes
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <DumbbellIcon className="size-4" />
              </span>
              {site.name}
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Planes, sesiones y ejercicios de entrenamiento. Sin
              recomendaciones médicas ni promesas de resultados.
            </p>
          </div>

          <nav aria-label="Producto" className="flex flex-col gap-3 text-sm">
            <h2 className="font-medium">Producto</h2>
            <Link
              href="/plans"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Explorar planes
            </Link>
            <Link
              href="/plans/create"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Crear plan
            </Link>
            <Link
              href="/my-plans"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Mis planes
            </Link>
          </nav>

          <nav aria-label="Cuenta" className="flex flex-col gap-3 text-sm">
            <h2 className="font-medium">Cuenta</h2>
            {session?.user ? (
              <Link
                href={`/profile/${session.user.id}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Mi perfil
              </Link>
            ) : (
              <Link
                href="/register"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Crear cuenta
              </Link>
            )}
            <Link
              href="/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Iniciar sesión
            </Link>
            <a
              href={absoluteUrl("/sitemap.xml")}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Mapa del sitio
            </a>
          </nav>
        </div>

        <div className="border-t">
          <p className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
            Liftly · Tu plan es privado salvo que decidas publicarlo.
          </p>
        </div>
      </footer>
    </div>
  )
}
