import type { Metadata } from "next"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { WorkoutForm } from "@/components/workouts/workout-form"

export const metadata: Metadata = {
  title: "Crear plan",
  description: "Crea un plan de entrenamiento con sesiones y ejercicios en Liftly.",
}

export default async function CreatePlanPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Crear plan
        </h1>
        <p className="text-muted-foreground">
          Divide el plan en sesiones y añade tus ejercicios a mano: grupo
          muscular, series, repeticiones o duración, peso y descanso.
        </p>
      </div>
      <WorkoutForm />
    </div>
  )
}
