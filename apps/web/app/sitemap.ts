import type { MetadataRoute } from "next"
import { site } from "@/lib/site"
import { getPublishedWorkoutSitemap } from "@/lib/data/workouts"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${site.url}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${site.url}/plans`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ]

  let planRoutes: MetadataRoute.Sitemap = []
  try {
    const plans = await getPublishedWorkoutSitemap()
    planRoutes = plans.map((plan) => ({
      url: `${site.url}/plans/${plan.id}`,
      lastModified: new Date(plan.updatedAt),
      changeFrequency: "weekly",
      priority: 0.6,
    }))
  } catch {
    planRoutes = []
  }

  return [...staticRoutes, ...planRoutes]
}
