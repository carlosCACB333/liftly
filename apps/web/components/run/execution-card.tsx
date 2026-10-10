import { HistoryIcon } from "lucide-react"
import type { ExecutionSet, WorkoutExecution } from "@/lib/data/run"
import {
  formatClock,
  formatHistorySummary,
  formatRelativeDate,
  historyKey,
  isToday,
  type HistoryEntry,
} from "@/lib/domain/run"
import { formatWeight, muscleGroupLabel } from "@/lib/domain/exercise"

function formatAbsolute(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

type Run = { from: number; to: number; set: ExecutionSet }

/** Agrupa series consecutivas con los mismos valores para mostrar «1–3 × 10 · 80 kg». */
function setRuns(sets: ExecutionSet[]): Run[] {
  const runs: Run[] = []
  for (const set of sets) {
    const last = runs[runs.length - 1]
    if (last && !last.set.skipped && !set.skipped) {
      const a = last.set
      if (
        a.reps === set.reps &&
        a.durationSec === set.durationSec &&
        a.weightValue === set.weightValue &&
        a.weightUnit === set.weightUnit
      ) {
        last.to = set.setNumber
        continue
      }
    }
    runs.push({ from: set.setNumber, to: set.setNumber, set })
  }
  return runs
}

type Group = { name: string; muscleGroup: string; sets: ExecutionSet[] }

function groupSets(execution: WorkoutExecution): Group[] {
  const groups = new Map<number, Group>()
  for (const set of execution.sets) {
    const group = groups.get(set.exercisePosition) ?? {
      name: set.exerciseName,
      muscleGroup: set.muscleGroup,
      sets: [],
    }
    group.sets.push(set)
    groups.set(set.exercisePosition, group)
  }
  return [...groups.values()]
}

export function ExecutionCard({
  execution,
  history,
  isLatest = false,
}: {
  execution: WorkoutExecution
  history: Record<string, HistoryEntry>
  isLatest?: boolean
}) {
  const groups = groupSets(execution)
  const today = isToday(execution.startedAt)

  return (
    <li className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b bg-muted/30 px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          {isLatest ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Última
            </span>
          ) : null}
          <time dateTime={execution.startedAt} className="text-sm font-medium">
            {today ? "Hoy" : formatRelativeDate(execution.startedAt)}
          </time>
          <span aria-hidden className="text-xs text-muted-foreground">
            ·
          </span>
          <time className="text-xs text-muted-foreground">
            {formatAbsolute(execution.startedAt)}
          </time>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatClock(execution.durationSec)}</span>
          <span>
            {execution.sets.length}{" "}
            {execution.sets.length === 1 ? "serie" : "series"}
          </span>
        </div>
      </div>

      <ol className="flex flex-col divide-y divide-border/60">
        {groups.map((group) => {
          const runs = setRuns(group.sets)
          const timed = group.sets.some(
            (set) => set.durationSec != null && set.reps == null
          )
          const entry = history[historyKey(group.name)]
          return (
            <li key={group.name} className="flex flex-col gap-2.5 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium break-words">{group.name}</p>
                <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                  {muscleGroupLabel(group.muscleGroup)}
                </span>
              </div>

              <ul className="overflow-hidden rounded-md border text-sm">
                <li className="grid grid-cols-[3rem_1fr_1fr] gap-2 border-b bg-muted/40 px-3 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <span>Serie</span>
                  <span>Peso</span>
                  <span>{timed ? "Tiempo" : "Reps"}</span>
                </li>
                {runs.map((run) => {
                  const set = run.set
                  const weight = formatWeight(set.weightValue, set.weightUnit)
                  const muted = set.skipped
                  return (
                    <li
                      key={run.from}
                      className={
                        "grid grid-cols-[3rem_1fr_1fr] items-baseline gap-2 border-b px-3 py-1.5 last:border-b-0" +
                        (muted ? " text-muted-foreground" : "")
                      }
                    >
                      <span>
                        {run.from === run.to
                          ? run.from
                          : `${run.from}–${run.to}`}
                      </span>
                      {set.skipped ? (
                        <>
                          <span aria-hidden />
                          <span className="italic">Omitida</span>
                        </>
                      ) : (
                        <>
                          <span>{weight ?? "—"}</span>
                          <span>
                            {set.reps != null
                              ? `${set.reps} reps`
                              : set.durationSec != null
                                ? formatClock(set.durationSec)
                                : "—"}
                          </span>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>

              {entry ? (
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                  <HistoryIcon
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Última vez</span>
                  <span className="font-medium text-foreground">
                    {formatHistorySummary(entry)}
                  </span>
                  <span>{formatRelativeDate(entry.loggedAt)}</span>
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>
    </li>
  )
}
