import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, CheckCircle2Icon, LogInIcon } from "lucide-react"
import { buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { getSession } from "@/lib/auth/session"
import {
  getRunState,
  type RunState,
  type WorkoutExecution,
} from "@/lib/data/run"
import { formatClock } from "@/lib/domain/run"
import { ExecutionCard } from "@/components/run/execution-card"
import { SessionRunner } from "@/components/run/session-runner"

export const metadata: Metadata = {
  title: "Ejecutar sesión",
  description: "Registra tus series mientras ejecutas una sesión de Liftly.",
}

type Params = Promise<{ workoutSessionId: string }>
type SearchParams = Promise<{ exercise?: string }>

function toExecution(state: RunState, completedAt: string): WorkoutExecution {
  return {
    id: state.workoutSessionId,
    planSessionId: state.planSessionId,
    sessionName: state.sessionName,
    startedAt: state.startedAt,
    completedAt,
    durationSec: Math.max(
      0,
      Math.floor(
        (new Date(completedAt).getTime() -
          new Date(state.startedAt).getTime()) /
          1000
      )
    ),
    sets: state.logged.map((set) => {
      const exercise = state.exercises.find(
        (candidate) => candidate.position === set.exercisePosition
      )
      return {
        ...set,
        exerciseName: exercise?.name ?? "Ejercicio eliminado",
        muscleGroup: exercise?.muscleGroup ?? "",
      }
    }),
  }
}

export default async function RunPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { workoutSessionId } = await params
  const { exercise } = await searchParams
  const session = await getSession()

  if (!session?.user?.id) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LogInIcon className="size-6" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            Inicia sesión para ejecutar
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Guardamos tus series y tiempos en tu cuenta para que puedas ver tu
            histórico y retomar la sesión más tarde.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/login" className={buttonVariants()}>
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "outline" })}
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    )
  }

  const state = await getRunState(workoutSessionId, session.user.id)
  if (!state) notFound()

  const rawPosition = Number(exercise)
  const initialPosition =
    Number.isInteger(rawPosition) &&
    state.exercises.some((candidate) => candidate.position === rawPosition)
      ? rawPosition
      : null

  const backHref = `/plans/${state.planId}`

  if (state.completedAt) {
    const execution = toExecution(state, state.completedAt)
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Link
          href={backHref}
          className={`w-fit ${buttonVariants({ variant: "ghost", size: "sm" })} -ml-2.5`}
        >
          <ArrowLeftIcon />
          Volver al plan
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2Icon
              className="size-10 text-primary"
              aria-hidden="true"
            />
            <h1 className="text-xl font-semibold tracking-tight">
              Sesión completada
            </h1>
            <p className="text-sm text-muted-foreground">
              {state.planName} · {state.sessionName}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatClock(execution.durationSec)} · {execution.sets.length}{" "}
              series registradas
            </p>
          </CardContent>
        </Card>
        <ol className="flex flex-col gap-2">
          <ExecutionCard execution={execution} history={state.history} />
        </ol>
      </div>
    )
  }

  return <SessionRunner state={state} initialPosition={initialPosition} />
}
