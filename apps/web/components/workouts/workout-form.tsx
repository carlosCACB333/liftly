"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { createPlan, updatePlan } from "@/lib/actions/workouts"
import { createDefaultPlanSession, PLAN_LIMITS } from "@/lib/domain/plan"
import { workoutSchema, type WorkoutInput } from "@/lib/validations/workout"
import { SessionField } from "@/components/workouts/session-field"

type WorkoutFormProps = {
  planId?: string
  planName?: string
  initial?: WorkoutInput
}

const defaultValues: WorkoutInput = {
  name: "",
  description: "",
  visibility: "private",
  status: "draft",
  sessions: [{ name: "Sesión 1", exercises: [] }],
}

const ACTION_ERRORS: Record<string, string> = {
  unauthenticated: "Tu sesión ha caducado. Vuelve a iniciar sesión para guardar.",
  "not-found": "Este plan ya no existe.",
  forbidden: "No tienes permiso para editar este plan.",
  conflict: "No se pudo guardar: recarga la página e inténtalo de nuevo.",
}

export function WorkoutForm({ planId, planName, initial }: WorkoutFormProps) {
  const router = useRouter()
  const [actionError, setActionError] = useState<string | null>(null)
  const [openSession, setOpenSession] = useState<number | null>(0)

  const methods = useForm<WorkoutInput>({
    resolver: zodResolver(workoutSchema),
    defaultValues: initial ?? defaultValues,
  })
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = methods

  const sessions = useFieldArray({ control, name: "sessions" })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleSessionDragStart(event: DragStartEvent) {
    const ids = sessions.fields.map((field) => field.id)
    const from = ids.indexOf(String(event.active.id))
    if (from === -1) return
    setOpenSession((current) => (current === from ? null : current))
  }

  function handleSessionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = sessions.fields.map((field) => field.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    sessions.move(from, to)
    setOpenSession((current) => {
      if (current === null) return null
      if (current === from) return null
      if (from < to && current > from && current <= to) return current - 1
      if (from > to && current >= to && current < from) return current + 1
      return current
    })
  }

  function applyServerErrors(errors: Record<string, string>) {
    for (const [path, message] of Object.entries(errors)) {
      setError(path as never, { type: "server", message })
    }
  }

  async function onSubmit(values: WorkoutInput) {
    setActionError(null)
    const result = planId
      ? await updatePlan(planId, values)
      : await createPlan(values)

    if (!result.ok) {
      if (result.reason === "validation") {
        applyServerErrors(result.errors)
        setActionError(
          result.messages.join(" · ") || "Revisa los campos marcados."
        )
        return
      }
      setActionError(ACTION_ERRORS[result.reason] ?? "No se pudo guardar el plan.")
      return
    }

    toast.success(planId ? "Cambios guardados." : "Plan creado en Mis planes.")
    router.push(`/plans/${result.planId}`)
    router.refresh()
  }

  return (
    <FormProvider {...methods}>
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-8"
    >
      {actionError ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar el plan</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset className="contents">
        <legend className="sr-only">Datos del plan</legend>
        <FieldGroup className="gap-5">
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="plan-name">Nombre del plan</FieldLabel>
            <Input
              id="plan-name"
              placeholder="Ej. Empuje de tren superior"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.description)}>
            <FieldLabel htmlFor="plan-description">
              Descripción (opcional)
            </FieldLabel>
            <Textarea
              id="plan-description"
              rows={3}
              placeholder="Para quién es este plan, cómo está organizado…"
              {...register("description")}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description ? (
              <FieldError>{errors.description.message}</FieldError>
            ) : null}
          </Field>

          <VisibilityField disabled={isSubmitting} />
        </FieldGroup>
      </fieldset>

      <section aria-labelledby="sessions-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2
              id="sessions-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Sesiones
            </h2>
            <p className="text-sm text-muted-foreground">
              Cada sesión es una entrada del plan: agrupa los ejercicios que
              harás juntos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {sessions.fields.length}/{PLAN_LIMITS.maxSessions}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                sessions.append(
                  createDefaultPlanSession(sessions.fields.length + 1)
                )
                setOpenSession(sessions.fields.length)
              }}
              disabled={
                isSubmitting || sessions.fields.length >= PLAN_LIMITS.maxSessions
              }
            >
              <PlusIcon />
              Añadir sesión
            </Button>
          </div>
        </div>

        {sessions.fields.length >= PLAN_LIMITS.maxSessions ? (
          <p className="text-xs text-muted-foreground">
            Has llegado al máximo de {PLAN_LIMITS.maxSessions} sesiones por plan.
          </p>
        ) : null}

        {errors.sessions?.message ? (
          <FieldError>{errors.sessions.message}</FieldError>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleSessionDragStart}
          onDragEnd={handleSessionDragEnd}
        >
          <SortableContext
            items={sessions.fields.map((field) => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="flex flex-col gap-4">
              {sessions.fields.map((session, sessionIndex) => (
                <SessionField
                  key={session.id}
                  id={session.id}
                  index={sessionIndex}
                  open={sessionIndex === openSession}
                  onToggle={() =>
                    setOpenSession((current) =>
                      current === sessionIndex ? null : sessionIndex
                    )
                  }
                  isSubmitting={isSubmitting}
                  onRemove={() => {
                    sessions.remove(sessionIndex)
                    setOpenSession((current) => {
                      if (current === null || current === sessionIndex) {
                        return null
                      }
                      return current > sessionIndex ? current - 1 : current
                    })
                  }}
                  showRemove={sessions.fields.length > 1}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-3 shadow-md backdrop-blur">
        <p className="hidden text-xs text-muted-foreground sm:block">
          {planId
            ? `Editando «${planName ?? "plan"}»`
            : "Se guardará en Mis planes como borrador privado."}
        </p>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <Link
            href={planId ? `/plans/${planId}` : "/my-plans"}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting
              ? "Guardando…"
              : planId
                ? "Guardar cambios"
                : "Crear plan"}
          </Button>
        </div>
      </div>
    </form>
    </FormProvider>
  )
}

function VisibilityField({ disabled }: { disabled?: boolean }) {
  const { register, watch, formState } = useFormContext<WorkoutInput>()
  const value = watch("visibility")
  const invalid = Boolean(formState.errors.visibility)

  const options = [
    {
      value: "private",
      title: "Privado",
      description: "Solo tú puedes verlo y editarlo.",
    },
    {
      value: "public",
      title: "Público",
      description: "Aparece en Explorar, recibe corazones y puede copiarse.",
    },
  ] as const

  return (
    <Field data-invalid={invalid}>
      <FieldTitle id="visibility-label">Visibilidad</FieldTitle>
      <FieldDescription>
        Puedes cambiarla en cualquier momento desde el plan.
      </FieldDescription>
      <div
        role="radiogroup"
        aria-labelledby="visibility-label"
        className="grid gap-3 sm:grid-cols-2"
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={
              "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 " +
              (value === option.value
                ? "border-primary/40 bg-primary/5"
                : "hover:bg-muted/50")
            }
          >
            <input
              type="radio"
              value={option.value}
              disabled={disabled}
              className="sr-only"
              aria-invalid={invalid}
              {...register("visibility")}
            />
            <span className="flex items-center gap-2 text-sm font-medium">
              <span
                aria-hidden
                className={
                  "size-3.5 rounded-full border-2 " +
                  (value === option.value
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40")
                }
              />
              {option.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {option.description}
            </span>
          </label>
        ))}
      </div>
      {invalid ? (
        <FieldError>{formState.errors.visibility?.message}</FieldError>
      ) : null}
    </Field>
  )
}
