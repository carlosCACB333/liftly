import type { Metadata } from "next"
import { getSession } from "@/lib/auth/session"
import { getWorkoutDetail } from "@/lib/data/workouts"
import { notFound, redirect } from "next/navigation"
import { WorkoutForm } from "@/components/workouts/workout-form"
import { isMuscleGroup } from "@/lib/domain/exercise"
import type { WorkoutInput } from "@/lib/validations/workout"

export const metadata: Metadata = {
  title: "Editar plan",
  description: "Edita las sesiones y ejercicios de tu plan en Liftly.",
}

type Params = Promise<{ id: string }>

function toInput(workout: NonNullable<Awaited<ReturnType<typeof getWorkoutDetail>>>): WorkoutInput {
  const sessions: WorkoutInput["sessions"] = workout.sessions.length
    ? workout.sessions.map((session) => ({
        sessionId: session.id,
        name: session.name,
        exercises: session.exercises.map((item) => ({
          name: item.name,
          muscleGroup: isMuscleGroup(item.muscleGroup)
            ? item.muscleGroup
            : "cuerpo_completo",
          sets: item.sets,
          repsMin: item.repsMin ?? undefined,
          repsMax: item.repsMax ?? undefined,
          durationMin: item.durationMin ?? undefined,
          weightValue: item.weightValue ?? undefined,
          weightUnit: item.weightUnit === "lb" ? "lb" : "kg",
          restMin: item.restMin,
          notes: item.notes ?? "",
          demoUrls: item.demoUrls.length ? item.demoUrls : [""],
        })),
      }))
    : [{ name: "Sesión 1", exercises: [] }]

  return {
    name: workout.name,
    description: workout.description ?? "",
    visibility: workout.isPublished ? "public" : "private",
    status: workout.isPublished ? "published" : "draft",
    sessions,
  }
}

export default async function EditPlanPage({ params }: { params: Params }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const workout = await getWorkoutDetail(id, session.user.id)
  if (!workout) notFound()
  if (workout.author?.id !== session.user.id) redirect("/plans")

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Editar plan
        </h1>
        <p className="text-muted-foreground">
          Actualiza sesiones, ejercicios y parámetros. Los cambios se aplican a
          tu plan; las copias que otros hayan hecho no se modifican.
        </p>
      </div>
      <WorkoutForm planId={workout.id} planName={workout.name} initial={toInput(workout)} />
    </div>
  )
}
