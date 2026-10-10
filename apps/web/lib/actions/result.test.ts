import { describe, expect, test } from "bun:test"
import { validationResult } from "./result"

describe("validationResult", () => {
  test("indexa por ruta anidada y conserva el primer mensaje", () => {
    const result = validationResult({
      issues: [
        { path: ["sessions", 0, "exercises", 2, "name"], message: "Ponle nombre al ejercicio." },
        { path: ["sessions", 0, "exercises", 2, "name"], message: "Otro mensaje" },
        { path: ["name"], message: "Ponle nombre al plan." },
      ],
    })

    expect(result.ok).toBe(false)
    expect(result.reason).toBe("validation")
    expect(result.errors["sessions.0.exercises.2.name"]).toBe("Ponle nombre al ejercicio.")
    expect(result.errors["name"]).toBe("Ponle nombre al plan.")
    expect(result.messages).toEqual([
      "Ponle nombre al ejercicio.",
      "Ponle nombre al plan.",
    ])
  })

  test("los mensajes no se repiten", () => {
    const result = validationResult({
      issues: [
        { path: ["sessions", 0, "name"], message: "Repetido" },
        { path: ["sessions", 1, "name"], message: "Repetido" },
      ],
    })

    expect(result.messages).toEqual(["Repetido"])
    expect(Object.keys(result.errors)).toEqual([
      "sessions.0.name",
      "sessions.1.name",
    ])
  })
})
