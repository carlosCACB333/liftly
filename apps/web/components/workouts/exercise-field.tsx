"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useFormContext, type FieldPath } from "react-hook-form"
import {
  ChevronDownIcon,
  ClockIcon,
  GripVerticalIcon,
  PlusIcon,
  RepeatIcon,
  Trash2Icon,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import type { ExerciseSuggestion } from "@/lib/data/exercises"
import { muscleGroupLabel } from "@/lib/domain/exercise"
import { PLAN_LIMITS, WEIGHT_UNITS } from "@/lib/domain/plan"
import { fieldErrorMessage } from "@/lib/form-errors"
import type { WorkoutInput } from "@/lib/validations/workout"
import { ExerciseNameInput } from "@/components/workouts/exercise-name-autocomplete"
import { MuscleGroupCombobox } from "@/components/workouts/muscle-group-combobox"

type ExerciseFieldProps = {
  id: string
  sessionIndex: number
  exerciseIndex: number
  open: boolean
  isSubmitting: boolean
  onToggle: () => void
  onRemove: () => void
  showRemove: boolean
}

export function ExerciseField({
  id,
  sessionIndex,
  exerciseIndex,
  open,
  isSubmitting,
  onToggle,
  onRemove,
  showRemove,
}: ExerciseFieldProps) {
  const {
    register,
    watch,
    getValues,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<WorkoutInput>()

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const base: FieldPath<WorkoutInput> = `sessions.${sessionIndex}.exercises.${exerciseIndex}`
  const path = (field: string) => `${base}.${field}` as FieldPath<WorkoutInput>

  const muscleGroup = watch(path("muscleGroup")) as string
  const sets = watch(path("sets")) as number | undefined
  const durationMin = watch(path("durationMin"))
  const mode: "reps" | "duration" =
    durationMin === undefined || durationMin === null ? "reps" : "duration"

  const exerciseErrors =
    errors.sessions?.[sessionIndex]?.exercises?.[exerciseIndex]
  const hasErrors =
    exerciseErrors !== undefined && Object.keys(exerciseErrors).length > 0

  function setMode(next: "reps" | "duration") {
    if (next === mode) return
    if (next === "duration") {
      setValue(path("repsMin"), undefined)
      setValue(path("repsMax"), undefined)
      setValue(path("durationMin"), 30)
      clearErrors([path("repsMin"), path("repsMax")])
    } else {
      setValue(path("durationMin"), undefined)
      setValue(path("repsMin"), PLAN_LIMITS.reps.default)
      setValue(path("repsMax"), PLAN_LIMITS.reps.default)
      clearErrors([path("durationMin")])
    }
  }

  function applyExerciseSuggestion(suggestion: ExerciseSuggestion) {
    const hasReps = suggestion.repsMin != null || suggestion.repsMax != null
    const hasDuration = suggestion.durationMin != null
    setValue(path("name"), suggestion.name)
    setValue(path("muscleGroup"), suggestion.muscleGroup)
    setValue(path("sets"), suggestion.sets)
    if (hasReps) {
      setValue(path("repsMin"), suggestion.repsMin ?? PLAN_LIMITS.reps.default)
      setValue(path("repsMax"), suggestion.repsMax ?? PLAN_LIMITS.reps.default)
      setValue(path("durationMin"), undefined, { shouldDirty: true })
    } else if (hasDuration) {
      setValue(path("repsMin"), undefined, { shouldDirty: true })
      setValue(path("repsMax"), undefined, { shouldDirty: true })
      setValue(path("durationMin"), suggestion.durationMin)
    } else {
      setValue(path("repsMin"), PLAN_LIMITS.reps.default, { shouldDirty: true })
      setValue(path("repsMax"), PLAN_LIMITS.reps.default, { shouldDirty: true })
      setValue(path("durationMin"), undefined, { shouldDirty: true })
    }
    setValue(
      path("weightValue"),
      suggestion.weightValue ?? PLAN_LIMITS.weight.default
    )
    setValue(path("weightUnit"), suggestion.weightUnit === "lb" ? "lb" : "kg")
    setValue(
      path("restMin"),
      suggestion.restMin > 0 ? suggestion.restMin : PLAN_LIMITS.restMin.default
    )
    setValue(path("notes"), suggestion.notes ?? "")
    setValue(
      path("demoUrls"),
      suggestion.demoUrls.length > 0 ? suggestion.demoUrls : [""]
    )
    clearErrors([
      path("name"),
      path("muscleGroup"),
      path("sets"),
      path("repsMin"),
      path("repsMax"),
      path("durationMin"),
      path("weightValue"),
      path("weightUnit"),
      path("restMin"),
      path("notes"),
    ])
    clearDemoUrlErrors()
  }

  const error = (field: string) => fieldErrorMessage(errors, path(field))
  const numberProps = (field: string, min: number, max?: number) => ({
    ...register(path(field)),
    type: "number" as const,
    inputMode: "numeric" as const,
    min,
    max,
    "aria-invalid": Boolean(error(field)),
  })

  const demoUrls = (watch(path("demoUrls")) as string[] | undefined) ?? []
  const demoUrlError = error("demoUrls")
  const demoUrlLimitReached = demoUrls.length >= PLAN_LIMITS.demoUrls.max

  function clearDemoUrlErrors() {
    clearErrors([
      path("demoUrls"),
      ...Array.from({ length: PLAN_LIMITS.demoUrls.max }, (_, index) =>
        path(`demoUrls.${index}`)
      ),
    ])
  }

  function addDemoUrl() {
    const current = (getValues(path("demoUrls")) as string[] | undefined) ?? []
    if (current.length >= PLAN_LIMITS.demoUrls.max) return
    setValue(path("demoUrls"), [...current, ""], { shouldDirty: true })
    clearDemoUrlErrors()
  }

  function removeDemoUrl(index: number) {
    const current = (getValues(path("demoUrls")) as string[] | undefined) ?? []
    setValue(
      path("demoUrls"),
      current.filter((_, urlIndex) => urlIndex !== index),
      { shouldDirty: true }
    )
    clearDemoUrlErrors()
  }

  return (
    <li
      ref={setNodeRef}
      style={sortableStyle}
      className={isDragging ? "list-none opacity-40" : "list-none"}
    >
      <div className="flex gap-1 rounded-lg border bg-background p-1.5 shadow-xs">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            ref={setActivatorNodeRef}
            className="cursor-grab touch-none active:cursor-grabbing"
            disabled={isSubmitting}
            aria-label={`Arrastrar «${watch(path("name")) || "ejercicio"}» para reordenar`}
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon />
          </Button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-end gap-2">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
            >
              {exerciseIndex + 1}
            </span>

            <Field
              className="min-w-44 flex-1"
              data-invalid={Boolean(error("name"))}
            >
              <FieldLabel htmlFor={`${base}-name`}>Ejercicio</FieldLabel>
              <ExerciseNameInput
                id={`${base}-name`}
                value={(watch(path("name")) as string | undefined) ?? ""}
                placeholder="Ej. Press de banca con barra"
                disabled={isSubmitting}
                invalid={Boolean(error("name"))}
                onInputChange={(next) => {
                  setValue(path("name"), next, { shouldDirty: true })
                  clearErrors(path("name"))
                }}
                onApply={applyExerciseSuggestion}
              />
              {error("name") ? <FieldError>{error("name")}</FieldError> : null}
            </Field>

            <div className="flex items-center gap-0.5 pb-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onToggle}
                disabled={isSubmitting}
                aria-expanded={open}
                aria-controls={`${base}-fields`}
                aria-label={
                  open
                    ? `Colapsar «${watch(path("name")) || "ejercicio"}»`
                    : `Expandir «${watch(path("name")) || "ejercicio"}»`
                }
              >
                <ChevronDownIcon
                  aria-hidden
                  className={
                    "transition-transform " + (open ? "rotate-180" : "")
                  }
                />
              </Button>
              {showRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onRemove}
                  disabled={isSubmitting}
                  aria-label={`Eliminar «${watch(path("name")) || "ejercicio"}»`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2Icon />
                </Button>
              ) : null}
            </div>
          </div>

          {open ? null : (
            <div className="w-full text-xs text-muted-foreground" role="status">
              {hasErrors ? (
                <span className="font-medium text-destructive" role="alert">
                  Hay campos por revisar en este ejercicio.
                </span>
              ) : (
                <span>
                  {muscleGroup
                    ? muscleGroupLabel(muscleGroup)
                    : "Sin grupo muscular"}
                  {sets ? ` · ${sets} ${sets === 1 ? "serie" : "series"}` : ""}
                </span>
              )}
            </div>
          )}

          {!open ? null : (
            <div id={`${base}-fields`} className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field data-invalid={Boolean(error("muscleGroup"))}>
                  <FieldLabel htmlFor={`${base}-muscle-group`}>
                    Grupo muscular
                  </FieldLabel>
                  <MuscleGroupCombobox
                    id={`${base}-muscle-group`}
                    value={muscleGroup}
                    onValueChange={(next) => {
                      setValue(path("muscleGroup"), next, { shouldDirty: true })
                      clearErrors(path("muscleGroup"))
                    }}
                    disabled={isSubmitting}
                    invalid={Boolean(error("muscleGroup"))}
                  />
                  {error("muscleGroup") ? (
                    <FieldError>{error("muscleGroup")}</FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={Boolean(error("sets"))}>
                  <FieldLabel htmlFor={`${base}-sets`}>Series</FieldLabel>
                  <Input
                    id={`${base}-sets`}
                    {...numberProps(
                      "sets",
                      PLAN_LIMITS.sets.min,
                      PLAN_LIMITS.sets.max
                    )}
                    disabled={isSubmitting}
                  />
                  <FieldDescription>
                    {PLAN_LIMITS.sets.min}–{PLAN_LIMITS.sets.max} por ejercicio.
                  </FieldDescription>
                  {error("sets") ? (
                    <FieldError>{error("sets")}</FieldError>
                  ) : null}
                </Field>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium" id={`${base}-goal-label`}>
                  Objetivo
                </span>
                <div
                  role="group"
                  aria-labelledby={`${base}-goal-label`}
                  className="flex w-fit rounded-lg border bg-muted p-0.5"
                >
                  <button
                    type="button"
                    aria-pressed={mode === "reps"}
                    disabled={isSubmitting}
                    onClick={() => setMode("reps")}
                    className={
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none " +
                      (mode === "reps"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    <RepeatIcon className="size-4" />
                    Repeticiones
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === "duration"}
                    disabled={isSubmitting}
                    onClick={() => setMode("duration")}
                    className={
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none " +
                      (mode === "duration"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    <ClockIcon className="size-4" />
                    Duración
                  </button>
                </div>

                {mode === "reps" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field data-invalid={Boolean(error("repsMin"))}>
                      <FieldLabel htmlFor={`${base}-reps-min`}>
                        Reps mínimas
                      </FieldLabel>
                      <Input
                        id={`${base}-reps-min`}
                        {...numberProps(
                          "repsMin",
                          PLAN_LIMITS.reps.min,
                          PLAN_LIMITS.reps.max
                        )}
                        disabled={isSubmitting}
                      />
                      {error("repsMin") ? (
                        <FieldError>{error("repsMin")}</FieldError>
                      ) : null}
                    </Field>
                    <Field data-invalid={Boolean(error("repsMax"))}>
                      <FieldLabel htmlFor={`${base}-reps-max`}>
                        Reps máximas
                      </FieldLabel>
                      <Input
                        id={`${base}-reps-max`}
                        {...numberProps(
                          "repsMax",
                          PLAN_LIMITS.reps.min,
                          PLAN_LIMITS.reps.max
                        )}
                        disabled={isSubmitting}
                      />
                      {error("repsMax") ? (
                        <FieldError>{error("repsMax")}</FieldError>
                      ) : null}
                    </Field>
                  </div>
                ) : (
                  <Field
                    className="sm:max-w-56"
                    data-invalid={Boolean(error("durationMin"))}
                  >
                    <FieldLabel htmlFor={`${base}-duration`}>
                      Duración (minutos)
                    </FieldLabel>
                    <Input
                      id={`${base}-duration`}
                      {...numberProps(
                        "durationMin",
                        PLAN_LIMITS.durationMin.min
                      )}
                      disabled={isSubmitting}
                    />
                    <FieldDescription>
                      Minuto a minuto, sin repeticiones.
                    </FieldDescription>
                    {error("durationMin") ? (
                      <FieldError>{error("durationMin")}</FieldError>
                    ) : null}
                  </Field>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field data-invalid={Boolean(error("weightValue"))}>
                  <FieldLabel htmlFor={`${base}-weight`}>Peso</FieldLabel>
                  <Input
                    id={`${base}-weight`}
                    {...numberProps("weightValue", PLAN_LIMITS.weight.min)}
                    step="0.5"
                    disabled={isSubmitting}
                  />
                  {error("weightValue") ? (
                    <FieldError>{error("weightValue")}</FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={Boolean(error("weightUnit"))}>
                  <FieldLabel htmlFor={`${base}-weight-unit`}>
                    Unidad
                  </FieldLabel>
                  <Select
                    value={watch(path("weightUnit")) ?? "kg"}
                    onValueChange={(next) =>
                      setValue(path("weightUnit"), next as "kg" | "lb")
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id={`${base}-weight-unit`}
                      className="w-full"
                    >
                      <SelectValue>
                        {(value: unknown) =>
                          typeof value === "string" ? value : "kg"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {WEIGHT_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {error("weightUnit") ? (
                    <FieldError>{error("weightUnit")}</FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={Boolean(error("restMin"))}>
                  <FieldLabel htmlFor={`${base}-rest`}>
                    Descanso (min)
                  </FieldLabel>
                  <Input
                    id={`${base}-rest`}
                    {...numberProps("restMin", PLAN_LIMITS.restMin.min)}
                    disabled={isSubmitting}
                  />
                  {error("restMin") ? (
                    <FieldError>{error("restMin")}</FieldError>
                  ) : null}
                </Field>
              </div>

              <Field data-invalid={Boolean(error("notes"))}>
                <FieldLabel htmlFor={`${base}-notes`}>
                  Notas (opcional)
                </FieldLabel>
                <Textarea
                  id={`${base}-notes`}
                  rows={2}
                  placeholder="Ejecución, máquina, altercado…"
                  aria-invalid={Boolean(error("notes"))}
                  {...register(path("notes"))}
                />
                {error("notes") ? (
                  <FieldError>{error("notes")}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(demoUrlError)}>
                <FieldTitle id={`${base}-demo-title`}>
                  Recursos del ejercicio (opcional)
                </FieldTitle>
                <FieldDescription id={`${base}-demo-hint`}>
                  Enlaces a vídeos o imágenes que muestren cómo se hace el
                  ejercicio.
                </FieldDescription>
                <div className="flex flex-col gap-2">
                  {demoUrls.map((url, urlIndex) => {
                    const rowError = error(`demoUrls.${urlIndex}`)
                    const errorId = `${base}-demo-url-${urlIndex}-error`
                    return (
                      <div key={urlIndex} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Input
                            id={`${base}-demo-url-${urlIndex}`}
                            type="url"
                            inputMode="url"
                            placeholder="https://…"
                            aria-label={`Enlace ${urlIndex + 1} del ejercicio`}
                            aria-invalid={Boolean(rowError)}
                            aria-describedby={rowError ? errorId : undefined}
                            disabled={isSubmitting}
                            {...register(path(`demoUrls.${urlIndex}`))}
                            value={url ?? ""}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeDemoUrl(urlIndex)}
                            disabled={isSubmitting}
                            aria-label={`Eliminar enlace ${urlIndex + 1}`}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                        {rowError ? (
                          <FieldError id={errorId}>{rowError}</FieldError>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDemoUrl}
                    disabled={isSubmitting || demoUrlLimitReached}
                  >
                    <PlusIcon />
                    Añadir enlace
                  </Button>
                  <span
                    className="text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {demoUrls.length}/{PLAN_LIMITS.demoUrls.max}
                  </span>
                  {demoUrlLimitReached ? (
                    <p className="text-xs text-muted-foreground">
                      Has llegado al máximo de {PLAN_LIMITS.demoUrls.max}{" "}
                      enlaces.
                    </p>
                  ) : null}
                </div>
                {demoUrlError ? <FieldError>{demoUrlError}</FieldError> : null}
              </Field>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
