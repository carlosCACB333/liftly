"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ClipboardCopyIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { copyPlan } from "@/lib/actions/workouts"

const MESSAGES: Record<string, string> = {
  unauthenticated: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
  "not-found": "Este plan ya no existe.",
  forbidden: "No puedes copiar este plan.",
}

export function JoinButton({
  workoutId,
  planName,
}: {
  workoutId: string
  planName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleJoin() {
    if (pending) return
    startTransition(async () => {
      const result = await copyPlan(workoutId)
      if (!result.ok) {
        if (result.reason === "unauthenticated") {
          router.push("/login")
          return
        }
        toast.error(MESSAGES[result.reason] ?? "No se pudo copiar el plan.")
        return
      }
      toast.success(`«${planName}» está en Mis planes. La copia es tuya.`)
      router.push("/my-plans")
    })
  }

  return (
    <Button type="button" size="lg" onClick={handleJoin} disabled={pending}>
      {pending ? <Loader2Icon className="animate-spin" /> : <ClipboardCopyIcon />}
      {pending ? "Copiando…" : "Usar este plan"}
    </Button>
  )
}
