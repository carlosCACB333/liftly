import { z } from "zod"
import { isMuscleGroup } from "@/lib/domain/exercise"
import { PLAN_LIMITS, WEIGHT_UNITS } from "@/lib/domain/plan"

const weightUnits = z.enum(WEIGHT_UNITS)

function toUndefined(value: unknown) {
  if (value === "" || value === null || value === undefined) return undefined
  if (typeof value === "number" && Number.isNaN(value)) return undefined
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed === "" ? undefined : trimmed
  }
  return value
}

function intSchema(options: { min: number; max?: number; message: string }) {
  let schema = z.coerce
    .number({ message: options.message })
    .int("Introduce un número entero.")
    .min(options.min, `Mínimo ${options.min}.`)
  if (options.max !== undefined) {
    schema = schema.max(options.max, `Máximo ${options.max}.`)
  }
  return schema
}

function intField(options: { min: number; max?: number; message: string }) {
  return z.preprocess(toUndefined, intSchema(options))
}

function optionalIntField(options: {
  min: number
  max?: number
  message: string
}) {
  return z.preprocess(toUndefined, intSchema(options).optional())
}

function numberField(options: { min: number }) {
  return z.preprocess(
    toUndefined,
    z.coerce
      .number({ message: "Introduce un número." })
      .min(options.min, "No puede ser negativo.")
      .optional()
  )
}

function isHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

const planExerciseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Ponle nombre al ejercicio.")
      .max(100, "Máximo 100 caracteres."),
    muscleGroup: z
      .string()
      .trim()
      .min(1, "Elige un grupo muscular.")
      .refine(isMuscleGroup, "Elige un grupo muscular."),
    sets: intField({
      min: PLAN_LIMITS.sets.min,
      max: PLAN_LIMITS.sets.max,
      message: "Indica cuántas series harás.",
    }),
    repsMin: optionalIntField({
      min: PLAN_LIMITS.reps.min,
      max: PLAN_LIMITS.reps.max,
      message: "Indica el mínimo de repeticiones.",
    }),
    repsMax: optionalIntField({
      min: PLAN_LIMITS.reps.min,
      max: PLAN_LIMITS.reps.max,
      message: "Indica el máximo de repeticiones.",
    }),
    durationMin: optionalIntField({
      min: PLAN_LIMITS.durationMin.min,
      message: "Indica la duración en minutos.",
    }),
    weightValue: numberField({ min: PLAN_LIMITS.weight.min }),
    weightUnit: weightUnits.optional(),
    restMin: optionalIntField({
      min: PLAN_LIMITS.restMin.min,
      message: "Indica el descanso en minutos.",
    }),
    notes: z.string().trim().max(500, "Máximo 500 caracteres.").optional(),
    demoUrls: z
      .array(
        z
          .string()
          .trim()
          .max(
            PLAN_LIMITS.demoUrls.urlMaxLength,
            `Máximo ${PLAN_LIMITS.demoUrls.urlMaxLength} caracteres.`
          )
          .refine(
            (value) => value === "" || isHttpUrl(value),
            "Introduce un enlace http o https válido."
          )
      )
      .max(
        PLAN_LIMITS.demoUrls.max,
        `Máximo ${PLAN_LIMITS.demoUrls.max} enlaces.`
      )
      .default([])
      .transform((urls) => urls.filter((url) => url !== "")),
  })
  .superRefine((exercise, ctx) => {
    const hasReps =
      exercise.repsMin !== undefined || exercise.repsMax !== undefined
    const hasDuration = exercise.durationMin !== undefined
    if (hasReps === hasDuration) {
      ctx.addIssue({
        code: "custom",
        path: ["repsMin"],
        message: "Indica repeticiones o duración, pero no ambas.",
      })
    }
    if (hasReps && exercise.repsMin === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["repsMin"],
        message: "Indica el mínimo de repeticiones.",
      })
    }
    if (hasReps && exercise.repsMax === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["repsMax"],
        message: "Indica el máximo de repeticiones.",
      })
    }
    if (
      exercise.repsMin !== undefined &&
      exercise.repsMax !== undefined &&
      exercise.repsMin > exercise.repsMax
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["repsMax"],
        message: "El máximo debe ser mayor o igual que el mínimo.",
      })
    }
    if (exercise.weightValue !== undefined && !exercise.weightUnit) {
      ctx.addIssue({
        code: "custom",
        path: ["weightUnit"],
        message: "Indica la unidad del peso.",
      })
    }
  })

export const planSessionSchema = z.object({
  sessionId: z.string().trim().min(1).nullable().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Ponle nombre a la sesión.")
    .max(80, "Máximo 80 caracteres."),
  exercises: z.array(planExerciseSchema).min(1, "Añade al menos un ejercicio."),
})

export const workoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ponle nombre al plan.")
    .max(80, "Máximo 80 caracteres."),
  description: z.string().trim().max(500, "Máximo 500 caracteres.").optional(),
  visibility: z.enum(["private", "public"]),
  status: z.enum(["draft", "published"]),
  sessions: z
    .array(planSessionSchema)
    .min(1, "Un plan necesita al menos una sesión.")
    .max(
      PLAN_LIMITS.maxSessions,
      `Máximo ${PLAN_LIMITS.maxSessions} sesiones.`
    ),
})

export type WorkoutInput = z.input<typeof workoutSchema>
export type PlanInput = z.output<typeof workoutSchema>
export type WorkoutField = keyof WorkoutInput
