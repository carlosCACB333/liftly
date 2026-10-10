import { describe, expect, test } from "vitest"
import {
  formatDuration,
  formatPrescription,
  formatRest,
  formatRepsRange,
  formatWeight,
  isMuscleGroup,
  muscleGroupLabel,
} from "./exercise"

describe("formatRepsRange", () => {
  test("rango distinto", () => {
    expect(formatRepsRange({ repsMin: 8, repsMax: 12 })).toBe("8-12 reps")
  })

  test("mínimo y máximo iguales", () => {
    expect(formatRepsRange({ repsMin: 12, repsMax: 12 })).toBe("12 reps")
  })

  test("sin repeticiones", () => {
    expect(formatRepsRange({ repsMin: null, repsMax: null })).toBeNull()
  })
})

describe("formatDuration", () => {
  test("minutos", () => {
    expect(formatDuration(30)).toBe("30 min")
  })

  test("horas exactas", () => {
    expect(formatDuration(60)).toBe("1 h")
  })

  test("horas y minutos", () => {
    expect(formatDuration(90)).toBe("1 h 30 min")
  })

  test("sin duración", () => {
    expect(formatDuration(null)).toBeNull()
  })
})

describe("formatPrescription", () => {
  test("series por repeticiones", () => {
    expect(
      formatPrescription({ sets: 4, repsMin: 8, repsMax: 12, durationMin: null })
    ).toBe("4 × 8-12 reps")
  })

  test("series por duración", () => {
    expect(
      formatPrescription({ sets: 3, repsMin: null, repsMax: null, durationMin: 45 })
    ).toBe("3 × 45 min")
  })
})

describe("formatRest y formatWeight", () => {
  test("descanso en minutos y horas", () => {
    expect(formatRest(4)).toBe("4 min")
    expect(formatRest(60)).toBe("1 h")
    expect(formatRest(0)).toBeNull()
  })

  test("peso con unidad", () => {
    expect(formatWeight(60, "kg")).toBe("60 kg")
    expect(formatWeight(25, "lb")).toBe("25 lb")
    expect(formatWeight(null, "kg")).toBeNull()
    expect(formatWeight(60, null)).toBe("60 kg")
  })
})

describe("grupos musculares", () => {
  test("acepta solo valores del listado", () => {
    expect(isMuscleGroup("pecho")).toBe(true)
    expect(isMuscleGroup("cuerpo_completo")).toBe(true)
    expect(isMuscleGroup("piernas")).toBe(false)
    expect(isMuscleGroup("constructor")).toBe(false)
  })

  test("etiqueta conocida y valor desconocido", () => {
    expect(muscleGroupLabel("espalda_dorsal")).toBe("Espalda dorsal")
    expect(muscleGroupLabel("valor_inventado")).toBe("valor_inventado")
  })
})
