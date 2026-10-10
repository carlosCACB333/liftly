"use server"

import { revalidatePath } from "next/cache"
import { db } from "@workspace/db"
import { newId } from "@workspace/db/ids"
import { getSession } from "@/lib/auth/session"
import { workoutSchema, type PlanInput, type WorkoutInput } from "@/lib/validations/workout"
import { validationResult, type ValidationFailure } from "@/lib/actions/result"

type Result =
  | { ok: true; planId?: string; visibility?: string }
  | ValidationFailure
  | { ok: false; reason: "unauthenticated" | "not-found" | "forbidden" | "conflict" }

const revalidatePlans = (planId?: string) => {
  revalidatePath("/plans")
  revalidatePath("/my-plans")
  if (planId) revalidatePath(`/plans/${planId}`)
}

async function currentUser() {
  const session = await getSession()
  return session?.user ?? null
}

async function createExerciseRows(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  sessionId: string,
  exercises: PlanInput["sessions"][number]["exercises"],
) {
  for (const [exerciseIndex, exercise] of exercises.entries()) {
    await tx.orm.public.PlanExercise.create({
      id: newId("plan_exercise"),
      sessionId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      position: exerciseIndex,
      sets: exercise.sets,
      repsMin: exercise.repsMin ?? null,
      repsMax: exercise.repsMax ?? null,
      durationMin: exercise.durationMin ?? null,
      weightValue: exercise.weightValue ?? null,
      weightUnit: exercise.weightUnit ?? null,
      restMin: exercise.restMin ?? 4,
      notes: exercise.notes || null,
      demoUrls: exercise.demoUrls,
    })
  }
}

async function createSessionRow(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  planId: string,
  session: PlanInput["sessions"][number],
  position: number,
) {
  const sessionId = newId("plan_session")
  await tx.orm.public.PlanSession.create({ id: sessionId, planId, name: session.name, position })
  await createExerciseRows(tx, sessionId, session.exercises)
}

async function createSessions(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  planId: string,
  sessions: PlanInput["sessions"],
) {
  for (const [sessionIndex, session] of sessions.entries()) {
    await createSessionRow(tx, planId, session, sessionIndex)
  }
}

async function readPlanSessions(planId: string) {
  return db.orm.public.PlanSession.where({ planId })
    .include("exercises")
    .orderBy((session) => session.position.asc())
    .all()
}

type PlanSessionRows = Awaited<ReturnType<typeof readPlanSessions>>

async function clonePlanSessions(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  sessions: PlanSessionRows,
  planId: string,
) {
  for (const session of sessions) {
    const sessionId = newId("plan_session")
    await tx.orm.public.PlanSession.create({
      id: sessionId,
      planId,
      name: session.name,
      position: session.position,
    })
    for (const exercise of session.exercises) {
      await tx.orm.public.PlanExercise.create({
        id: newId("plan_exercise"),
        sessionId,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        position: exercise.position,
        sets: exercise.sets,
        repsMin: exercise.repsMin,
        repsMax: exercise.repsMax,
        durationMin: exercise.durationMin,
        weightValue: exercise.weightValue,
        weightUnit: exercise.weightUnit,
        restMin: exercise.restMin,
        notes: exercise.notes,
        demoUrls: [...exercise.demoUrls],
      })
    }
  }
}

export async function createPlan(input: WorkoutInput): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const parsed = workoutSchema.safeParse(input)
  if (!parsed.success) return validationResult(parsed.error)

  const planId = newId("plan")
  await db.transaction(async (tx) => {
    await tx.orm.public.TrainingPlan.create({
      id: planId,
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      visibility: parsed.data.visibility,
      status: parsed.data.visibility === "public" ? "published" : "draft",
    })
    await createSessions(tx, planId, parsed.data.sessions)
  })

  revalidatePlans()
  return { ok: true, planId, visibility: parsed.data.visibility }
}

export async function updatePlan(planId: string, input: WorkoutInput): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const parsed = workoutSchema.safeParse(input)
  if (!parsed.success) return validationResult(parsed.error)

  const plan = await db.orm.public.TrainingPlan.where({ id: planId }).select("id", "userId").first()
  if (!plan) return { ok: false, reason: "not-found" }
  if (plan.userId !== user.id) return { ok: false, reason: "forbidden" }

  await db.transaction(async (tx) => {
    await tx.orm.public.TrainingPlan.where({ id: planId }).update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      visibility: parsed.data.visibility,
      status: parsed.data.visibility === "public" ? "published" : "draft",
    })
    const existing = await tx.orm.public.PlanSession.where({ planId }).select("id").all()
    const existingIds = new Set(existing.map((row) => row.id))
    const keptIds = new Set<string>()
    for (const [position, session] of parsed.data.sessions.entries()) {
      const sessionId =
        session.sessionId && existingIds.has(session.sessionId) ? session.sessionId : null
      if (sessionId) {
        keptIds.add(sessionId)
        await tx.orm.public.PlanSession.where({ id: sessionId, planId }).update({
          name: session.name,
          position,
        })
        await tx.orm.public.PlanExercise.where({ sessionId }).deleteAll()
        await createExerciseRows(tx, sessionId, session.exercises)
        continue
      }
      await createSessionRow(tx, planId, session, position)
    }
    for (const row of existing) {
      if (!keptIds.has(row.id)) {
        await tx.orm.public.PlanSession.where({ id: row.id, planId }).delete()
      }
    }
  })

  revalidatePlans(planId)
  return { ok: true, planId, visibility: parsed.data.visibility }
}

export async function deletePlan(planId: string): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const plan = await db.orm.public.TrainingPlan.where({ id: planId }).select("id", "userId").first()
  if (!plan) return { ok: false, reason: "not-found" }
  if (plan.userId !== user.id) return { ok: false, reason: "forbidden" }
  await db.orm.public.TrainingPlan.where({ id: planId }).delete()
  revalidatePlans(planId)
  return { ok: true }
}

export async function togglePlanVisibility(planId: string): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const plan = await db.orm.public.TrainingPlan.where({ id: planId })
    .select("id", "userId", "visibility")
    .first()
  if (!plan) return { ok: false, reason: "not-found" }
  if (plan.userId !== user.id) return { ok: false, reason: "forbidden" }
  const visibility = plan.visibility === "public" ? "private" : "public"
  await db.orm.public.TrainingPlan.where({ id: planId }).update({
    visibility,
    status: visibility === "public" ? "published" : "draft",
  })
  revalidatePlans(planId)
  return { ok: true, planId, visibility }
}

export async function togglePlanLike(planId: string): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const plan = await db.orm.public.TrainingPlan.where({ id: planId })
    .select("id", "userId", "likeCount", "visibility")
    .first()
  if (!plan) return { ok: false, reason: "not-found" }
  if (plan.visibility !== "public") return { ok: false, reason: "forbidden" }

  await db.transaction(async (tx) => {
    const like = await tx.orm.public.PlanLike.where({ planId, userId: user.id }).first()
    if (like) {
      await tx.orm.public.PlanLike.where({ id: like.id }).delete()
      await tx.orm.public.TrainingPlan.where({ id: planId }).update({ likeCount: Math.max(0, plan.likeCount - 1) })
    } else {
      await tx.orm.public.PlanLike.create({ id: newId("plan_like"), planId, userId: user.id })
      await tx.orm.public.TrainingPlan.where({ id: planId }).update({ likeCount: plan.likeCount + 1 })
    }
  })
  revalidatePlans(planId)
  return { ok: true }
}

export async function copyPlan(planId: string): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const source = await db.orm.public.TrainingPlan.where({ id: planId }).include("user").first()
  if (!source) return { ok: false, reason: "not-found" }
  if (source.visibility !== "public" && source.userId !== user.id) return { ok: false, reason: "forbidden" }

  const sessions = await readPlanSessions(planId)
  const copyId = newId("plan")
  await db.transaction(async (tx) => {
    await tx.orm.public.TrainingPlan.create({
      id: copyId,
      userId: user.id,
      name: source.name,
      description: source.description,
      visibility: "private",
      status: "draft",
      copiedFromPlanId: source.id,
      copiedFromName: source.name,
      copiedFromAuthorName: source.user?.name ?? "Usuario",
    })
    await clonePlanSessions(tx, sessions, copyId)
  })
  revalidatePlans()
  return { ok: true, planId: copyId, visibility: "private" }
}

export async function syncPlanFromSource(planId: string): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const plan = await db.orm.public.TrainingPlan.where({ id: planId })
    .select("id", "userId", "copiedFromPlanId")
    .first()
  if (!plan) return { ok: false, reason: "not-found" }
  if (plan.userId !== user.id) return { ok: false, reason: "forbidden" }
  const sourceId = plan.copiedFromPlanId
  if (!sourceId) return { ok: false, reason: "conflict" }

  const source = await db.orm.public.TrainingPlan.where({ id: sourceId })
    .include("user")
    .first()
  if (!source) return { ok: false, reason: "conflict" }
  if (source.visibility !== "public" && source.userId !== user.id) {
    return { ok: false, reason: "forbidden" }
  }

  const sessions = await readPlanSessions(sourceId)
  await db.transaction(async (tx) => {
    await tx.orm.public.TrainingPlan.where({ id: planId }).update({
      copiedFromName: source.name,
      copiedFromAuthorName: source.user?.name ?? "Usuario",
    })
    const existing = await tx.orm.public.PlanSession.where({ planId })
      .orderBy((session) => session.position.asc())
      .all()
    for (const [index, sourceSession] of sessions.entries()) {
      const kept = existing[index]
      if (kept) {
        await tx.orm.public.PlanSession.where({ id: kept.id, planId }).update({
          name: sourceSession.name,
          position: sourceSession.position,
        })
        await tx.orm.public.PlanExercise.where({ sessionId: kept.id }).deleteAll()
        for (const exercise of sourceSession.exercises) {
          await tx.orm.public.PlanExercise.create({
            id: newId("plan_exercise"),
            sessionId: kept.id,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            position: exercise.position,
            sets: exercise.sets,
            repsMin: exercise.repsMin,
            repsMax: exercise.repsMax,
            durationMin: exercise.durationMin,
            weightValue: exercise.weightValue,
            weightUnit: exercise.weightUnit,
            restMin: exercise.restMin,
            notes: exercise.notes,
            demoUrls: exercise.demoUrls,
          })
        }
      } else {
        await clonePlanSessions(tx, [sourceSession], planId)
      }
    }
    for (const removed of existing.slice(sessions.length)) {
      await tx.orm.public.PlanSession.where({ id: removed.id, planId }).delete()
    }
  })

  revalidatePlans(planId)
  return { ok: true }
}

export async function reorderPlanSessions(planId: string, orderedSessionIds: string[]): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const plan = await db.orm.public.TrainingPlan.where({ id: planId }).select("id", "userId").first()
  if (!plan) return { ok: false, reason: "not-found" }
  if (plan.userId !== user.id) return { ok: false, reason: "forbidden" }

  const sessions = await db.orm.public.PlanSession.where({ planId }).select("id").all()
  if (sessions.length !== orderedSessionIds.length || new Set(orderedSessionIds).size !== sessions.length || sessions.some((session) => !orderedSessionIds.includes(session.id))) {
    return { ok: false, reason: "conflict" }
  }
  await db.transaction(async (tx) => {
    for (const [position, sessionId] of orderedSessionIds.entries()) {
      await tx.orm.public.PlanSession.where({ id: sessionId }).update({ position: position + sessions.length })
    }
    for (const [position, sessionId] of orderedSessionIds.entries()) {
      await tx.orm.public.PlanSession.where({ id: sessionId }).update({ position })
    }
  })
  revalidatePlans(planId)
  return { ok: true }
}

export async function reorderPlanExercises(sessionId: string, orderedExerciseIds: string[]): Promise<Result> {
  const user = await currentUser()
  if (!user) return { ok: false, reason: "unauthenticated" }
  const session = await db.orm.public.PlanSession.where({ id: sessionId }).include("plan").first()
  if (!session) return { ok: false, reason: "not-found" }
  if (session.plan.userId !== user.id) return { ok: false, reason: "forbidden" }

  const exercises = await db.orm.public.PlanExercise.where({ sessionId }).select("id").all()
  if (exercises.length !== orderedExerciseIds.length || new Set(orderedExerciseIds).size !== exercises.length || exercises.some((exercise) => !orderedExerciseIds.includes(exercise.id))) {
    return { ok: false, reason: "conflict" }
  }
  await db.transaction(async (tx) => {
    for (const [position, exerciseId] of orderedExerciseIds.entries()) {
      await tx.orm.public.PlanExercise.where({ id: exerciseId }).update({ position: position + exercises.length })
    }
    for (const [position, exerciseId] of orderedExerciseIds.entries()) {
      await tx.orm.public.PlanExercise.where({ id: exerciseId }).update({ position })
    }
  })
  revalidatePlans(session.planId)
  return { ok: true }
}

// Temporary route-level aliases keep existing URLs/components compatible.
export const createWorkout = createPlan
export const updateWorkout = updatePlan
export const deleteWorkout = deletePlan
export const togglePublish = togglePlanVisibility
export const toggleLike = togglePlanLike
export const joinWorkout = copyPlan
