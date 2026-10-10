import { z } from "zod"

function isHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Pon tu nombre.")
    .max(80, "Máximo 80 caracteres."),
  image: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres.")
    .nullable()
    .refine(
      (value) => value === null || value === "" || isHttpUrl(value),
      "Introduce un enlace http o https válido."
    )
    .transform((value) => (value ? value : null)),
})

export const PROFILE_NAME_LIMITS = { min: 1, max: 80 } as const
export const PROFILE_IMAGE_URL_MAX_LENGTH = 500

export type ProfileInput = z.input<typeof profileSchema>
export type ProfileData = z.output<typeof profileSchema>
