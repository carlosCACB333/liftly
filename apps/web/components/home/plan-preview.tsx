import {
  DumbbellIcon,
  HeartIcon,
  Repeat2Icon,
  TimerIcon,
} from "lucide-react"
import {
  formatPrescription,
  formatRest,
  formatWeight,
  muscleGroupLabel,
} from "@/lib/domain/exercise"

type PreviewExercise = {
  name: string
  group: string
  sets: number
  repsMin: number
  repsMax: number
  weightValue: number | null
  weightUnit: string
  restMin: number
  durationMin: null
}

const SESSIONS = ["Día 1 · Empuje", "Día 2 · Tirón", "Día 3 · Pierna"] as const

const EXERCISES: PreviewExercise[] = [
  {
    name: "Press de banca",
    group: "pecho",
    sets: 4,
    repsMin: 8,
    repsMax: 10,
    weightValue: 60,
    weightUnit: "kg",
    durationMin: null,
    restMin: 2,
  },
  {
    name: "Fondos en paralelas",
    group: "triceps",
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    weightValue: null,
    weightUnit: "kg",
    durationMin: null,
    restMin: 1,
  },
  {
    name: "Elevaciones laterales",
    group: "hombros",
    sets: 3,
    repsMin: 12,
    repsMax: 15,
    weightValue: 10,
    weightUnit: "kg",
    durationMin: null,
    restMin: 1,
  },
]

export function PlanPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/25 via-primary/5 to-transparent blur-2xl"
      />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/5 ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
        <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <DumbbellIcon className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">
                Fuerza · Empuje / Tirón
              </p>
              <p className="text-xs text-muted-foreground">
                3 sesiones · 18 ejercicios
              </p>
            </div>
          </div>
          <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Público
          </span>
        </div>

        <div className="flex gap-1.5 px-4 pt-3">
          {SESSIONS.map((session, index) => (
            <span
              key={session}
              className={
                "truncate rounded-full px-2.5 py-1 text-[11px] font-medium " +
                (index === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground")
              }
            >
              {session}
            </span>
          ))}
        </div>

        <ul className="flex flex-col gap-2 p-4">
          {EXERCISES.map((exercise, index) => {
            const weight = formatWeight(
              exercise.weightValue,
              exercise.weightUnit
            )
            return (
              <li
                key={exercise.name}
                className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium">
                    {exercise.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {muscleGroupLabel(exercise.group)}
                    {weight ? ` · ${weight}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right leading-tight">
                  <p className="text-xs font-semibold tabular-nums">
                    {formatPrescription(exercise)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Descanso {formatRest(exercise.restMin)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <HeartIcon className="size-3.5 text-rose-500" />
            128 corazones
          </span>
          <span className="flex items-center gap-1.5">
            <Repeat2Icon className="size-3.5" />
            42 copias
          </span>
          <span className="flex items-center gap-1.5">
            <TimerIcon className="size-3.5" />
            50 min
          </span>
        </div>
      </div>
    </div>
  )
}
