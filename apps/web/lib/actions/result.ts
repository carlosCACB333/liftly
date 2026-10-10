export type ValidationFailure = {
  ok: false
  reason: "validation"
  errors: Record<string, string>
  messages: string[]
}

type ValidationIssue = {
  path: PropertyKey[]
  message: string
}

type ValidationErrorLike = { issues: ValidationIssue[] }

export function validationResult(error: ValidationErrorLike): ValidationFailure {
  const errors: Record<string, string> = {}
  const messages: string[] = []

  for (const issue of error.issues) {
    const key = issue.path.map((part) => String(part)).join(".")
    if (key in errors) continue
    errors[key] = issue.message
    if (!messages.includes(issue.message)) messages.push(issue.message)
  }

  return { ok: false, reason: "validation", errors, messages }
}
