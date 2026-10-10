"use client"

import { useState } from "react"
import { useFieldArray, useFormContext } from "react-hook-form"
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronDownIcon,
  DumbbellIcon,
  GripVerticalIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { createDefaultPlanExercise } from "@/lib/domain/plan"
import { fieldErrorMessage } from "@/lib/form-errors"
import type { WorkoutInput } from "@/lib/validations/workout"
import { ExerciseField } from "@/components/workouts/exercise-field"

type SessionFieldProps = {
  id: string
  index: number
  open: boolean
  isSubmitting: boolean
  onToggle: () => void
  onRemove: () => void
  showRemove: boolean
}

export function SessionField({
  id,
  index,
  open,
  isSubmitting,
  onToggle,
  onRemove,
  showRemove,
}: SessionFieldProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<WorkoutInput>()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [openExercise, setOpenExercise] = useState<number | null>(0)

  const exercises = useFieldArray({
    control,
    name: `sessions.${index}.exercises`,
  })

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleExerciseDragStart(event: DragStartEvent) {
    const ids = exercises.fields.map((field) => field.id)
    const from = ids.indexOf(String(event.active.id))
    if (from === -1) return
    setOpenExercise((current) => (current === from ? null : current))
  }

  function handleExerciseDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = exercises.fields.map((field) => field.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    exercises.move(from, to)
    setOpenExercise((current) => {
      if (current === null) return null
      if (current === from) return null
      if (from < to && current > from && current <= to) return current - 1
      if (from > to && current >= to && current < from) return current + 1
      return current
    })
  }

  const nameError = fieldErrorMessage(errors, `sessions.${index}.name`)
  const sessionError = fieldErrorMessage(errors, `sessions.${index}.exercises`)
  const nameId = `session-${index}-name`
  const hasExercises = exercises.fields.length > 0

  function requestRemove() {
    if (hasExercises) {
      setConfirmOpen(true)
      return
    }
    onRemove()
  }

  return (
    <li
      ref={setNodeRef}
      style={sortableStyle}
      className={isDragging ? "list-none opacity-40" : "list-none"}
    >
      <div className="flex gap-1 rounded-xl border bg-card p-2 shadow-xs">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            ref={setActivatorNodeRef}
            className="cursor-grab touch-none active:cursor-grabbing"
            disabled={isSubmitting}
            aria-label={`Arrastrar «Sesión ${index + 1}» para reordenar`}
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
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
        >
          {index + 1}
        </span>

        <Field className="min-w-40 flex-1" data-invalid={Boolean(nameError)}>
          <FieldLabel htmlFor={nameId}>Nombre de la sesión</FieldLabel>
          <Input
            id={nameId}
            placeholder="Ej. Día 1 · Empuje"
            aria-invalid={Boolean(nameError)}
            {...register(`sessions.${index}.name`)}
          />
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>

        <div className="flex items-center gap-0.5 pb-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            disabled={isSubmitting}
            aria-expanded={open}
            aria-controls={`session-body-${index}`}
            aria-label={
              open
                ? `Colapsar «Sesión ${index + 1}»`
                : `Expandir «Sesión ${index + 1}»`
            }
          >
            <ChevronDownIcon
              aria-hidden
              className={"transition-transform " + (open ? "rotate-180" : "")}
            />
          </Button>
          {showRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={requestRemove}
              disabled={isSubmitting}
              aria-label={`Eliminar «Sesión ${index + 1}»`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          ) : null}
        </div>
      </div>

      {open ? null : (
        <div className="w-full text-xs text-muted-foreground" role="status">
          {exercises.fields.length > 0
            ? `${exercises.fields.length} ${
                exercises.fields.length === 1 ? "ejercicio" : "ejercicios"
              }`
            : "Sin ejercicios"}
          {nameError || sessionError ? (
            <span className="text-destructive" role="alert">
              {" · "}
              {sessionError ?? nameError}
            </span>
          ) : null}
        </div>
      )}

      {!open ? null : (
        <div id={`session-body-${index}`} className="flex flex-col gap-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleExerciseDragStart}
            onDragEnd={handleExerciseDragEnd}
          >
            <SortableContext
              items={exercises.fields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="flex flex-col gap-3">
                {exercises.fields.map((exercise, exerciseIndex) => (
                  <ExerciseField
                    key={exercise.id}
                    id={exercise.id}
                    sessionIndex={index}
                    exerciseIndex={exerciseIndex}
                    open={exerciseIndex === openExercise}
                    isSubmitting={isSubmitting}
                    onToggle={() =>
                      setOpenExercise((current) =>
                        current === exerciseIndex ? null : exerciseIndex
                      )
                    }
                    onRemove={() => {
                      exercises.remove(exerciseIndex)
                      setOpenExercise((current) => {
                        if (current === null) return null
                        if (current === exerciseIndex) return null
                        return current > exerciseIndex ? current - 1 : current
                      })
                    }}
                    showRemove={exercises.fields.length > 1}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>

          {exercises.fields.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center">
              <DumbbellIcon className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium">Sin ejercicios todavía</p>
              <p className="text-xs text-muted-foreground">
                Añade el primero con su grupo muscular, series y objetivo.
              </p>
            </div>
          ) : null}

          {sessionError ? <FieldError>{sessionError}</FieldError> : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              exercises.append(createDefaultPlanExercise())
              setOpenExercise(exercises.fields.length)
            }}
            disabled={isSubmitting}
          >
            <PlusIcon />
            Añadir ejercicio
          </Button>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán sus {exercises.fields.length}{" "}
              {exercises.fields.length === 1 ? "ejercicio" : "ejercicios"}. Esta
              acción no se puede deshacer hasta que guardes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={() => {
                onRemove()
                setConfirmOpen(false)
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2Icon /> : null}
              Eliminar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </div>
    </li>
  )
}
