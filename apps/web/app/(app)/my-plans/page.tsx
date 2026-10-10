import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CompassIcon, DumbbellIcon, PlusIcon } from "lucide-react"
import { buttonVariants } from "@workspace/ui/components/button"
import { getSession } from "@/lib/auth/session"
import { getMyWorkouts } from "@/lib/data/workouts"
import { WorkoutCard } from "@/components/workouts/workout-card"
import { OwnerActions } from "@/components/workouts/owner-actions"

export const metadata: Metadata = {
  title: "Mis planes",
  description:
    "Tus planes de Liftly: crea, edita, publica o elimina tus sesiones y ejercicios.",
}

export default async function MyPlansPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const workouts = await getMyWorkouts(session.user.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Mis planes
          </h1>
          <p className="text-muted-foreground">
            Los que publicas aparecen en Explorar. Privados solo los ves tú.
          </p>
        </div>
        <Link href="/plans/create" className={buttonVariants()}>
          <PlusIcon />
          Crear plan
        </Link>
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <DumbbellIcon className="size-6" />
          </span>
          <p className="font-medium">Aún no tienes planes</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Crea uno desde cero con tus sesiones y ejercicios, o copia uno de
            la comunidad y adáptalo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/plans/create" className={buttonVariants({ size: "sm" })}>
              <PlusIcon />
              Crear plan
            </Link>
            <Link
              href="/plans"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <CompassIcon />
              Explorar planes
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              currentUserId={session.user.id}
              dateField="updatedAt"
              showLike={false}
              actions={
                <OwnerActions
                  workoutId={workout.id}
                  planName={workout.name}
                  isPublished={workout.isPublished}
                  editHref={`/plans/${workout.id}/edit`}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
