export const RUN_LIMITS = {
  durationSec: { min: 0, max: 12 * 60 * 60 },
  restSkipSec: 30,
  exercisePosition: { min: 0, max: 999 },
} as const

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export type RunCursor = {
  exerciseIndex: number
  setNumber: number
}

type RunExerciseLike = { position?: number; sets: number }
type LoggedSetLike = { exercisePosition: number; setNumber: number }

function positionOf(exercise: RunExerciseLike, index: number): number {
  return exercise.position ?? index
}

function loggedKeys(logged: readonly LoggedSetLike[]): Set<string> {
  return new Set(logged.map((set) => `${set.exercisePosition}:${set.setNumber}`))
}

function firstHole(
  exercises: readonly RunExerciseLike[],
  done: ReadonlySet<string>
): RunCursor | null {
  for (const [exerciseIndex, exercise] of exercises.entries()) {
    const position = positionOf(exercise, exerciseIndex)
    for (let setNumber = 1; setNumber <= exercise.sets; setNumber++) {
      if (!done.has(`${position}:${setNumber}`)) {
        return { exerciseIndex, setNumber }
      }
    }
  }
  return null
}

export function findRunPosition(
  exercises: readonly RunExerciseLike[],
  logged: readonly LoggedSetLike[]
): RunCursor | null {
  return firstHole(exercises, loggedKeys(logged))
}

/**
 * Cursor del runner. `activePosition` permite elegir un ejercicio concreto (el
 * orden de ejecución no es el del plan) y `activeSet` una serie concreta de ese
 * ejercicio, ya esté registrada o no (así se puede volver atrás para editar).
 * Sin `activePosition`, `activeSet` se ignora. Si el ejercicio activo no existe
 * o ya no tiene series pendientes, se vuelve al primer hueco en orden.
 */
export function findExerciseCursor(
  exercises: readonly RunExerciseLike[],
  logged: readonly LoggedSetLike[],
  activePosition: number | null,
  activeSet: number | null = null
): RunCursor | null {
  const done = loggedKeys(logged)
  if (activePosition != null) {
    const exerciseIndex = exercises.findIndex(
      (exercise, index) => positionOf(exercise, index) === activePosition
    )
    const exercise = exercises[exerciseIndex]
    if (exercise !== undefined) {
      if (activeSet != null && exercise.sets >= 1) {
        return {
          exerciseIndex,
          setNumber: Math.min(Math.max(activeSet, 1), exercise.sets),
        }
      }
      for (let setNumber = 1; setNumber <= exercise.sets; setNumber++) {
        if (!done.has(`${activePosition}:${setNumber}`)) {
          return { exerciseIndex, setNumber }
        }
      }
    }
  }
  return firstHole(exercises, done)
}

export type HistoryEntry = {
  reps: number | null
  durationSec: number | null
  weightValue: number | null
  weightUnit: string | null
  loggedAt: string
}

export function historyKey(name: string): string {
  return name.trim().toLowerCase()
}

type HistoryRow = {
  exerciseNameSnapshot: string
  reps: number | null
  durationSec: number | null
  weightValue: number | null
  weightUnit: string | null
  skipped: boolean
  createdAt: string
}

/**
 * Último registro por ejercicio (filas ordenadas de más reciente a más
 * antiguo): la primera aparición de cada nombre normalizado gana. Ignora
 * series omitidas y registros sin datos útiles.
 */
export function buildHistoryMap(rows: readonly HistoryRow[]): Record<string, HistoryEntry> {
  const map: Record<string, HistoryEntry> = {}
  for (const row of rows) {
    if (row.skipped) continue
    if (row.reps == null && row.durationSec == null && row.weightValue == null) continue
    const key = historyKey(row.exerciseNameSnapshot)
    if (key === "" || key in map) continue
    map[key] = {
      reps: row.reps,
      durationSec: row.durationSec,
      weightValue: row.weightValue,
      weightUnit: row.weightUnit,
      loggedAt: row.createdAt,
    }
  }
  return map
}

export function formatHistoryReference(entry: HistoryEntry): string {
  const date = new Date(entry.loggedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
  return `${formatHistorySummary(entry) ?? "—"} · ${date}`
}

/**
 * Peso, reps o duración del registro, sin la fecha. Ej.: `60 kg × 8`,
 * `12 reps` o `00:45`.
 */
export function formatHistorySummary(entry: HistoryEntry): string | null {
  const parts: string[] = []
  if (entry.weightValue != null) {
    parts.push(`${entry.weightValue} ${entry.weightUnit ?? "kg"}`)
  }
  if (entry.reps != null) {
    parts.push(entry.weightValue != null ? `${entry.reps}` : `${entry.reps} reps`)
  } else if (entry.durationSec != null) {
    parts.push(formatClock(entry.durationSec))
  }
  return parts.length > 0 ? parts.join(" × ") : null
}

function startOfDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
}

const DAY_MS = 24 * 60 * 60 * 1000

export function isToday(iso: string, now: Date = new Date()): boolean {
  return startOfDay(new Date(iso)) === startOfDay(now)
}

/**
 * Fecha relativa en español: `hoy`, `ayer`, `hace 3 días`, `hace 2 semanas`,
 * `hace 4 meses`, `hace 1 año`.
 */
export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY_MS)
  if (days <= 0) return "hoy"
  if (days === 1) return "ayer"
  if (days < 7) return `hace ${days} días`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? "hace 1 semana" : `hace ${weeks} semanas`
  }
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? "hace 1 mes" : `hace ${months} meses`
  }
  const years = Math.floor(days / 365)
  return years === 1 ? "hace 1 año" : `hace ${years} años`
}

export type ExerciseProgress = {
  exerciseIndex: number
  position: number
  sets: number
  done: number
  pending: number
}

export function exerciseProgress(
  exercises: readonly RunExerciseLike[],
  logged: readonly LoggedSetLike[]
): ExerciseProgress[] {
  const done = loggedKeys(logged)
  return exercises.map((exercise, index) => {
    const position = positionOf(exercise, index)
    let doneCount = 0
    for (let setNumber = 1; setNumber <= exercise.sets; setNumber++) {
      if (done.has(`${position}:${setNumber}`)) doneCount += 1
    }
    return {
      exerciseIndex: index,
      position,
      sets: exercise.sets,
      done: doneCount,
      pending: exercise.sets - doneCount,
    }
  })
}

export function countSetsDone(
  exercises: readonly RunExerciseLike[],
  logged: readonly LoggedSetLike[]
): number {
  return logged.filter((set) => {
    const index = exercises.findIndex(
      (exercise, exerciseIndex) => positionOf(exercise, exerciseIndex) === set.exercisePosition
    )
    const exercise = exercises[index]
    return exercise !== undefined && set.setNumber >= 1 && set.setNumber <= exercise.sets
  }).length
}
