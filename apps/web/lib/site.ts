const FALLBACK_URL = "http://localhost:3000"

function resolveSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    process.env.BETTER_AUTH_URL

  try {
    return new URL(configured ?? FALLBACK_URL).origin
  } catch {
    return FALLBACK_URL
  }
}

export const site = {
  name: "Liftly",
  url: resolveSiteUrl(),
  description:
    "Crea planes de entrenamiento por sesiones, define series, repeticiones, peso y descanso, y comparte con la comunidad los que quieras.",
  locale: "es_ES",
  keywords: [
    "planes de entrenamiento",
    "rutinas de gimnasio",
    "crear rutina",
    "ejercicios",
    "series y repeticiones",
    "compartir planes",
    "gimnasio",
    "fitness",
  ],
} as const

export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString()
}
