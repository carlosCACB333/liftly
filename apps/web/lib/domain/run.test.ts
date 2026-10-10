import { describe, expect, test } from "bun:test"
import {
  buildHistoryMap,
  countSetsDone,
  exerciseProgress,
  findExerciseCursor,
  findRunPosition,
  formatClock,
  formatHistoryReference,
  formatHistorySummary,
  formatRelativeDate,
  historyKey,
  isToday,
} from "./run"

describe("formatClock", () => {
  test("cuenta atrás o cronómetro en MM:SS", () => {
    expect(formatClock(0)).toBe("00:00")
    expect(formatClock(7)).toBe("00:07")
    expect(formatClock(65)).toBe("01:05")
    expect(formatClock(600)).toBe("10:00")
  })

  test("con horas usa H:MM:SS", () => {
    expect(formatClock(3600)).toBe("1:00:00")
    expect(formatClock(3661)).toBe("1:01:01")
  })

  test("negativos y no enteros se sanean", () => {
    expect(formatClock(-5)).toBe("00:00")
    expect(formatClock(59.9)).toBe("00:59")
  })
})

describe("findRunPosition", () => {
  const three = { sets: 3 }
  const two = { sets: 2 }

  test("sin ejercicios no hay posición", () => {
    expect(findRunPosition([], [])).toBeNull()
    expect(findRunPosition([], [{ exercisePosition: 0, setNumber: 1 }])).toBeNull()
  })

  test("sin series registradas empieza por la primera", () => {
    expect(findRunPosition([three, two], [])).toEqual({ exerciseIndex: 0, setNumber: 1 })
  })

  test("registros fuera de orden: devuelve la primera hueco", () => {
    expect(
      findRunPosition(
        [three],
        [
          { exercisePosition: 0, setNumber: 1 },
          { exercisePosition: 0, setNumber: 3 },
        ]
      )
    ).toEqual({ exerciseIndex: 0, setNumber: 2 })
  })

  test("avanza al siguiente ejercicio al completar el anterior", () => {
    expect(
      findRunPosition(
        [three, two],
        [
          { exercisePosition: 0, setNumber: 1 },
          { exercisePosition: 0, setNumber: 2 },
          { exercisePosition: 0, setNumber: 3 },
        ]
      )
    ).toEqual({ exerciseIndex: 1, setNumber: 1 })
  })

  test("todo registrado devuelve null", () => {
    expect(
      findRunPosition(
        [two],
        [
          { exercisePosition: 0, setNumber: 1 },
          { exercisePosition: 0, setNumber: 2 },
        ]
      )
    ).toBeNull()
  })

  test("registros fuera de rango se ignoran", () => {
    expect(
      findRunPosition(
        [two],
        [
          { exercisePosition: 5, setNumber: 1 },
          { exercisePosition: 0, setNumber: 9 },
        ]
      )
    ).toEqual({ exerciseIndex: 0, setNumber: 1 })
  })

  test("casan por position real aunque no sea contigua", () => {
    expect(
      findRunPosition(
        [{ position: 2, sets: 2 }, { position: 7, sets: 1 }],
        [{ exercisePosition: 2, setNumber: 1 }]
      )
    ).toEqual({ exerciseIndex: 0, setNumber: 2 })
    expect(
      findRunPosition(
        [{ position: 2, sets: 1 }, { position: 7, sets: 1 }],
        [
          { exercisePosition: 2, setNumber: 1 },
          { exercisePosition: 7, setNumber: 1 },
        ]
      )
    ).toBeNull()
  })
})

describe("countSetsDone", () => {
  test("cuenta solo registros válidos", () => {
    const exercises = [{ sets: 3 }, { sets: 2 }]
    expect(
      countSetsDone(exercises, [
        { exercisePosition: 0, setNumber: 1 },
        { exercisePosition: 0, setNumber: 2 },
        { exercisePosition: 0, setNumber: 9 },
        { exercisePosition: 4, setNumber: 1 },
      ])
    ).toBe(2)
    expect(countSetsDone(exercises, [])).toBe(0)
  })

  test("cuenta registros cuyo position real apunta a un ejercicio válido", () => {
    expect(
      countSetsDone(
        [{ position: 3, sets: 2 }],
        [
          { exercisePosition: 3, setNumber: 1 },
          { exercisePosition: 3, setNumber: 5 },
          { exercisePosition: 1, setNumber: 1 },
        ]
      )
    ).toBe(1)
  })
})

describe("findExerciseCursor", () => {
  const three = { position: 0, sets: 3 }
  const two = { position: 1, sets: 2 }
  const other = { position: 4, sets: 2 }

  test("sin ejercicio activo se comporta como findRunPosition", () => {
    expect(findExerciseCursor([three, two], [], null)).toEqual({ exerciseIndex: 0, setNumber: 1 })
    expect(
      findExerciseCursor(
        [three, two],
        [
          { exercisePosition: 0, setNumber: 1 },
          { exercisePosition: 0, setNumber: 2 },
          { exercisePosition: 0, setNumber: 3 },
        ],
        null
      )
    ).toEqual({ exerciseIndex: 1, setNumber: 1 })
  })

  test("el ejercicio activo manda aunque haya huecos antes", () => {
    expect(
      findExerciseCursor([three, two], [{ exercisePosition: 0, setNumber: 1 }], 1)
    ).toEqual({ exerciseIndex: 1, setNumber: 1 })
    expect(
      findExerciseCursor([three, two], [{ exercisePosition: 1, setNumber: 1 }], 1)
    ).toEqual({ exerciseIndex: 1, setNumber: 2 })
  })

  test("avanza dentro del ejercicio activo por position real", () => {
    expect(
      findExerciseCursor(
        [three, other],
        [
          { exercisePosition: 0, setNumber: 1 },
          { exercisePosition: 4, setNumber: 1 },
        ],
        4
      )
    ).toEqual({ exerciseIndex: 1, setNumber: 2 })
  })

  test("sin series pendientes en el activo vuelve al primer hueco", () => {
    expect(
      findExerciseCursor(
        [three, two],
        [
          { exercisePosition: 1, setNumber: 1 },
          { exercisePosition: 1, setNumber: 2 },
        ],
        1
      )
    ).toEqual({ exerciseIndex: 0, setNumber: 1 })
    expect(
      findExerciseCursor(
        [three],
        [
          { exercisePosition: 0, setNumber: 1 },
          { exercisePosition: 0, setNumber: 2 },
          { exercisePosition: 0, setNumber: 3 },
        ],
        0
      )
    ).toBeNull()
  })

  test("un ejercicio activo inexistente se ignora", () => {
    expect(findExerciseCursor([three], [], 99)).toEqual({ exerciseIndex: 0, setNumber: 1 })
  })

  test("activeSet fija la serie aunque esté registrada", () => {
    expect(
      findExerciseCursor(
        [three, two],
        [
          { exercisePosition: 0, setNumber: 1 },
          { exercisePosition: 0, setNumber: 2 },
          { exercisePosition: 0, setNumber: 3 },
        ],
        0,
        2
      )
    ).toEqual({ exerciseIndex: 0, setNumber: 2 })
  })

  test("activeSet se limita al rango del ejercicio", () => {
    expect(findExerciseCursor([three, two], [], 1, 99)).toEqual({
      exerciseIndex: 1,
      setNumber: 2,
    })
    expect(findExerciseCursor([three, two], [], 1, -5)).toEqual({
      exerciseIndex: 1,
      setNumber: 1,
    })
  })

  test("activeSet sin ejercicio activo se ignora", () => {
    expect(findExerciseCursor([three, two], [], null, 2)).toEqual({
      exerciseIndex: 0,
      setNumber: 1,
    })
  })
})

describe("buildHistoryMap", () => {
  const base = {
    exerciseNameSnapshot: "Press banca",
    reps: 8,
    durationSec: null,
    weightValue: 60,
    weightUnit: "kg",
    skipped: false,
    createdAt: "2026-10-01T10:00:00.000Z",
  }

  test("la entrada más reciente por nombre gana", () => {
    const map = buildHistoryMap([
      { ...base, weightValue: 62.5, createdAt: "2026-10-05T10:00:00.000Z" },
      { ...base, weightValue: 60 },
    ])
    expect(map["press banca"]).toMatchObject({
      reps: 8,
      weightValue: 62.5,
      loggedAt: "2026-10-05T10:00:00.000Z",
    })
  })

  test("normaliza el nombre para casar", () => {
    const map = buildHistoryMap([{ ...base, exerciseNameSnapshot: "  Press Banca " }])
    expect(map["press banca"]).toBeDefined()
    expect(Object.keys(map)).toHaveLength(1)
  })

  test("ignora omitidos y registros sin datos útiles", () => {
    const map = buildHistoryMap([
      { ...base, skipped: true },
      { ...base, reps: null, durationSec: null, weightValue: null },
    ])
    expect(map["press banca"]).toBeUndefined()
  })

  test("conserva ejercicios de tiempo y registro de solo peso", () => {
    const map = buildHistoryMap([
      { ...base, exerciseNameSnapshot: "Plancha", reps: null, durationSec: 45, weightValue: null },
      { ...base, exerciseNameSnapshot: "Curl martillo", reps: null, weightValue: 14 },
    ])
    expect(map["plancha"]).toMatchObject({ durationSec: 45, reps: null })
    expect(map["curl martillo"]).toMatchObject({ weightValue: 14, reps: null })
  })
})

describe("historyKey", () => {
  test("recorta y pasa a minúsculas", () => {
    expect(historyKey(" Press Banca ")).toBe("press banca")
  })
})

describe("formatHistoryReference", () => {
  test("combina peso, reps y fecha", () => {
    expect(
      formatHistoryReference({
        reps: 8,
        durationSec: null,
        weightValue: 60,
        weightUnit: "kg",
        loggedAt: "2026-10-03T10:00:00.000Z",
      })
    ).toBe("60 kg × 8 · 3 oct")
  })

  test("sin peso solo muestra reps", () => {
    expect(
      formatHistoryReference({
        reps: 12,
        durationSec: null,
        weightValue: null,
        weightUnit: null,
        loggedAt: "2026-10-03T10:00:00.000Z",
      })
    ).toBe("12 reps · 3 oct")
  })

  test("ejercicio de tiempo muestra la duración", () => {
    expect(
      formatHistoryReference({
        reps: null,
        durationSec: 45,
        weightValue: null,
        weightUnit: null,
        loggedAt: "2026-10-03T10:00:00.000Z",
      })
    ).toBe("00:45 · 3 oct")
  })
})

describe("exerciseProgress", () => {
  test("cuenta hechas y pendientes por position real", () => {
    expect(
      exerciseProgress(
        [{ position: 0, sets: 3 }, { position: 4, sets: 2 }],
        [
          { exercisePosition: 0, setNumber: 1 },
          { exercisePosition: 0, setNumber: 3 },
          { exercisePosition: 4, setNumber: 9 },
        ]
      )
    ).toEqual([
      { exerciseIndex: 0, position: 0, sets: 3, done: 2, pending: 1 },
      { exerciseIndex: 1, position: 4, sets: 2, done: 0, pending: 2 },
    ])
  })
})

describe("formatHistorySummary", () => {
  const base = {
    reps: 8,
    durationSec: null,
    weightValue: 60,
    weightUnit: "kg",
    loggedAt: "2026-10-03T10:00:00.000Z",
  }

  test("combina peso y reps sin repetir la palabra reps", () => {
    expect(formatHistorySummary(base)).toBe("60 kg × 8")
  })

  test("sin peso muestra reps", () => {
    expect(formatHistorySummary({ ...base, weightValue: null, weightUnit: null })).toBe("8 reps")
  })

  test("ejercicio de tiempo muestra duración", () => {
    expect(
      formatHistorySummary({ ...base, reps: null, weightValue: null, weightUnit: null, durationSec: 45 })
    ).toBe("00:45")
  })

  test("sin datos devuelve null", () => {
    expect(
      formatHistorySummary({ ...base, reps: null, weightValue: null, weightUnit: null })
    ).toBeNull()
  })
})

describe("isToday", () => {
  const now = new Date("2026-10-10T18:00:00.000Z")

  test("cierto el mismo día natural", () => {
    expect(isToday("2026-10-10T07:00:00.000Z", new Date("2026-10-10T23:00:00.000Z"))).toBe(true)
  })

  test("falso en otro día", () => {
    expect(isToday("2026-10-09T23:00:00.000Z", now)).toBe(false)
  })
})

describe("formatRelativeDate", () => {
  const now = new Date("2026-10-10T12:00:00.000Z")

  test("días recientes en lenguaje natural", () => {
    expect(formatRelativeDate("2026-10-10T07:00:00.000Z", now)).toBe("hoy")
    expect(formatRelativeDate("2026-10-09T23:00:00.000Z", now)).toBe("ayer")
    expect(formatRelativeDate("2026-10-07T12:00:00.000Z", now)).toBe("hace 3 días")
  })

  test("semanas, meses y años", () => {
    expect(formatRelativeDate("2026-10-01T12:00:00.000Z", now)).toBe("hace 1 semana")
    expect(formatRelativeDate("2026-09-20T12:00:00.000Z", now)).toBe("hace 2 semanas")
    expect(formatRelativeDate("2026-08-01T12:00:00.000Z", now)).toBe("hace 2 meses")
    expect(formatRelativeDate("2025-06-01T12:00:00.000Z", now)).toBe("hace 1 año")
  })
})
