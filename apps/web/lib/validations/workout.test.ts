import { describe, expect, test } from "vitest"
import { PLAN_LIMITS } from "@/lib/domain/plan"
import { workoutSchema, type WorkoutInput } from "./workout"

type PlanExercise = WorkoutInput["sessions"][number]["exercises"][number]

function exercise(overrides: Partial<PlanExercise> = {}): PlanExercise {
  return {
    name: "Press de banca",
    muscleGroup: "pecho",
    sets: 4,
    repsMin: 8,
    repsMax: 12,
    weightValue: 60,
    weightUnit: "kg",
    restMin: 2,
    notes: "",
    ...overrides,
  }
}

function plan(overrides: Partial<WorkoutInput> = {}): WorkoutInput {
  return {
    name: "Empuje de tren superior",
    description: "",
    visibility: "private",
    status: "draft",
    sessions: [{ name: "Sesión 1", exercises: [exercise()] }],
    ...overrides,
  }
}

function messages(input: WorkoutInput) {
  const result = workoutSchema.safeParse(input)
  if (result.success) return []
  return result.error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }))
}

describe("workoutSchema", () => {
  test("acepta un plan válido con repeticiones", () => {
    expect(workoutSchema.safeParse(plan()).success).toBe(true)
  })

  test("acepta un ejercicio basado en duración sin repeticiones", () => {
    const input = plan({
      sessions: [
        {
          name: "Sesión 1",
          exercises: [
            exercise({
              repsMin: undefined,
              repsMax: undefined,
              durationMin: 30,
            }),
          ],
        },
      ],
    })
    expect(workoutSchema.safeParse(input).success).toBe(true)
  })

  test("repeticiones y duración son excluyentes", () => {
    const issues = messages(
      plan({
        sessions: [
          {
            name: "Sesión 1",
            exercises: [exercise({ durationMin: 30 })],
          },
        ],
      })
    )
    expect(
      issues.some((issue) => issue.message.includes("pero no ambas"))
    ).toBe(true)
  })

  test("sin repeticiones ni duración no es válido", () => {
    const issues = messages(
      plan({
        sessions: [
          {
            name: "Sesión 1",
            exercises: [exercise({ repsMin: undefined, repsMax: undefined })],
          },
        ],
      })
    )
    expect(
      issues.some((issue) => issue.message.includes("pero no ambas"))
    ).toBe(true)
  })

  test("reps máximas menor que mínimas", () => {
    const issues = messages(
      plan({
        sessions: [
          {
            name: "Sesión 1",
            exercises: [exercise({ repsMin: 12, repsMax: 8 })],
          },
        ],
      })
    )
    expect(
      issues.some((issue) => issue.path === "sessions.0.exercises.0.repsMax")
    ).toBe(true)
  })

  test("las cadenas vacías de los inputs numéricos se ignoran", () => {
    const result = workoutSchema.safeParse({
      ...plan({
        sessions: [
          {
            name: "Sesión 1",
            exercises: [
              exercise({
                repsMin: "" as unknown as number,
                repsMax: "" as unknown as number,
                durationMin: 45,
              }),
            ],
          },
        ],
      }),
    })
    expect(result.success).toBe(true)
  })

  test("las series deben estar entre los límites", () => {
    const issues = messages(
      plan({
        sessions: [
          {
            name: "Sesión 1",
            exercises: [exercise({ sets: PLAN_LIMITS.sets.max + 1 })],
          },
        ],
      })
    )
    expect(
      issues.some((issue) => issue.path === "sessions.0.exercises.0.sets")
    ).toBe(true)
  })

  test("una sesión necesita al menos un ejercicio", () => {
    const issues = messages(
      plan({ sessions: [{ name: "Sesión 1", exercises: [] }] })
    )
    expect(
      issues.some((issue) => issue.message.includes("al menos un ejercicio"))
    ).toBe(true)
  })

  test("no se admiten más de 10 sesiones", () => {
    const sessions = Array.from(
      { length: PLAN_LIMITS.maxSessions + 1 },
      (_, index): WorkoutInput["sessions"][number] => ({
        name: `Sesión ${index + 1}`,
        exercises: [exercise()],
      })
    )
    const issues = messages(plan({ sessions }))
    expect(issues.some((issue) => issue.message.includes("Máximo 10"))).toBe(
      true
    )
  })

  test("el plan necesita nombre", () => {
    const issues = messages(plan({ name: "   " }))
    expect(issues.some((issue) => issue.path === "name")).toBe(true)
  })

  test("la visibilidad debe ser explícita", () => {
    const input = plan()
    delete (input as Partial<WorkoutInput>).visibility
    expect(workoutSchema.safeParse(input).success).toBe(false)
  })

  test("el grupo muscular debe ser uno conocido", () => {
    const issues = messages(
      plan({
        sessions: [
          {
            name: "Sesión 1",
            exercises: [exercise({ muscleGroup: "inventado" })],
          },
        ],
      })
    )
    expect(
      issues.some(
        (issue) => issue.path === "sessions.0.exercises.0.muscleGroup"
      )
    ).toBe(true)
  })

  test("el grupo muscular es obligatorio", () => {
    const issues = messages(
      plan({
        sessions: [
          { name: "Sesión 1", exercises: [exercise({ muscleGroup: "" })] },
        ],
      })
    )
    expect(
      issues.some(
        (issue) => issue.path === "sessions.0.exercises.0.muscleGroup"
      )
    ).toBe(true)
  })

  test("demoUrls es opcional y admite enlaces http(s)", () => {
    expect(workoutSchema.safeParse(plan()).success).toBe(true)

    const withUrl = plan({
      sessions: [
        {
          name: "Sesión 1",
          exercises: [
            exercise({ demoUrls: ["https://www.youtube.com/watch?v=abc"] }),
          ],
        },
      ],
    })
    expect(workoutSchema.safeParse(withUrl).success).toBe(true)

    const blanks = plan({
      sessions: [
        {
          name: "Sesión 1",
          exercises: [
            exercise({
              demoUrls: ["  ", "  https://example.com/demo.mp4  ", ""],
            }),
          ],
        },
      ],
    })
    const parsed = workoutSchema.safeParse(blanks)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      const saved = parsed.data.sessions[0]?.exercises[0]
      expect(saved).toBeDefined()
      expect(saved?.demoUrls).toEqual(["https://example.com/demo.mp4"])
    }

    const missing = plan({
      sessions: [
        { name: "Sesión 1", exercises: [exercise({ demoUrls: undefined })] },
      ],
    })
    const parsedMissing = workoutSchema.safeParse(missing)
    expect(parsedMissing.success).toBe(true)
    if (parsedMissing.success) {
      expect(parsedMissing.data.sessions[0]?.exercises[0]?.demoUrls).toEqual([])
    }
  })

  test("demoUrls rechaza enlaces no http(s)", () => {
    for (const url of [
      "nope",
      "ftp://example.com/video.mp4",
      "javascript:alert(1)",
    ]) {
      const issues = messages(
        plan({
          sessions: [
            { name: "Sesión 1", exercises: [exercise({ demoUrls: [url] })] },
          ],
        })
      )
      expect(
        issues.some(
          (issue) => issue.path === "sessions.0.exercises.0.demoUrls.0"
        )
      ).toBe(true)
    }
  })

  test("demoUrls no admite más enlaces que el límite", () => {
    const urls = Array.from(
      { length: PLAN_LIMITS.demoUrls.max + 1 },
      (_, index) => `https://example.com/demo-${index}`
    )
    const issues = messages(
      plan({
        sessions: [
          { name: "Sesión 1", exercises: [exercise({ demoUrls: urls })] },
        ],
      })
    )
    expect(
      issues.some(
        (issue) =>
          issue.path === "sessions.0.exercises.0.demoUrls" &&
          issue.message.includes(`Máximo ${PLAN_LIMITS.demoUrls.max}`)
      )
    ).toBe(true)
  })
})
