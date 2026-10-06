import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Introduce tu correo electrónico.")
    .email("Introduce un correo electrónico válido."),
  password: z.string().min(1, "Introduce tu contraseña."),
})

export type LoginInput = z.infer<typeof loginSchema>

export type LoginField = keyof LoginInput

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Introduce tu nombre.")
      .max(60, "El nombre es demasiado largo."),
    email: z
      .string()
      .trim()
      .min(1, "Introduce tu correo electrónico.")
      .email("Introduce un correo electrónico válido."),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(72, "La contraseña es demasiado larga."),
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })

export type RegisterInput = z.infer<typeof registerSchema>

export type RegisterField = keyof RegisterInput