"use client"

import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  ListOrderedIcon,
  Loader2Icon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
  ShuffleIcon,
  SkipForwardIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { abandonSession, finishSession, logSet } from "@/lib/actions/run"
import type { LoggedSet, RunState } from "@/lib/data/run"
import {
  formatDuration,
  formatRepsRange,
  formatRest,
  muscleGroupLabel,
} from "@/lib/domain/exercise"
import { PLAN_LIMITS, type WeightUnit } from "@/lib/domain/plan"
import {
  countSetsDone,
  exerciseProgress,
  findExerciseCursor,
  formatClock,
  formatHistoryReference,
  historyKey,
} from "@/lib/domain/run"
import { useTimerStore } from "@/lib/timer-store"

const MESSAGES: Record<string, string> = {
  unauthenticated: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
  "not-found": "Esta sesión ya no existe.",
  forbidden: "No tienes permiso sobre esta sesión.",
  conflict: "Esta sesión ya ha terminado. Recarga la página.",
}

function errorMessage(reason: string, fallback: string): string {
  return MESSAGES[reason] ?? fallback
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return
  navigator.vibrate(pattern)
}

function useStopwatch() {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(false)
  const accumulatedRef = useRef(0)
  const sinceRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running || sinceRef.current == null) return
    const startedAt = sinceRef.current
    const id = setInterval(() => {
      setElapsedMs(accumulatedRef.current + (performance.now() - startedAt))
    }, 150)
    return () => clearInterval(id)
  }, [running])

  const start = useCallback(() => {
    if (sinceRef.current != null) return
    sinceRef.current = performance.now()
    setRunning(true)
  }, [])
  const pause = useCallback(() => {
    if (sinceRef.current == null) return
    accumulatedRef.current += performance.now() - sinceRef.current
    sinceRef.current = null
    setElapsedMs(accumulatedRef.current)
    setRunning(false)
  }, [])
  const reset = useCallback(() => {
    accumulatedRef.current = 0
    sinceRef.current = null
    setElapsedMs(0)
    setRunning(false)
  }, [])
  const seek = useCallback((ms: number) => {
    accumulatedRef.current = Math.max(0, ms)
    sinceRef.current = null
    setElapsedMs(Math.max(0, ms))
    setRunning(false)
  }, [])
  return { elapsedMs, running, start, pause, reset, seek }
}

type Props = { state: RunState; initialPosition?: number | null }

export function SessionRunner({ state, initialPosition = null }: Props) {
  const router = useRouter()
  const exercises = state.exercises
  const backHref = `/plans/${state.planId}`

  const [logged, setLogged] = useState<LoggedSet[]>(state.logged)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activePosition, setActivePosition] = useState<number | null>(
    initialPosition
  )
  const [activeSet, setActiveSet] = useState<number | null>(null)
  const [reps, setReps] = useState("")
  const [weight, setWeight] = useState("")
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg")
  const [targetCelebrated, setTargetCelebrated] = useState(false)
  const [saving, startSaving] = useTransition()
  const [ending, startEnding] = useTransition()
  const [startLabel, setStartLabel] = useState<string | null>(null)

  useEffect(() => {
    setStartLabel(
      new Date(state.startedAt).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    )
  }, [state.startedAt])

  const history = state.history

  const cursor = useMemo(
    () => findExerciseCursor(exercises, logged, activePosition, activeSet),
    [exercises, logged, activePosition, activeSet]
  )

  useEffect(() => {
    if (!cursor) return
    const target = exercises[cursor.exerciseIndex]?.position
    if (target != null && target !== activePosition) {
      setActivePosition(target)
    }
  }, [cursor, exercises, activePosition])
  const progressList = useMemo(
    () => exerciseProgress(exercises, logged),
    [exercises, logged]
  )
  const current = cursor ? (exercises[cursor.exerciseIndex] ?? null) : null
  const currentLogged =
    current && cursor
      ? (logged.find(
          (set) =>
            set.exercisePosition === current.position &&
            set.setNumber === cursor.setNumber
        ) ?? null)
      : null
  const historyEntry = current
    ? (history[historyKey(current.name)] ?? null)
    : null
  const doneCount = countSetsDone(exercises, logged)
  const totalCount = exercises.reduce(
    (total, exercise) => total + exercise.sets,
    0
  )
  const timed = current != null && current.durationMin != null
  const targetSec = current?.durationMin != null ? current.durationMin * 60 : 0

  const stopwatch = useStopwatch()

  useEffect(() => {
    if (!current || !cursor) return
    const stored = logged.find(
      (set) =>
        set.exercisePosition === current.position &&
        set.setNumber === cursor.setNumber
    )
    const entry = stored && !stored.skipped ? stored : null
    const prior = historyEntry
    setReps(
      String(
        entry?.reps ??
          prior?.reps ??
          current.repsMin ??
          current.repsMax ??
          PLAN_LIMITS.reps.default
      )
    )
    const weightValue = entry
      ? entry.weightValue
      : prior
        ? prior.weightValue
        : current.weightValue
    setWeight(weightValue != null ? String(weightValue) : "")
    setWeightUnit(
      (entry?.weightUnit ?? prior?.weightUnit ?? current.weightUnit) === "lb"
        ? "lb"
        : "kg"
    )
    if (current.durationMin != null) {
      stopwatch.seek((entry?.durationSec ?? 0) * 1000)
    } else {
      stopwatch.reset()
    }
    setTargetCelebrated(false)
  }, [
    cursor?.exerciseIndex,
    cursor?.setNumber,
    current,
    logged,
    historyEntry,
    stopwatch.reset,
    stopwatch.seek,
  ])

  useEffect(() => {
    if (!timed || targetSec <= 0) return
    if (stopwatch.elapsedMs >= targetSec * 1000 && !targetCelebrated) {
      setTargetCelebrated(true)
      vibrate([300, 100, 300])
    }
  }, [timed, targetSec, stopwatch.elapsedMs, targetCelebrated])

  function dismissSessionRest() {
    if (useTimerStore.getState().source === "rest") {
      useTimerStore.getState().close()
    }
  }

  function goToRelativeExercise(delta: 1 | -1) {
    if (saving || ending || !cursor) return
    const target = exercises[cursor.exerciseIndex + delta]
    if (target) selectExercise(target.position)
  }

  function selectExercise(position: number | null) {
    if (saving || ending) return
    dismissSessionRest()
    setActivePosition(position)
    if (position == null) {
      setActiveSet(null)
    } else {
      const item = progressList.find((entry) => entry.position === position)
      setActiveSet(item && item.pending === 0 ? item.sets : null)
    }
    setPickerOpen(false)
  }

  function goToSet(setNumber: number) {
    if (!current || saving || ending) return
    dismissSessionRest()
    setActivePosition(current.position)
    setActiveSet(Math.min(Math.max(setNumber, 1), current.sets))
  }

  function recordSet(skipped: boolean) {
    if (!current || !cursor || saving || ending) return
    const isTimed = current.durationMin != null
    const parsedWeight = weight.trim() === "" ? null : Number.parseFloat(weight)
    const safeWeight =
      parsedWeight == null || Number.isNaN(parsedWeight) ? null : parsedWeight
    const repsValue = isTimed || skipped ? null : Number.parseInt(reps, 10)
    const payloadUnit: WeightUnit | null =
      skipped || safeWeight == null ? null : weightUnit

    if (
      !skipped &&
      !isTimed &&
      (repsValue == null || !Number.isInteger(repsValue))
    ) {
      toast.error(
        `Indica repeticiones entre ${PLAN_LIMITS.reps.min} y ${PLAN_LIMITS.reps.max}.`
      )
      return
    }
    if (
      !skipped &&
      repsValue != null &&
      (repsValue < PLAN_LIMITS.reps.min || repsValue > PLAN_LIMITS.reps.max)
    ) {
      toast.error(
        `Indica repeticiones entre ${PLAN_LIMITS.reps.min} y ${PLAN_LIMITS.reps.max}.`
      )
      return
    }
    if (safeWeight != null && safeWeight < PLAN_LIMITS.weight.min) {
      toast.error("El peso no puede ser negativo.")
      return
    }

    const entry: LoggedSet = {
      exercisePosition: current.position,
      setNumber: cursor.setNumber,
      reps: repsValue,
      durationSec:
        !skipped && isTimed ? Math.floor(stopwatch.elapsedMs / 1000) : null,
      weightValue: skipped ? null : safeWeight,
      weightUnit: payloadUnit,
      skipped,
    }
    const wasLogged = logged.some(
      (set) =>
        set.exercisePosition === entry.exercisePosition &&
        set.setNumber === entry.setNumber
    )

    startSaving(async () => {
      const result = await logSet({
        workoutSessionId: state.workoutSessionId,
        exercisePosition: entry.exercisePosition,
        setNumber: entry.setNumber,
        reps: entry.reps,
        durationSec: entry.durationSec,
        weightValue: entry.weightValue,
        weightUnit: payloadUnit,
        skipped: entry.skipped,
      })
      if (!result.ok) {
        const message =
          result.reason === "validation"
            ? result.messages.join(" ")
            : errorMessage(result.reason, "No se pudo guardar la serie.")
        toast.error(message)
        return
      }
      const nextLogged = wasLogged
        ? logged.map((set) =>
            set.exercisePosition === entry.exercisePosition &&
            set.setNumber === entry.setNumber
              ? entry
              : set
          )
        : [...logged, entry]
      setLogged(nextLogged)
      if (wasLogged) {
        vibrate([100])
        return
      }
      dismissSessionRest()
      const globalNext = findExerciseCursor(exercises, nextLogged, null)
      if (globalNext == null) {
        setActivePosition(null)
        setActiveSet(null)
        vibrate(skipped ? 80 : [150])
        return
      }
      const nextInExercise = findExerciseCursor(
        exercises,
        nextLogged,
        current.position
      )
      setActivePosition(current.position)
      setActiveSet(null)
      vibrate(skipped ? 80 : [150])
      if (current.restMin > 0) {
        const nextExercise = nextInExercise
          ? (exercises[nextInExercise.exerciseIndex] ?? null)
          : null
        const label = `Siguiente: ${
          nextExercise ? nextExercise.name : "siguiente ejercicio"
        } · serie ${nextInExercise ? nextInExercise.setNumber : 1}`
        useTimerStore.getState().openForRest(current.restMin * 60, label)
      }
    })
  }

  function handleFinish() {
    if (ending) return
    startEnding(async () => {
      const result = await finishSession(state.workoutSessionId)
      if (!result.ok) {
        const message =
          result.reason === "validation"
            ? result.messages.join(" ")
            : errorMessage(result.reason, "No se pudo terminar la sesión.")
        toast.error(message)
        setConfirmOpen(false)
        return
      }
      toast.success("Sesión guardada.")
      setConfirmOpen(false)
      dismissSessionRest()
      router.push(backHref)
    })
  }

  function handleDiscard() {
    if (ending) return
    startEnding(async () => {
      const result = await abandonSession(state.workoutSessionId)
      if (!result.ok) {
        const message =
          result.reason === "validation"
            ? result.messages.join(" ")
            : errorMessage(result.reason, "No se pudo descartar la sesión.")
        toast.error(message)
        setConfirmOpen(false)
        return
      }
      toast.success("Sesión descartada.")
      setConfirmOpen(false)
      dismissSessionRest()
      router.push(backHref)
    })
  }

  function stepReps(direction: 1 | -1) {
    const value = Number.parseInt(reps, 10)
    const base = Number.isInteger(value) ? value : PLAN_LIMITS.reps.default
    setReps(
      String(
        Math.min(
          PLAN_LIMITS.reps.max,
          Math.max(PLAN_LIMITS.reps.min, base + direction)
        )
      )
    )
  }

  function stepWeight(direction: 1 | -1) {
    const step = weightUnit === "lb" ? 5 : 2.5
    const value = Number.parseFloat(weight)
    const base = Number.isFinite(value) ? value : 0
    setWeight(String(Math.max(PLAN_LIMITS.weight.min, base + direction * step)))
  }

  const phaseMessage =
    current && cursor
      ? `Ejercicio ${cursor.exerciseIndex + 1} de ${exercises.length}: ${current.name}, serie ${cursor.setNumber} de ${current.sets}`
      : "Todas las series completadas"

  const progressPct =
    totalCount > 0 ? Math.min(100, (doneCount / totalCount) * 100) : 100

  const timerOpen = useTimerStore((state) => state.open)
  const timerMinimized = useTimerStore((state) => state.minimized)
  const dockPush = timerOpen && timerMinimized ? "bottom-48" : "bottom-0"

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:gap-4">
      <header className="sticky top-14 z-10 flex flex-col gap-2 border-b border-border/70 bg-background/90 pb-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="flex items-center gap-2 pt-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 shrink-0"
            onClick={() => {
              dismissSessionRest()
              router.push(backHref)
            }}
            disabled={saving || ending}
          >
            <ArrowLeftIcon aria-hidden="true" /> Salir
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {state.planName} · {state.planAuthorName}
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
              {state.sessionName}
            </h1>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={ending || saving}
            className="shrink-0"
          >
            Terminar
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-valuenow={doneCount}
            aria-label="Progreso de la sesión"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {doneCount} de {totalCount} series
            </span>
            <span>{startLabel ? `Inicio ${startLabel}` : "\u00A0"}</span>
          </div>
        </div>
      </header>

      <p className="sr-only" aria-live="polite">
        {phaseMessage}
      </p>

      {current && cursor ? (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Ejercicio {cursor.exerciseIndex + 1} de {exercises.length}
                </p>
                <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {current.name}
                </h2>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {muscleGroupLabel(current.muscleGroup)}
              </Badge>
            </div>

            <nav
              className="flex items-center gap-1.5"
              aria-label="Cambiar de ejercicio"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="px-2.5 sm:px-3"
                onClick={() => goToRelativeExercise(-1)}
                disabled={saving || ending || cursor.exerciseIndex === 0}
                aria-label="Ejercicio anterior"
              >
                <ChevronLeftIcon aria-hidden="true" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="px-2.5 sm:px-3"
                onClick={() => goToRelativeExercise(1)}
                disabled={
                  saving ||
                  ending ||
                  cursor.exerciseIndex >= exercises.length - 1
                }
                aria-label="Ejercicio siguiente"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRightIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setPickerOpen(true)}
                disabled={saving || ending}
              >
                <ShuffleIcon aria-hidden="true" /> Cambiar
              </Button>
            </nav>

            <div className="flex flex-col gap-2 rounded-xl border p-3 sm:p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  Serie {cursor.setNumber} de {current.sets}
                </span>
                {currentLogged ? (
                  currentLogged.skipped ? (
                    <Badge variant="outline">Omitida</Badge>
                  ) : (
                    <Badge variant="secondary">Registrada</Badge>
                  )
                ) : (
                  <Badge variant="outline">Pendiente</Badge>
                )}
              </div>
              <ol
                aria-label="Series del ejercicio"
                className="flex flex-wrap items-center gap-2"
              >
                {Array.from(
                  { length: current.sets },
                  (_, index) => index + 1
                ).map((setNumber) => {
                  const entry = logged.find(
                    (set) =>
                      set.exercisePosition === current.position &&
                      set.setNumber === setNumber
                  )
                  const isCurrent = setNumber === cursor.setNumber
                  const stateLabel = entry
                    ? entry.skipped
                      ? "omitida"
                      : "registrada"
                    : "pendiente"
                  return (
                    <li key={setNumber}>
                      <button
                        type="button"
                        onClick={() => goToSet(setNumber)}
                        disabled={saving || ending}
                        aria-current={isCurrent ? "step" : undefined}
                        aria-label={`Serie ${setNumber}, ${stateLabel}${
                          isCurrent ? ", serie actual" : ""
                        }`}
                        className={[
                          "inline-flex size-10 items-center justify-center rounded-full border text-sm font-medium transition-colors disabled:opacity-50 sm:size-9",
                          isCurrent
                            ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                            : entry
                              ? entry.skipped
                                ? "border-border bg-muted text-muted-foreground line-through hover:text-foreground"
                                : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                        ].join(" ")}
                      >
                        {setNumber}
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                Objetivo:{" "}
                {formatRepsRange(current) ??
                  formatDuration(current.durationMin) ??
                  "sin objetivo"}
              </span>
              {formatRest(current.restMin) ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                  Descanso: {formatRest(current.restMin)}
                </span>
              ) : null}
              {historyEntry ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                  Último: {formatHistoryReference(historyEntry)}
                </span>
              ) : null}
            </div>

            {current.notes ? (
              <p className="text-sm text-muted-foreground">{current.notes}</p>
            ) : null}

            {current.demoUrls.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {current.demoUrls.map((url, index) => (
                  <li key={`${url}-${index}`}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      <ExternalLinkIcon
                        className="size-3.5"
                        aria-hidden="true"
                      />
                      Demo {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            {timed ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/30 py-6">
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  Tiempo
                </p>
                <p className="font-mono text-6xl font-semibold tabular-nums">
                  {formatClock(Math.floor(stopwatch.elapsedMs / 1000))}
                </p>
                <p className="text-sm text-muted-foreground">
                  Objetivo: {formatClock(targetSec)}
                  {targetCelebrated ? (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Objetivo cumplido
                    </span>
                  ) : null}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-12 px-5"
                    onClick={() =>
                      stopwatch.running ? stopwatch.pause() : stopwatch.start()
                    }
                    aria-label={
                      stopwatch.running
                        ? "Parar cronómetro"
                        : "Iniciar cronómetro"
                    }
                  >
                    {stopwatch.running ? (
                      <>
                        <PauseIcon aria-hidden="true" /> Parar
                      </>
                    ) : (
                      <>
                        <PlayIcon aria-hidden="true" /> Iniciar
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="h-12 px-5"
                    onClick={stopwatch.reset}
                    aria-label="Reiniciar cronómetro"
                  >
                    <RotateCcwIcon aria-hidden="true" /> Reiniciar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Repeticiones</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRepsRange(current)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-11"
                      onClick={() => stepReps(-1)}
                      aria-label="Restar repetición"
                    >
                      <MinusIcon aria-hidden="true" />
                    </Button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={PLAN_LIMITS.reps.min}
                      max={PLAN_LIMITS.reps.max}
                      value={reps}
                      onChange={(event) => setReps(event.target.value)}
                      aria-label="Repeticiones realizadas"
                      className="h-11 w-20 rounded-lg border bg-background px-2 text-center text-lg font-semibold tabular-nums"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-11"
                      onClick={() => stepReps(1)}
                      aria-label="Sumar repetición"
                    >
                      <PlusIcon aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <span className="text-sm font-medium">Peso</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-11"
                      onClick={() => stepWeight(-1)}
                      aria-label="Restar peso"
                    >
                      <MinusIcon aria-hidden="true" />
                    </Button>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={PLAN_LIMITS.weight.min}
                      step="0.1"
                      value={weight}
                      onChange={(event) => setWeight(event.target.value)}
                      aria-label="Peso utilizado"
                      className="h-11 w-20 rounded-lg border bg-background px-2 text-center text-lg font-semibold tabular-nums"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-11"
                      onClick={() => stepWeight(1)}
                      aria-label="Sumar peso"
                    >
                      <PlusIcon aria-hidden="true" />
                    </Button>
                    <div
                      className="flex overflow-hidden rounded-lg border"
                      role="group"
                      aria-label="Unidad de peso"
                    >
                      {(["kg", "lb"] as const).map((unit) => (
                        <Button
                          key={unit}
                          type="button"
                          variant={weightUnit === unit ? "secondary" : "ghost"}
                          size="lg"
                          className="h-11 px-3"
                          onClick={() => setWeightUnit(unit)}
                          aria-pressed={weightUnit === unit}
                        >
                          {unit}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2Icon
                className="size-7 text-primary"
                aria-hidden="true"
              />
            </span>
            <h2 className="text-xl font-semibold">
              {exercises.length === 0
                ? "Esta sesión no tiene ejercicios"
                : "Sin series pendientes"}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {exercises.length === 0
                ? "El plan cambió desde que empezaste. Termina la sesión para guardar el registro."
                : `Has registrado ${doneCount} ${doneCount === 1 ? "serie" : "series"}. Termina la sesión para guardar el histórico.`}
            </p>
            {exercises.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12"
                onClick={() => setPickerOpen(true)}
                disabled={ending}
              >
                <ShuffleIcon aria-hidden="true" /> Revisar y editar
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {timerOpen && !timerMinimized ? null : (
        <div
          className={`sticky z-10 flex w-full flex-col border-t border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 ${dockPush} pb-[env(safe-area-inset-bottom)]`}
        >
          {current && cursor ? (
            <div className="flex w-full items-stretch gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 flex-1"
                onClick={() => recordSet(true)}
                disabled={saving || ending || currentLogged?.skipped === true}
              >
                <SkipForwardIcon aria-hidden="true" /> Omitir
              </Button>
              <Button
                type="button"
                size="lg"
                className="h-12 flex-[1.6]"
                onClick={() => recordSet(false)}
                disabled={saving || ending}
              >
                {saving ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : (
                  <CheckIcon aria-hidden="true" />
                )}
                {currentLogged ? "Guardar cambios" : "Completar serie"}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="lg"
              className="h-12 w-full"
              onClick={() => setConfirmOpen(true)}
              disabled={ending}
            >
              Terminar sesión
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elige el ejercicio</AlertDialogTitle>
            <AlertDialogDescription>
              Cambia el orden, vuelve a un ejercicio hecho para editarlo o
              continúa con el siguiente pendiente. Tus series registradas se
              conservan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-72 overflow-y-auto">
            <Button
              type="button"
              variant={activePosition == null ? "secondary" : "ghost"}
              className="w-full justify-between"
              onClick={() => selectExercise(null)}
            >
              <span className="flex items-center gap-2">
                <ListOrderedIcon aria-hidden="true" />
                Siguiente pendiente (en orden)
              </span>
              {activePosition == null ? (
                <CheckIcon className="text-primary" aria-hidden="true" />
              ) : null}
            </Button>
            <ul className="mt-1 flex flex-col gap-1">
              {progressList.map((item) => {
                const isActive = item.position === activePosition
                return (
                  <li key={item.position}>
                    <Button
                      type="button"
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-between"
                      onClick={() => selectExercise(item.position)}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {item.exerciseIndex + 1}
                        </span>
                        <span className="truncate">
                          {exercises[item.exerciseIndex]?.name ?? "Ejercicio"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                        {item.pending === 0 ? (
                          <>
                            <CheckIcon
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Completo
                          </>
                        ) : (
                          `${item.done}/${item.sets} series`
                        )}
                      </span>
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving || ending}>
              Cerrar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Terminar la sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Se guardará tu registro y no podrás seguir añadiendo series.
              También puedes descartarla para borrar lo que has registrado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel disabled={ending}>
              Seguir entrenando
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
              disabled={ending}
            >
              {ending ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <XIcon aria-hidden="true" />
              )}
              Descartar
            </Button>
            <Button type="button" onClick={handleFinish} disabled={ending}>
              {ending ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <CheckIcon aria-hidden="true" />
              )}
              Terminar sesión
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
