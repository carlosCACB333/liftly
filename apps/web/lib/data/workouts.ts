import { db } from "@workspace/db"
import { planContentsMatch } from "@/lib/domain/plan"

const Plan = db.orm.public.TrainingPlan
const Session = db.orm.public.PlanSession
const Like = db.orm.public.PlanLike

export const FEED_PAGE_SIZE = 24
export const PROFILE_PAGE_SIZE = 24

export type WorkoutCard = {
  id: string
  name: string
  description: string | null
  isPublished: boolean
  likeCount: number
  createdAt: string
  updatedAt: string
  authorId: string
  authorName: string
  authorImage: string | null
  sessionsCount: number
  exercisesCount: number
  muscleGroups: string[]
  likedByMe: boolean
  copiesCount: number
}

export type WorkoutExerciseDetail = {
  id: string
  order: number
  name: string
  muscleGroup: string
  sets: number
  repsMin: number | null
  repsMax: number | null
  durationMin: number | null
  weightValue: number | null
  weightUnit: string | null
  restMin: number
  notes: string | null
  demoUrls: string[]
}

export type WorkoutSessionDetail = {
  id: string
  name: string
  position: number
  exercises: WorkoutExerciseDetail[]
}

export type WorkoutDetail = {
  id: string
  name: string
  description: string | null
  isPublished: boolean
  likeCount: number
  sourceWorkoutId: string | null
  sourceWorkoutName: string
  sourceAuthorName: string
  createdAt: string
  updatedAt: string
  author: { id: string; name: string } | null
  sessions: WorkoutSessionDetail[]
  muscleGroups: string[]
  exercisesCount: number
  likedByMe: boolean
  joinedByMe: boolean
  copiesCount: number
  sourceAccessible: boolean
  sourceOutdated: boolean
  sourceHasNewerVersion: boolean
}

function toCard(
  row: {
    id: string
    name: string
    description: string | null
    visibility: string
    likeCount: number
    createdAt: string
    updatedAt: string
    user?: { id: string; name: string; image: string | null } | null
  },
  summary: { count: number; sessions: number; muscleGroups: string[] },
  likedByMe: boolean,
  copiesCount: number
): WorkoutCard {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isPublished: row.visibility === "public",
    likeCount: row.likeCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    authorId: row.user?.id ?? "",
    authorName: row.user?.name ?? "Usuario",
    authorImage: row.user?.image ?? null,
    sessionsCount: summary.sessions,
    exercisesCount: summary.count,
    muscleGroups: summary.muscleGroups,
    likedByMe,
    copiesCount,
  }
}

async function summaries(planIds: string[]) {
  const rows = planIds.length
    ? await Session.where((session) => session.planId.in(planIds))
        .include("exercises")
        .all()
    : []
  const result = new Map<
    string,
    { count: number; sessions: number; muscleGroups: string[] }
  >()
  for (const session of rows) {
    const summary = result.get(session.planId) ?? {
      count: 0,
      sessions: 0,
      muscleGroups: [],
    }
    summary.sessions += 1
    for (const exercise of session.exercises) {
      summary.count += 1
      if (!summary.muscleGroups.includes(exercise.muscleGroup))
        summary.muscleGroups.push(exercise.muscleGroup)
    }
    result.set(session.planId, summary)
  }
  return result
}

const EMPTY_SUMMARY = { count: 0, sessions: 0, muscleGroups: [] }

async function likedPlanIds(userId: string | undefined) {
  if (!userId) return new Set<string>()
  const rows = await Like.where({ userId }).select("planId").all()
  return new Set(rows.map((row) => row.planId))
}

async function copyCounts(planIds: string[]) {
  const result = new Map<string, number>()
  if (!planIds.length) return result
  const rows = await Plan.where((plan) => plan.copiedFromPlanId.in(planIds))
    .groupBy("copiedFromPlanId")
    .aggregate((aggregate) => ({ copies: aggregate.count() }))
  for (const row of rows) {
    if (row.copiedFromPlanId) result.set(row.copiedFromPlanId, row.copies)
  }
  return result
}

export async function getPublishedWorkouts(
  currentUserId: string | undefined,
  sort: "popular" | "recent" = "recent"
) {
  const plans = await Plan.where({ visibility: "public" })
    .include("user")
    .orderBy(
      sort === "popular"
        ? (plan) => plan.likeCount.desc()
        : (plan) => plan.createdAt.desc()
    )
    .limit(FEED_PAGE_SIZE)
    .all()
  const [summary, liked, copies] = await Promise.all([
    summaries(plans.map((plan) => plan.id)),
    likedPlanIds(currentUserId),
    copyCounts(plans.map((plan) => plan.id)),
  ])
  return plans.map((plan) =>
    toCard(
      plan,
      summary.get(plan.id) ?? EMPTY_SUMMARY,
      liked.has(plan.id),
      copies.get(plan.id) ?? 0
    )
  )
}

export async function getMyWorkouts(userId: string) {
  const plans = await Plan.where({ userId })
    .include("user")
    .orderBy((plan) => plan.updatedAt.desc())
    .limit(50)
    .all()
  const [summary, copies] = await Promise.all([
    summaries(plans.map((plan) => plan.id)),
    copyCounts(plans.map((plan) => plan.id)),
  ])
  return plans.map((plan) =>
    toCard(
      plan,
      summary.get(plan.id) ?? EMPTY_SUMMARY,
      false,
      copies.get(plan.id) ?? 0
    )
  )
}

export type UserProfile = {
  user: {
    id: string
    name: string
    email: string | null
    image: string | null
    createdAt: string
  }
  isOwn: boolean
  workouts: WorkoutCard[]
}

export async function getUserProfile(
  profileUserId: string,
  currentUserId: string | undefined
): Promise<UserProfile | null> {
  const user = await db.orm.public.User.where({ id: profileUserId }).first()
  if (!user) return null

  const isOwn = user.id === currentUserId
  const email = isOwn ? user.email : null

  const plansQuery = Plan.where({
    userId: profileUserId,
    ...(isOwn ? {} : { visibility: "public" }),
  })
    .include("user")
    .orderBy((plan) => plan.createdAt.desc())
  const plans = isOwn
    ? await plansQuery.all()
    : await plansQuery.limit(PROFILE_PAGE_SIZE).all()
  const [summary, liked, copies] = await Promise.all([
    summaries(plans.map((plan) => plan.id)),
    likedPlanIds(currentUserId),
    copyCounts(plans.map((plan) => plan.id)),
  ])

  return {
    user: {
      id: user.id,
      name: user.name,
      email,
      image: user.image,
      createdAt: user.createdAt,
    },
    isOwn,
    workouts: plans.map((plan) =>
      toCard(
        plan,
        summary.get(plan.id) ?? EMPTY_SUMMARY,
        liked.has(plan.id),
        copies.get(plan.id) ?? 0
      )
    ),
  }
}

async function sessionDetails(planId: string): Promise<WorkoutSessionDetail[]> {
  const sessions = await Session.where({ planId }).include("exercises").all()
  return sessions
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((session) => ({
      id: session.id,
      name: session.name,
      position: session.position,
      exercises: session.exercises
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((exercise) => ({
          id: exercise.id,
          order: exercise.position,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          sets: exercise.sets,
          repsMin: exercise.repsMin,
          repsMax: exercise.repsMax,
          durationMin: exercise.durationMin,
          weightValue: exercise.weightValue,
          weightUnit: exercise.weightUnit,
          restMin: exercise.restMin,
          notes: exercise.notes,
          demoUrls: [...exercise.demoUrls],
        })),
    }))
}

export async function getWorkoutDetail(
  planId: string,
  currentUserId: string | undefined
): Promise<WorkoutDetail | null> {
  const plan = await Plan.where({ id: planId }).include("user").first()
  if (!plan || (plan.visibility !== "public" && plan.userId !== currentUserId))
    return null
  const liked = currentUserId
    ? await Like.where({ planId, userId: currentUserId }).first()
    : null
  const copied = currentUserId
    ? await Plan.where({
        userId: currentUserId,
        copiedFromPlanId: planId,
      }).first()
    : null
  const { copiesCount } = await Plan.where({
    copiedFromPlanId: planId,
  }).aggregate((aggregate) => ({ copiesCount: aggregate.count() }))
  const planSessions = await sessionDetails(planId)

  const isOwner = plan.userId === currentUserId
  const source = plan.copiedFromPlanId
    ? await Plan.where({ id: plan.copiedFromPlanId })
        .select("id", "userId", "visibility", "updatedAt")
        .first()
    : null
  const sourceAccessible = Boolean(
    source &&
    (source.visibility === "public" || source.userId === currentUserId)
  )
  let sourceOutdated = false
  let sourceHasNewerVersion = false
  if (source && sourceAccessible && isOwner) {
    const sourceSessions = await sessionDetails(source.id)
    sourceOutdated = !planContentsMatch(planSessions, sourceSessions)
    sourceHasNewerVersion =
      sourceOutdated &&
      new Date(source.updatedAt).getTime() > new Date(plan.createdAt).getTime()
  }

  const exerciseList = planSessions.flatMap((session) => session.exercises)
  const muscleGroups = [
    ...new Set(exerciseList.map((exercise) => exercise.muscleGroup)),
  ]

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    isPublished: plan.visibility === "public",
    likeCount: plan.likeCount,
    sourceWorkoutId: plan.copiedFromPlanId,
    sourceWorkoutName: plan.copiedFromName ?? "",
    sourceAuthorName: plan.copiedFromAuthorName ?? "",
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    author: plan.user ? { id: plan.user.id, name: plan.user.name } : null,
    sessions: planSessions,
    muscleGroups,
    exercisesCount: exerciseList.length,
    likedByMe: Boolean(liked),
    joinedByMe: Boolean(copied),
    copiesCount,
    sourceAccessible,
    sourceOutdated,
    sourceHasNewerVersion,
  }
}

export function isWorkoutOwner(
  detail: Pick<WorkoutDetail, "author">,
  currentUserId: string | undefined
) {
  return Boolean(currentUserId && detail.author?.id === currentUserId)
}

export async function getPublishedWorkoutSitemap() {
  return Plan.where({ visibility: "public" })
    .select("id", "updatedAt")
    .orderBy((plan) => plan.updatedAt.desc())
    .all()
}
