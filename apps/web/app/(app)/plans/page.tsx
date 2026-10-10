import type { Metadata } from "next"
import Link from "next/link"
import { CompassIcon, PlusIcon } from "lucide-react"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { getSession } from "@/lib/auth/session"
import { getPublishedWorkouts } from "@/lib/data/workouts"
import { WorkoutCard } from "@/components/workouts/workout-card"

export const metadata: Metadata = {
  title: "Explorar planes",
  description:
    "Descubre los planes de la comunidad de Liftly, dales corazón y cópialos a tu cuenta.",
}

const SORTS = [
  { value: "recent", label: "Más recientes" },
  { value: "popular", label: "Más populares" },
] as const

type SearchParams = Promise<{ sort?: string }>

export default async function PlansPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { sort } = await searchParams
  const currentSort = sort === "popular" ? "popular" : "recent"
  const session = await getSession()
  const currentUserId = session?.user?.id

  const workouts = await getPublishedWorkouts(currentUserId, currentSort)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Explorar planes
          </h1>
          <p className="text-muted-foreground">
            {workouts.length > 0
              ? `${workouts.length} ${workouts.length === 1 ? "plan publicado" : "planes publicados"} por la comunidad.`
              : "Planes publicados por la comunidad."}
          </p>
        </div>
        {currentUserId ? (
          <Link
            href="/plans/create"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <PlusIcon />
            Crear plan
          </Link>
        ) : null}
      </div>

      {!currentUserId ? (
        <Alert>
          <AlertTitle>Modo invitado</AlertTitle>
          <AlertDescription>
            Puedes ver los planes que la comunidad publicó. Inicia sesión para
            darles corazón, copiarlos a tu cuenta y crear los tuyos.
          </AlertDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Crear cuenta
            </Link>
          </div>
        </Alert>
      ) : null}

      <nav
        aria-label="Ordenar planes"
        className="flex w-fit gap-1 rounded-full border bg-muted/40 p-1 text-sm font-medium"
      >
        {SORTS.map((option) => {
          const active = currentSort === option.value
          return (
            <Link
              key={option.value}
              href={
                option.value === "recent" ? "/plans" : "/plans?sort=popular"
              }
              aria-current={active ? "page" : undefined}
              className={
                "rounded-full px-3.5 py-1.5 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none" +
                (active
                  ? " bg-background text-foreground shadow-xs"
                  : " text-muted-foreground hover:text-foreground")
              }
            >
              {option.label}
            </Link>
          )
        })}
      </nav>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CompassIcon className="size-6" />
          </span>
          <p className="font-medium">Todavía no hay planes publicados</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Sé la primera persona de la comunidad en compartir un plan: crea el
            tuyo y publícalo desde «Mis planes».
          </p>
          {currentUserId ? (
            <Link
              href="/plans/create"
              className={buttonVariants({ size: "sm" })}
            >
              <PlusIcon />
              Crear plan
            </Link>
          ) : (
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Iniciar sesión para crear uno
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
