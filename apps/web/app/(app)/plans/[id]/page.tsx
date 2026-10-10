import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardIcon,
  CopyIcon,
  DumbbellIcon,
  ExternalLinkIcon,
  GlobeIcon,
  HeartIcon,
  HistoryIcon,
  LayersIcon,
  LockIcon,
  PencilIcon,
  UserIcon,
} from "lucide-react"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { getSession } from "@/lib/auth/session"
import {
  getPlanExecutions,
  getUserExerciseHistory,
  type WorkoutExecution,
} from "@/lib/data/run"
import { getWorkoutDetail, isWorkoutOwner } from "@/lib/data/workouts"
import { LikeButton } from "@/components/workouts/like-button"
import { JoinButton } from "@/components/workouts/join-button"
import { OwnerActions } from "@/components/workouts/owner-actions"
import { SessionDisclosure } from "@/components/workouts/session-disclosure"
import { SyncSourceButton } from "@/components/workouts/sync-source-button"
import { ExecutionCard } from "@/components/run/execution-card"
import { StartRunButton } from "@/components/run/start-run-button"
import {
  formatDuration,
  formatPrescription,
  formatRest,
  formatWeight,
  muscleGroupLabel,
} from "@/lib/domain/exercise"
import {
  formatHistorySummary,
  formatRelativeDate,
  historyKey,
  isToday,
} from "@/lib/domain/run"

export const metadata: Metadata = {
  title: "Detalle del plan",
  description:
    "Consulta un plan de Liftly, dale corazón o cópialo a tu cuenta.",
}

type Params = Promise<{ id: string }>

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export default async function PlanDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const session = await getSession()
  const userId = session?.user?.id

  const [workout, { executions, openSessionIds }, history] = await Promise.all([
    getWorkoutDetail(id, userId),
    userId
      ? getPlanExecutions(id, userId)
      : Promise.resolve({ executions: [], openSessionIds: [] }),
    userId
      ? getUserExerciseHistory(userId)
      : Promise.resolve({} as Record<string, never>),
  ])
  if (!workout) notFound()

  const executionsBySession = new Map<string, WorkoutExecution[]>()
  for (const execution of executions) {
    executionsBySession.set(execution.planSessionId, [
      ...(executionsBySession.get(execution.planSessionId) ?? []),
      execution,
    ])
  }

  const owner = isWorkoutOwner(workout, userId)
  const backHref = owner ? "/my-plans" : "/plans"
  const backLabel = owner ? "Mis planes" : "Explorar"

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={backHref}
        className={`w-fit ${buttonVariants({ variant: "ghost", size: "sm" })} -ml-2.5`}
      >
        <ArrowLeftIcon />
        {backLabel}
      </Link>

      {!userId ? (
        <Alert>
          <AlertTitle>Modo invitado</AlertTitle>
          <AlertDescription>
            Puedes ver este plan público. Inicia sesión para darle corazón,
            copiarlo a tu cuenta y registrar tus series.
          </AlertDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Crear cuenta
            </Link>
          </div>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="size-4" />
              {workout.author?.id ? (
                <Link
                  href={`/profile/${workout.author.id}`}
                  className="rounded-sm font-medium text-foreground underline underline-offset-4 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {workout.author.name}
                </Link>
              ) : (
                <span className="font-medium text-foreground">Usuario</span>
              )}
              <span aria-hidden>·</span>
              <CalendarIcon className="size-4" />
              <time dateTime={workout.createdAt}>
                {formatDate(workout.createdAt)}
              </time>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {workout.isPublished ? (
                <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                  <GlobeIcon className="size-3.5" />
                  Público
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                  <LockIcon className="size-3.5" />
                  Privado
                </span>
              )}
              {!owner && workout.joinedByMe ? (
                <span className="inline-flex items-center gap-1 rounded-full border bg-primary/10 px-2.5 py-1 text-xs text-primary">
                  <ClipboardIcon className="size-3.5" />
                  Ya en Mis planes
                </span>
              ) : null}
            </div>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            {workout.name}
          </h1>

          {workout.sourceWorkoutId && workout.sourceWorkoutName ? (
            <p className="text-sm text-muted-foreground">
              Copia de{" "}
              {workout.sourceAccessible ? (
                <Link
                  href={`/plans/${workout.sourceWorkoutId}`}
                  className="rounded-sm font-medium text-foreground underline underline-offset-4 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {workout.sourceWorkoutName}
                </Link>
              ) : (
                <span className="font-medium text-foreground">
                  {workout.sourceWorkoutName}
                </span>
              )}
              {workout.sourceAuthorName ? (
                <span> · de {workout.sourceAuthorName}</span>
              ) : null}
            </p>
          ) : null}

          {owner && workout.sourceOutdated ? (
            <Alert>
              <AlertTitle>
                {workout.sourceHasNewerVersion
                  ? "El plan original se ha actualizado"
                  : "Tu copia difiere del plan original"}
              </AlertTitle>
              <AlertDescription>
                Al sincronizar, tus sesiones y ejercicios se reemplazarán por
                los del original. El nombre, la descripción, la visibilidad y
                los corazones de tu copia se conservan.
              </AlertDescription>
              <div className="mt-2">
                <SyncSourceButton
                  planId={workout.id}
                  sourceName={workout.sourceWorkoutName}
                />
              </div>
            </Alert>
          ) : null}

          {workout.description ? (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {workout.description}
            </p>
          ) : null}

          <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              <LayersIcon className="size-4 text-muted-foreground" />
              <dt className="sr-only">Sesiones</dt>
              <dd>
                <span className="font-medium">{workout.sessions.length}</span>{" "}
                <span className="text-muted-foreground">
                  {workout.sessions.length === 1 ? "sesión" : "sesiones"}
                </span>
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <DumbbellIcon className="size-4 text-muted-foreground" />
              <dt className="sr-only">Ejercicios</dt>
              <dd>
                <span className="font-medium">{workout.exercisesCount}</span>{" "}
                <span className="text-muted-foreground">
                  {workout.exercisesCount === 1 ? "ejercicio" : "ejercicios"}
                </span>
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <HeartIcon className="size-4 text-muted-foreground" />
              <dt className="sr-only">Corazones</dt>
              <dd>
                <span className="font-medium">{workout.likeCount}</span>{" "}
                <span className="text-muted-foreground">
                  {workout.likeCount === 1 ? "corazón" : "corazones"}
                </span>
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <CopyIcon className="size-4 text-muted-foreground" />
              <dt className="sr-only">Copias</dt>
              <dd>
                <span className="font-medium">{workout.copiesCount}</span>{" "}
                <span className="text-muted-foreground">
                  {workout.copiesCount === 1 ? "copia" : "copias"}
                </span>
              </dd>
            </div>
          </dl>

          {workout.muscleGroups.length > 0 ? (
            <ul
              aria-label="Grupos musculares"
              className="flex flex-wrap gap-1.5"
            >
              {workout.muscleGroups.map((group) => (
                <li
                  key={group}
                  className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {muscleGroupLabel(group)}
                </li>
              ))}
            </ul>
          ) : null}
        </CardHeader>

        <CardContent className="flex flex-wrap items-center gap-2">
          {owner ? (
            <>
              <Link
                href={`/plans/${workout.id}/edit`}
                className={buttonVariants({ size: "lg" })}
              >
                <PencilIcon />
                Editar plan
              </Link>
              <OwnerActions
                workoutId={workout.id}
                planName={workout.name}
                isPublished={workout.isPublished}
                editHref={`/plans/${workout.id}/edit`}
                redirectTo="/my-plans"
              />
            </>
          ) : (
            <>
              <LikeButton
                workoutId={workout.id}
                liked={workout.likedByMe}
                count={workout.likeCount}
              />
              {workout.joinedByMe ? (
                <Link
                  href="/my-plans"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  <ClipboardIcon />
                  Ir a Mis planes
                </Link>
              ) : (
                <JoinButton workoutId={workout.id} planName={workout.name} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <section
        aria-labelledby="sessions-heading"
        className="flex flex-col gap-4"
      >
        <h2
          id="sessions-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Sesiones
        </h2>

        {workout.sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
            <p className="font-medium">Este plan todavía no tiene sesiones</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {owner
                ? "Añade sesiones y ejercicios desde el editor del plan."
                : "Su autor aún no ha añadido ejercicios."}
            </p>
            {owner ? (
              <Link
                href={`/plans/${workout.id}/edit`}
                className={buttonVariants({ size: "sm" })}
              >
                <PencilIcon />
                Editar plan
              </Link>
            ) : null}
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {workout.sessions.map((planSession, sessionIndex) => {
              const sessionExecutions =
                executionsBySession.get(planSession.id) ?? []
              return (
                <SessionDisclosure
                  key={planSession.id}
                  index={sessionIndex}
                  name={planSession.name}
                  exerciseCount={planSession.exercises.length}
                  defaultOpen={workout.sessions.length === 1}
                  actions={
                    planSession.exercises.length > 0 ? (
                      <StartRunButton
                        planSessionId={planSession.id}
                        resume={openSessionIds.includes(planSession.id)}
                      />
                    ) : null
                  }
                >
                  {planSession.exercises.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Sin ejercicios.
                    </p>
                  ) : (
                    <ol className="flex flex-col">
                      {planSession.exercises.map((exercise, exerciseIndex) => {
                        const rest = formatRest(exercise.restMin)
                        const weight = formatWeight(
                          exercise.weightValue,
                          exercise.weightUnit
                        )
                        const historyEntry = history[historyKey(exercise.name)]
                        const historySummary = historyEntry
                          ? formatHistorySummary(historyEntry)
                          : null
                        const doneToday = historyEntry
                          ? isToday(historyEntry.loggedAt)
                          : false
                        return (
                          <li
                            key={exercise.id}
                            className="flex gap-3 border-b px-4 py-3.5 last:border-b-0"
                          >
                            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                              {exerciseIndex + 1}
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                <p className="font-medium break-words">
                                  {exercise.name}
                                </p>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                                    {muscleGroupLabel(exercise.muscleGroup)}
                                  </span>
                                  <StartRunButton
                                    planSessionId={planSession.id}
                                    resume={openSessionIds.includes(
                                      planSession.id
                                    )}
                                    exercisePosition={exercise.order}
                                    iconOnly
                                  />
                                </div>
                              </div>
                              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {formatPrescription(exercise)}
                                </span>
                                {weight ? (
                                  <>
                                    <span aria-hidden>·</span>
                                    <span>{weight}</span>
                                  </>
                                ) : null}
                                {rest ? (
                                  <>
                                    <span aria-hidden>·</span>
                                    <span>descanso {rest}</span>
                                  </>
                                ) : null}
                                {!weight && !rest ? (
                                  <>
                                    <span aria-hidden>·</span>
                                    <span>sin peso ni descanso</span>
                                  </>
                                ) : null}
                              </p>
                              {historyEntry ? (
                                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                                  <HistoryIcon
                                    className="size-3.5 shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span>Última vez</span>
                                  {historySummary ? (
                                    <span className="font-medium text-foreground">
                                      {historySummary}
                                    </span>
                                  ) : null}
                                  {doneToday ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                                      <CheckIcon
                                        className="size-3.5"
                                        aria-hidden="true"
                                      />
                                      Hoy
                                    </span>
                                  ) : (
                                    <span>
                                      {formatRelativeDate(
                                        historyEntry.loggedAt
                                      )}
                                    </span>
                                  )}
                                </p>
                              ) : null}
                              {exercise.durationMin != null ? (
                                <p className="text-xs text-muted-foreground">
                                  Duración objetivo:{" "}
                                  {formatDuration(exercise.durationMin)}.
                                </p>
                              ) : null}
                              {exercise.notes ? (
                                <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                                  {exercise.notes}
                                </p>
                              ) : null}
                              {exercise.demoUrls.length ? (
                                <ul className="flex flex-col gap-1">
                                  {exercise.demoUrls.map((url, urlIndex) => (
                                    <li key={urlIndex}>
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-fit items-center gap-1.5 rounded-md text-xs font-medium text-primary underline underline-offset-4 hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                      >
                                        <ExternalLinkIcon className="size-3.5" />
                                        {exercise.demoUrls.length > 1
                                          ? `Ver recurso ${urlIndex + 1} del ejercicio`
                                          : "Ver vídeo o imagen del ejercicio"}
                                        <span className="sr-only">
                                          {" "}
                                          (se abre en una pestaña nueva)
                                        </span>
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  )}

                  {sessionExecutions.length > 0 ? (
                    <details className="group border-t">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition-colors select-none hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <HistoryIcon className="size-4 text-muted-foreground" />
                          Tus ejecuciones
                          <span className="inline-flex items-center justify-center rounded-full border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {sessionExecutions.length}
                          </span>
                        </span>
                        <ChevronDownIcon
                          aria-hidden="true"
                          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                        />
                      </summary>
                      <ol className="flex flex-col gap-3 border-t px-4 py-3">
                        {sessionExecutions.map((execution, executionIndex) => (
                          <ExecutionCard
                            key={execution.id}
                            execution={execution}
                            history={history}
                            isLatest={executionIndex === 0}
                          />
                        ))}
                      </ol>
                    </details>
                  ) : null}
                </SessionDisclosure>
              )
            })}
          </ol>
        )}
      </section>
    </div>
  )
}
