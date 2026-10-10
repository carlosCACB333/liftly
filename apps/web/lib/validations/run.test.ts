import { describe, expect, test } from "bun:test"
import { logSetSchema, type LogSetInput } from "./run"

function input(overrides: Partial<LogSetInput> = {}): LogSetInput {
  return {
    workoutSessionId: "ws_1",
    exercisePosition: 0,
    setNumber: 1,
    reps: 10,
    durationSec: null,
    weightValue: 60,
    weightUnit: "kg",
    skipped: false,
    ...overrides,
  }
}

function messages(value: LogSetInput) {
  const result = logSetSchema.safeParse(value)
  if (result.success) return []
  return result.error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }))
}

describe("logSetSchema", () => {
  test("acepta repeticiones con peso", () => {
    expect(messages(input())).toEqual([])
  })

  test("acepta duración sin repeticiones", () => {
    expect(
      messages(input({ reps: null, durationSec: 120, weightValue: null, weightUnit: null }))
    ).toEqual([])
  })

  test("reps y duración no pueden ir juntas", () => {
    expect(messages(input({ reps: 10, durationSec: 60 }))).not.toEqual([])
  })

  test("reps y duración no pueden faltar juntas", () => {
    expect(messages(input({ reps: null, durationSec: null }))).not.toEqual([])
  })

  test("una serie omitida no exige reps ni duración ni peso", () => {
    expect(
      messages(
        input({ skipped: true, reps: null, durationSec: null, weightValue: null, weightUnit: null })
      )
    ).toEqual([])
  })

  test("peso y unidad van juntos", () => {
    expect(messages(input({ weightValue: null }))).not.toEqual([])
    expect(messages(input({ weightUnit: null }))).not.toEqual([])
    expect(messages(input({ weightValue: null, weightUnit: null }))).toEqual([])
  })

  test("limita posición, serie, reps y duración", () => {
    expect(messages(input({ exercisePosition: -1 }))).not.toEqual([])
    expect(messages(input({ setNumber: 0 }))).not.toEqual([])
    expect(messages(input({ setNumber: 21 }))).not.toEqual([])
    expect(messages(input({ reps: 101 }))).not.toEqual([])
    expect(messages(input({ reps: null, durationSec: 13 * 60 * 60 }))).not.toEqual([])
  })
})
