export const MUSCLE_GROUPS = [
  { value: "pecho", label: "Pecho" },
  { value: "espalda_dorsal", label: "Espalda dorsal" },
  { value: "espalda_alta", label: "Espalda alta" },
  { value: "espalda_baja", label: "Espalda baja" },
  { value: "hombros", label: "Hombros" },
  { value: "biceps", label: "Bíceps" },
  { value: "triceps", label: "Tríceps" },
  { value: "antebrazos", label: "Antebrazos" },
  { value: "abdominales", label: "Abdominales" },
  { value: "oblicuos", label: "Oblicuos" },
  { value: "transverso_abdominal", label: "Transverso abdominal" },
  { value: "core", label: "Core" },
  { value: "cuadriceps", label: "Cuádriceps" },
  { value: "isquiotibiales", label: "Isquiotibiales" },
  { value: "gluteos", label: "Glúteos" },
  { value: "aductores", label: "Aductores" },
  { value: "abductores", label: "Abductores" },
  { value: "gemelos", label: "Gemelos" },
  { value: "soleo", label: "Sóleo" },
  { value: "tibial_anterior", label: "Tibial anterior" },
  { value: "manguito_rotador", label: "Manguito rotador" },
  { value: "serrato_anterior", label: "Serrato anterior" },
  { value: "cuello", label: "Cuello" },
  { value: "zona_lumbar", label: "Zona lumbar" },
  { value: "cadera", label: "Cadera" },
  { value: "tren_superior", label: "Tren superior" },
  { value: "tren_inferior", label: "Tren inferior" },
  { value: "cuerpo_completo", label: "Cuerpo completo" },
] as const

export type MuscleGroupValue = (typeof MUSCLE_GROUPS)[number]["value"]

export const MUSCLE_GROUP_LABELS: Record<MuscleGroupValue, string> = Object.fromEntries(
  MUSCLE_GROUPS.map((g) => [g.value, g.label])
) as Record<MuscleGroupValue, string>

export function muscleGroupLabel(value: string): string {
  return MUSCLE_GROUP_LABELS[value as MuscleGroupValue] ?? value
}

export function isMuscleGroup(value: string): value is MuscleGroupValue {
  return Object.prototype.hasOwnProperty.call(MUSCLE_GROUP_LABELS, value)
}

export type ExercisePrescription = {
  sets: number
  repsMin: number | null
  repsMax: number | null
  durationMin: number | null
}

export function formatRepsRange(exercise: Pick<ExercisePrescription, "repsMin" | "repsMax">): string | null {
  if (exercise.repsMin == null && exercise.repsMax == null) return null
  if (exercise.repsMin != null && exercise.repsMax != null) {
    return exercise.repsMin === exercise.repsMax
      ? `${exercise.repsMin} reps`
      : `${exercise.repsMin}-${exercise.repsMax} reps`
  }
  const single = exercise.repsMin ?? exercise.repsMax
  return single == null ? null : `${single} reps`
}

export function formatDuration(durationMin: number | null): string | null {
  if (durationMin == null) return null
  if (durationMin < 60) return `${durationMin} min`
  const hours = Math.floor(durationMin / 60)
  const minutes = durationMin % 60
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

export function formatPrescription(exercise: ExercisePrescription): string {
  const target = formatRepsRange(exercise) ?? formatDuration(exercise.durationMin) ?? "sin objetivo"
  return `${exercise.sets} × ${target}`
}

export function formatRest(restMin: number): string | null {
  if (restMin <= 0) return null
  return formatDuration(restMin)
}

export function formatWeight(weightValue: number | null, weightUnit: string | null): string | null {
  if (weightValue == null) return null
  const unit = weightUnit === "lb" ? "lb" : "kg"
  return `${weightValue} ${unit}`
}