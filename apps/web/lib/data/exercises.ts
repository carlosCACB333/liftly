import { db } from "@workspace/db"

const Plan = db.orm.public.TrainingPlan
const Session = db.orm.public.PlanSession
const Exercise = db.orm.public.PlanExercise

export const EXERCISE_SEARCH_LIMIT = 8

export type ExerciseSuggestion = {
  id: string
  name: string
  muscleGroup: string
  sets: number
  repsMin: number | null
  repsMax: number | null
  durationMin: number | null
  weightValue: number | null
  weightUnit: string | null
  restMin: number
  notes: string | null
  demoUrls: string[]
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

function completeness(exercise: ExerciseSuggestion) {
  let score = 0
  if (exercise.muscleGroup) score += 1
  if (exercise.repsMin != null || exercise.repsMax != null) score += 2
  if (exercise.durationMin != null) score += 2
  if (exercise.weightValue != null) score += 1
  if (exercise.restMin > 0) score += 1
  if (exercise.notes) score += 1
  return score
}

function toSuggestion(row: {
  id: string
  name: string
  muscleGroup: string
  sets: number
  repsMin: number | null
  repsMax: number | null
  durationMin: number | null
  weightValue: number | null
  weightUnit: string | null
  restMin: number
  notes: string | null
  demoUrls: readonly string[]
}): ExerciseSuggestion {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup,
    sets: row.sets,
    repsMin: row.repsMin,
    repsMax: row.repsMax,
    durationMin: row.durationMin,
    weightValue: row.weightValue,
    weightUnit: row.weightUnit,
    restMin: row.restMin,
    notes: row.notes,
    demoUrls: [...row.demoUrls],
  }
}

export async function searchPublicExercises(
  term: string
): Promise<ExerciseSuggestion[]> {
  const trimmed = term.trim()
  if (trimmed.length < 2) return []

  const publicPlans = await Plan.where({ visibility: "public" })
    .select("id")
    .limit(200)
    .all()
  if (publicPlans.length === 0) return []

  const sessionIds = (
    await Session.where((session) =>
      session.planId.in(publicPlans.map((plan) => plan.id))
    )
      .select("id")
      .all()
  ).map((session) => session.id)
  if (sessionIds.length === 0) return []

  const pattern = `%${escapeLikePattern(trimmed)}%`
  const rows = await Exercise.where((exercise) =>
    exercise.sessionId.in(sessionIds)
  )
    .where((exercise) => exercise.name.ilike(pattern))
    .select(
      "id",
      "name",
      "muscleGroup",
      "sets",
      "repsMin",
      "repsMax",
      "durationMin",
      "weightValue",
      "weightUnit",
      "restMin",
      "notes",
      "demoUrls"
    )
    .limit(EXERCISE_SEARCH_LIMIT * 4)
    .all()

  const byName = new Map<string, ExerciseSuggestion>()
  for (const row of rows) {
    const key = row.name.trim().toLowerCase()
    const candidate = toSuggestion(row)
    const existing = byName.get(key)
    if (!existing || completeness(candidate) > completeness(existing)) {
      byName.set(key, candidate)
    }
  }

  return [...byName.values()].slice(0, EXERCISE_SEARCH_LIMIT)
}
