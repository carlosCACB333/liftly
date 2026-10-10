import { db } from "@workspace/db"
import { buildHistoryMap, type HistoryEntry } from "@/lib/domain/run"

const PlanExercise = db.orm.public.PlanExercise
const WorkoutSession = db.orm.public.WorkoutSession
const WorkoutSet = db.orm.public.WorkoutSet

const HISTORY_SESSION_LIMIT = 20

export type RunExercise = {
  position: number
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

export type LoggedSet = {
  exercisePosition: number
  setNumber: number
  reps: number | null
  durationSec: number | null
  weightValue: number | null
  weightUnit: string | null
  skipped: boolean
}

export type RunState = {
  workoutSessionId: string
  planId: string
  planSessionId: string
  planName: string
  planAuthorName: string
  sessionName: string
  startedAt: string
  completedAt: string | null
  exercises: RunExercise[]
  logged: LoggedSet[]
  /** Último registro por nombre de ejercicio (normalizado), del historial del usuario. */
  history: Record<string, HistoryEntry>
}

function sortSets(a: LoggedSet, b: LoggedSet) {
  return a.exercisePosition - b.exercisePosition || a.setNumber - b.setNumber
}

/**
 * Último registro por nombre de ejercicio (normalizado) del historial reciente
 * del usuario. Es la misma referencia que usa el autocompletado del runner.
 */
export async function getUserExerciseHistory(
  userId: string
): Promise<Record<string, HistoryEntry>> {
  const recentSessions = await WorkoutSession.where({ userId })
    .orderBy((row) => row.startedAt.desc())
    .limit(HISTORY_SESSION_LIMIT)
    .all()
  const recentIds = recentSessions.map((row) => row.id)
  const historyRows = recentIds.length
    ? await WorkoutSet.where((row) => row.workoutSessionId.in(recentIds))
        .orderBy((row) => row.createdAt.desc())
        .all()
    : []
  return buildHistoryMap(historyRows)
}

export async function getRunState(
  workoutSessionId: string,
  userId: string
): Promise<RunState | null> {
  const workout = await WorkoutSession.where({ id: workoutSessionId }).first()
  if (!workout || workout.userId !== userId) return null

  const exerciseRows = await PlanExercise.where({ sessionId: workout.planSessionId })
    .orderBy((exercise) => exercise.position.asc())
    .all()
  const setRows = await WorkoutSet.where({ workoutSessionId }).all()

  const history = await getUserExerciseHistory(userId)

  return {
    workoutSessionId: workout.id,
    planId: workout.planId,
    planSessionId: workout.planSessionId,
    planName: workout.planNameSnapshot,
    planAuthorName: workout.planAuthorNameSnapshot,
    sessionName: workout.sessionNameSnapshot,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt,
    exercises: exerciseRows.map((exercise) => ({
      position: exercise.position,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: exercise.sets,
      repsMin: exercise.repsMin,
      repsMax: exercise.repsMax,
      durationMin: exercise.durationMin,
      weightValue: exercise.weightValue,
      weightUnit: exercise.weightUnit,
      restMin: exercise.restMin,
      notes: exercise.notes,
      demoUrls: [...exercise.demoUrls],
    })),
    logged: setRows
      .map((row) => ({
        exercisePosition: row.exercisePosition,
        setNumber: row.setNumber,
        reps: row.reps,
        durationSec: row.durationSec,
        weightValue: row.weightValue,
        weightUnit: row.weightUnit,
        skipped: row.skipped,
      }))
      .sort(sortSets),
    history,
  }
}

export type ExecutionSet = LoggedSet & {
  exerciseName: string
  muscleGroup: string
}

export type WorkoutExecution = {
  id: string
  planSessionId: string
  sessionName: string
  startedAt: string
  completedAt: string
  durationSec: number
  sets: ExecutionSet[]
}

export type PlanExecutions = {
  executions: WorkoutExecution[]
  openSessionIds: string[]
}

export async function getPlanExecutions(
  planId: string,
  userId: string
): Promise<PlanExecutions> {
  const rows = await WorkoutSession.where({ userId, planId })
    .orderBy((workout) => workout.startedAt.desc())
    .limit(50)
    .all()

  const openSessionIds = rows
    .filter((row) => row.completedAt === null)
    .map((row) => row.id)
  type Row = (typeof rows)[number]
  type CompletedRow = Row & { completedAt: string }
  const completed = rows.filter(
    (row): row is CompletedRow => row.completedAt !== null
  )
  const completedIds = completed.map((row) => row.id)
  const setRows = completedIds.length
    ? await WorkoutSet.where((set) => set.workoutSessionId.in(completedIds)).all()
    : []

  const setsBySession = new Map<string, ExecutionSet[]>()
  for (const row of setRows) {
    const list = setsBySession.get(row.workoutSessionId) ?? []
    list.push({
      exercisePosition: row.exercisePosition,
      setNumber: row.setNumber,
      reps: row.reps,
      durationSec: row.durationSec,
      weightValue: row.weightValue,
      weightUnit: row.weightUnit,
      skipped: row.skipped,
      exerciseName: row.exerciseNameSnapshot,
      muscleGroup: row.muscleGroupSnapshot,
    })
    setsBySession.set(row.workoutSessionId, list)
  }
  for (const list of setsBySession.values()) list.sort(sortSets)

  return {
    openSessionIds,
    executions: completed.map((row) => ({
      id: row.id,
      planSessionId: row.planSessionId,
      sessionName: row.sessionNameSnapshot,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      durationSec: Math.max(
        0,
        Math.floor(
          (new Date(row.completedAt).getTime() - new Date(row.startedAt).getTime()) / 1000
        )
      ),
      sets: setsBySession.get(row.id) ?? [],
    })),
  }
}
