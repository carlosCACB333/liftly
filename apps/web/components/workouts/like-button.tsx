"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { HeartIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { togglePlanLike } from "@/lib/actions/workouts"

type LikeButtonProps = {
  workoutId: string
  liked: boolean
  count: number
  compact?: boolean
}

export function LikeButton({
  workoutId,
  liked,
  count,
  compact = false,
}: LikeButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState({ liked, count })

  useEffect(() => {
    setOptimistic({ liked, count })
  }, [liked, count])

  function handleToggle() {
    if (isPending) return
    const next = {
      liked: !optimistic.liked,
      count: optimistic.liked ? Math.max(0, optimistic.count - 1) : optimistic.count + 1,
    }
    setOptimistic(next)
    startTransition(async () => {
      const result = await togglePlanLike(workoutId)
      if (!result.ok) {
        setOptimistic({ liked, count })
        if (result.reason === "unauthenticated") {
          router.push("/login")
          return
        }
        toast.error(
          result.reason === "forbidden"
            ? "No puedes dar corazón a este plan."
            : "No se pudo guardar tu corazón."
        )
        return
      }
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "default"}
      onClick={handleToggle}
      aria-pressed={optimistic.liked}
      aria-label={
        optimistic.liked
          ? `Quitar corazón (${optimistic.count})`
          : `Dar corazón (${optimistic.count})`
      }
      className={
        optimistic.liked
          ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
          : "text-muted-foreground hover:text-foreground"
      }
    >
      <HeartIcon className={optimistic.liked ? "size-4 fill-current" : "size-4"} />
      {optimistic.count}
    </Button>
  )
}
