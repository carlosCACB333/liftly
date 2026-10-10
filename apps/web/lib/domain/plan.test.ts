import { describe, expect, test } from "bun:test"
import {
  planContentsMatch,
  type PlanContentExercise,
  type PlanContentSession,
} from "./plan"

function exercise(
  overrides: Partial<PlanContentExercise> = {}
): PlanContentExercise {
  return {
    name: "Press de banca",
    muscleGroup: "pecho",
    order: 0,
    sets: 4,
    repsMin: 8,
    repsMax: 12,
    durationMin: null,
    weightValue: 60,
    weightUnit: "kg",
    restMin: 2,
    notes: null,
    demoUrls: [],
    ...overrides,
  }
}

function session(overrides: Partial<PlanContentSession> = {}): PlanContentSession {
  return {
    name: "Sesión 1",
    position: 0,
    exercises: [exercise()],
    ...overrides,
  }
}

describe("planContentsMatch", () => {
  test("contenido idéntico coincide", () => {
    expect(planContentsMatch([session()], [session()])).toBe(true)
    expect(
      planContentsMatch(
        [session({ exercises: [exercise(), exercise({ name: "Remo" })] })],
        [session({ exercises: [exercise(), exercise({ name: "Remo" })] })]
      )
    ).toBe(true)
  })

  test("distinto número de sesiones no coincide", () => {
    expect(planContentsMatch([session()], [])).toBe(false)
    expect(
      planContentsMatch([session()], [session(), session({ name: "Sesión 2" })])
    ).toBe(false)
  })

  test("nombre o posición de sesión distintos no coinciden", () => {
    expect(planContentsMatch([session()], [session({ name: "Otra" })])).toBe(
      false
    )
    expect(planContentsMatch([session()], [session({ position: 1 })])).toBe(
      false
    )
  })

  test("parámetros del ejercicio distintos no coinciden", () => {
    const variants: Partial<PlanContentExercise>[] = [
      { name: "Press con mancuernas" },
      { muscleGroup: "hombros" },
      { order: 2 },
      { sets: 3 },
      { repsMin: 6 },
      { repsMax: 20 },
      { durationMin: 30 },
      { weightValue: 40 },
      { weightUnit: "lb" },
      { restMin: 5 },
      { notes: "Agarre cerrado" },
      { demoUrls: ["https://example.com/demo.mp4"] },
    ]
    for (const overrides of variants) {
      expect(
        planContentsMatch([session()], [session({ exercises: [exercise(overrides)] })])
      ).toBe(false)
    }
  })

  test("recursos demo distintos no coinciden", () => {
    expect(
      planContentsMatch(
        [session({ exercises: [exercise({ demoUrls: ["https://a.example/x"] })] })],
        [session({ exercises: [exercise({ demoUrls: ["https://a.example/y"] })] })]
      )
    ).toBe(false)
    expect(
      planContentsMatch(
        [session({ exercises: [exercise({ demoUrls: ["https://a.example/x"] })] })],
        [
          session({
            exercises: [
              exercise({ demoUrls: ["https://a.example/x", "https://b.example/z"] }),
            ],
          }),
        ]
      )
    ).toBe(false)
  })

  test("distinto número de ejercicios no coincide", () => {
    expect(
      planContentsMatch([session()], [
        session({ exercises: [exercise(), exercise({ name: "Fondos" })] }),
      ])
    ).toBe(false)
  })
})
