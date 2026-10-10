"use server"

import { revalidatePath } from "next/cache"
import { db } from "@workspace/db"
import { newId } from "@workspace/db/ids"
import { getSession } from "@/lib/auth/session"
import { logSetSchema, type LogSetInput } from "@/lib/validations/run"
import { validationResult, type ValidationFailure } from "@/lib/actions/result"

type Result =
  | { ok: true; sessionId?: string }
  | ValidationFailure
  | { ok: false; reason: "unauthenticated" | "not-found" | "forbidden" | "conflict" }

async function currentUser() {
  const session = await getSession()
  return session?.user ?? null
}

async function readOwnWorkoutSession(workoutSessionId: string, userId: string) {
  const workout = await db.orm.public.WorkoutSession.where({ id: workoutSessionId }).first()
  if (!workout) return { workout: null, error: "not-found" as const }
  if (workout.userId !== userId) return { workout: null, error: "forbidden" as const }
  return { workout, error: null }
}

export async function startSession(planSessionId: string): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const planSession = await db.orm.public.PlanSession.where({ id: planSessionId })
    .include("plan")
    .first()
  if (!planSession) return { ok: false, reason: "not-found" }
  const plan = planSession.plan
  if (plan.visibility !== "public" && plan.userId !== user.id) {
    return { ok: false, reason: "forbidden" }
  }

  const open = await db.orm.public.WorkoutSession.where({
    userId: user.id,
    planSessionId,
  })
    .orderBy((workout) => workout.startedAt.desc())
    .all()
  const resumable = open.find((workout) => workout.completedAt === null)
  if (resumable) return { ok: true, sessionId: resumable.id }

  const author = await db.orm.public.User.where({ id: plan.userId })
    .select("name")
    .first()
  const workoutId = newId("workout_session")
  await db.orm.public.WorkoutSession.create({
    id: workoutId,
    userId: user.id,
    planId: plan.id,
    planSessionId: planSession.id,
    planNameSnapshot: plan.name,
    planAuthorNameSnapshot: author?.name ?? "Usuario",
    sessionNameSnapshot: planSession.name,
  })
  return { ok: true, sessionId: workoutId }
}

export async function logSet(input: LogSetInput): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const parsed = logSetSchema.safeParse(input)
  if (!parsed.success) return validationResult(parsed.error)

  const { workout, error } = await readOwnWorkoutSession(
    parsed.data.workoutSessionId,
    user.id
  )
  if (error) return { ok: false, reason: error }
  if (!workout) return { ok: false, reason: "not-found" }
  if (workout.completedAt !== null) return { ok: false, reason: "conflict" }

  const set = parsed.data
  const exercise = await db.orm.public.PlanExercise.where({
    sessionId: workout.planSessionId,
    position: set.exercisePosition,
  }).first()
  if (!exercise) {
    return {
      ok: false,
      reason: "validation",
      errors: { exercisePosition: "Este ejercicio ya no existe en la sesión." },
      messages: ["Este ejercicio ya no existe en la sesión."],
    }
  }
  if (set.setNumber > exercise.sets) {
    return {
      ok: false,
      reason: "validation",
      errors: { setNumber: "Este ejercicio no tiene tantas series." },
      messages: ["Este ejercicio no tiene tantas series."],
    }
  }
  const data = {
    exerciseNameSnapshot: exercise.name,
    muscleGroupSnapshot: exercise.muscleGroup,
    reps: set.skipped ? null : set.reps ?? null,
    durationSec: set.skipped ? null : set.durationSec ?? null,
    weightValue: set.skipped ? null : set.weightValue ?? null,
    weightUnit: set.skipped ? null : set.weightUnit ?? null,
    skipped: set.skipped,
  }

  const existing = await db.orm.public.WorkoutSet.where({
    workoutSessionId: workout.id,
    exercisePosition: set.exercisePosition,
    setNumber: set.setNumber,
  }).first()
  if (existing) {
    await db.orm.public.WorkoutSet.where({ id: existing.id }).update(data)
    return { ok: true }
  }
  try {
    await db.orm.public.WorkoutSet.create({
      id: newId("workout_set"),
      workoutSessionId: workout.id,
      exercisePosition: set.exercisePosition,
      setNumber: set.setNumber,
      ...data,
    })
  } catch {
    return { ok: false, reason: "conflict" }
  }
  return { ok: true }
}

export async function finishSession(workoutSessionId: string): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const { workout, error } = await readOwnWorkoutSession(workoutSessionId, user.id)
  if (error) return { ok: false, reason: error }
  if (!workout) return { ok: false, reason: "not-found" }

  if (workout.completedAt === null) {
    await db.orm.public.WorkoutSession.where({ id: workout.id }).update({
      completedAt: new Date().toISOString(),
    })
  }
  revalidatePath(`/plans/${workout.planId}`)
  return { ok: true }
}

export async function abandonSession(workoutSessionId: string): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const { workout, error } = await readOwnWorkoutSession(workoutSessionId, user.id)
  if (error) return { ok: false, reason: error }
  if (!workout) return { ok: false, reason: "not-found" }
  if (workout.completedAt !== null) return { ok: false, reason: "conflict" }

  await db.orm.public.WorkoutSession.where({ id: workout.id }).delete()
  revalidatePath(`/plans/${workout.planId}`)
  return { ok: true }
}
