import { z } from "zod"
import { PLAN_LIMITS, WEIGHT_UNITS } from "@/lib/domain/plan"
import { RUN_LIMITS } from "@/lib/domain/run"

export const logSetSchema = z
  .object({
    workoutSessionId: z.string().trim().min(1),
    exercisePosition: z
      .number()
      .int()
      .min(RUN_LIMITS.exercisePosition.min)
      .max(RUN_LIMITS.exercisePosition.max),
    setNumber: z.number().int().min(1).max(PLAN_LIMITS.sets.max),
    reps: z
      .number()
      .int()
      .min(PLAN_LIMITS.reps.min)
      .max(PLAN_LIMITS.reps.max)
      .nullable()
      .optional(),
    durationSec: z
      .number()
      .int()
      .min(RUN_LIMITS.durationSec.min)
      .max(RUN_LIMITS.durationSec.max)
      .nullable()
      .optional(),
    weightValue: z.number().min(PLAN_LIMITS.weight.min).nullable().optional(),
    weightUnit: z.enum(WEIGHT_UNITS).nullable().optional(),
    skipped: z.boolean().optional().default(false),
  })
  .superRefine((set, ctx) => {
    if (set.skipped) return
    const hasReps = set.reps != null
    const hasDuration = set.durationSec != null
    if (hasReps === hasDuration) {
      ctx.addIssue({
        code: "custom",
        path: ["reps"],
        message: "Indica repeticiones o tiempo, pero no ambos.",
      })
    }
    if (set.weightValue != null && !set.weightUnit) {
      ctx.addIssue({
        code: "custom",
        path: ["weightUnit"],
        message: "Indica la unidad del peso.",
      })
    }
    if (set.weightValue == null && set.weightUnit) {
      ctx.addIssue({
        code: "custom",
        path: ["weightValue"],
        message: "Indica el peso o deja ambos campos vacíos.",
      })
    }
  })

export type LogSetInput = z.input<typeof logSetSchema>