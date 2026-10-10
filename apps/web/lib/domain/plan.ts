export const PLAN_LIMITS = {
  maxSessions: 10,
  sets: { min: 1, max: 20, default: 3 },
  reps: { min: 1, max: 100, default: 15 },
  durationMin: { min: 0, default: 1 },
  restMin: { min: 0, default: 3 },
  weight: { min: 0, default: 0 },
  demoUrls: { max: 5, urlMaxLength: 500 },
} as const

export const PLAN_VISIBILITIES = ["private", "public"] as const
export type PlanVisibility = (typeof PLAN_VISIBILITIES)[number]

export const PLAN_STATUSES = ["draft", "published"] as const
export type PlanStatus = (typeof PLAN_STATUSES)[number]

export const WEIGHT_UNITS = ["kg", "lb"] as const
export type WeightUnit = (typeof WEIGHT_UNITS)[number]

export function createDefaultPlanExercise() {
  return {
    name: "",
    muscleGroup: "",
    sets: PLAN_LIMITS.sets.default,
    repsMin: PLAN_LIMITS.reps.default,
    repsMax: PLAN_LIMITS.reps.default,
    durationMin: PLAN_LIMITS.durationMin.default,
    weightValue: PLAN_LIMITS.weight.default,
    weightUnit: "kg" as WeightUnit,
    restMin: PLAN_LIMITS.restMin.default,
    notes: "",
    demoUrls: [""],
  }
}

export function createDefaultPlanSession(index: number) {
  return {
    name: `Sesión ${index}`,
    exercises: [],
  }
}

export type PlanDurationMode = "reps" | "duration"

export type PlanContentExercise = {
  name: string
  muscleGroup: string
  order: number
  sets: number
  repsMin: number | null
  repsMax: number | null
  durationMin: number | null
  weightValue: number | null
  weightUnit: string | null
  restMin: number
  notes: string | null
  demoUrls: readonly string[]
}

export type PlanContentSession = {
  name: string
  position: number
  exercises: PlanContentExercise[]
}

function exercisesMatch(a: PlanContentExercise, b: PlanContentExercise) {
  return (
    a.name === b.name &&
    a.muscleGroup === b.muscleGroup &&
    a.order === b.order &&
    a.sets === b.sets &&
    a.repsMin === b.repsMin &&
    a.repsMax === b.repsMax &&
    a.durationMin === b.durationMin &&
    a.weightValue === b.weightValue &&
    a.weightUnit === b.weightUnit &&
    a.restMin === b.restMin &&
    a.notes === b.notes &&
    a.demoUrls.length === b.demoUrls.length &&
    a.demoUrls.every((url, index) => url === b.demoUrls[index])
  )
}

export function planContentsMatch(
  a: PlanContentSession[],
  b: PlanContentSession[]
) {
  if (a.length !== b.length) return false
  return a.every((session, index) => {
    const other = b[index]
    if (!other) return false
    if (session.name !== other.name || session.position !== other.position) {
      return false
    }
    if (session.exercises.length !== other.exercises.length) return false
    return session.exercises.every((exercise, exerciseIndex) => {
      const candidate = other.exercises[exerciseIndex]
      return candidate ? exercisesMatch(exercise, candidate) : false
    })
  })
}
