import Link from "next/link"
import type { ReactNode } from "react"
import { CalendarIcon, CopyIcon, LayersIcon, DumbbellIcon } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@workspace/ui/components/card"
import { LikeButton } from "@/components/workouts/like-button"
import { muscleGroupLabel } from "@/lib/domain/exercise"
import type { WorkoutCard as WorkoutCardData } from "@/lib/data/workouts"

const MAX_VISIBLE_GROUPS = 4

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function WorkoutCard({
  workout,
  currentUserId,
  actions,
  dateField = "createdAt",
  showLike = true,
}: {
  workout: WorkoutCardData
  currentUserId: string | undefined
  actions?: ReactNode
  dateField?: "createdAt" | "updatedAt"
  showLike?: boolean
}) {
  const date = dateField === "updatedAt" ? workout.updatedAt : workout.createdAt
  const hiddenGroups = workout.muscleGroups.length - MAX_VISIBLE_GROUPS
  const author = (
    <>
      <Avatar className="size-7">
        {workout.authorImage ? (
          <AvatarImage
            src={workout.authorImage}
            alt={workout.authorName}
          />
        ) : null}
        <AvatarFallback className="text-[10px]">
          {initials(workout.authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-medium">
          {workout.authorName}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarIcon className="size-3" />
          <time dateTime={date}>{formatDate(date)}</time>
        </span>
      </div>
    </>
  )

  return (
    <Card className="gap-4">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {workout.authorId ? (
              <Link
                href={`/profile/${workout.authorId}`}
                className="flex min-w-0 items-center gap-2 rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {author}
              </Link>
            ) : (
              <div className="flex min-w-0 items-center gap-2">{author}</div>
            )}
          </div>

          {!workout.isPublished ? (
            <Badge variant="secondary">Privado</Badge>
          ) : null}
        </div>

        <Link
          href={`/plans/${workout.id}`}
          className="rounded-sm text-lg leading-snug font-semibold tracking-tight hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {workout.name}
        </Link>

        {workout.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {workout.description}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-row flex-wrap items-center gap-1.5">
        {workout.muscleGroups.slice(0, MAX_VISIBLE_GROUPS).map((group) => (
          <span
            key={group}
            className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
          >
            {muscleGroupLabel(group)}
          </span>
        ))}
        {hiddenGroups > 0 ? (
          <span className="rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground">
            +{hiddenGroups}
          </span>
        ) : null}
      </CardContent>

      <CardFooter className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <LayersIcon className="size-4" />
            {workout.sessionsCount}{" "}
            {workout.sessionsCount === 1 ? "sesión" : "sesiones"}
          </span>
          <span className="flex items-center gap-1.5">
            <DumbbellIcon className="size-4" />
            {workout.exercisesCount}{" "}
            {workout.exercisesCount === 1 ? "ejercicio" : "ejercicios"}
          </span>
          <span className="flex items-center gap-1.5">
            <CopyIcon className="size-4" />
            {workout.copiesCount}{" "}
            {workout.copiesCount === 1 ? "copia" : "copias"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {showLike ? (
            <LikeButton
              workoutId={workout.id}
              liked={workout.likedByMe}
              count={workout.likeCount}
              compact
            />
          ) : null}
          {actions}
        </div>
      </CardFooter>
    </Card>
  )
}
