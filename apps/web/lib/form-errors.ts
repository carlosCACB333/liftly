import type { FieldErrors } from "react-hook-form"
import type { WorkoutInput } from "@/lib/validations/workout"

function read(errors: unknown, path: string): unknown {
  let current = errors
  for (const key of path.split(".")) {
    if (typeof current !== "object" || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

export function fieldErrorMessage(
  errors: FieldErrors<WorkoutInput>,
  path: string
): string | undefined {
  const found = read(errors, path)
  if (typeof found === "object" && found !== null && "message" in found) {
    const message = (found as { message?: unknown }).message
    if (typeof message === "string") return message
  }
  return undefined
}
