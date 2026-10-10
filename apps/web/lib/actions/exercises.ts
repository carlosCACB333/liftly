"use server"

import { z } from "zod"
import { searchPublicExercises } from "@/lib/data/exercises"

const searchQuerySchema = z
  .string()
  .trim()
  .min(2, "Busca al menos 2 caracteres.")
  .max(100, "Búsqueda demasiado larga.")

export async function searchPublicExercisesAction(rawQuery: string) {
  const query = searchQuerySchema.safeParse(rawQuery)
  if (!query.success) return []
  return searchPublicExercises(query.data)
}
