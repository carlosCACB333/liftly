"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Loader2Icon, PlayIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { startSession } from "@/lib/actions/run"

const MESSAGES: Record<string, string> = {
  unauthenticated: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
  "not-found": "Esta sesión del plan ya no existe.",
  forbidden: "No tienes permiso para ejecutar este plan.",
}

type Props = {
  planSessionId: string
  resume: boolean
  /** Salta directamente a este ejercicio de la sesión al abrir el runner. */
  exercisePosition?: number
  /** Renderiza solo el icono (usado dentro de la lista de ejercicios). */
  iconOnly?: boolean
}

export function StartRunButton({
  planSessionId,
  resume,
  exercisePosition,
  iconOnly = false,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (pending) return
    startTransition(async () => {
      const result = await startSession(planSessionId)
      if (!result.ok) {
        const message =
          result.reason === "validation"
            ? result.messages.join(" ")
            : (MESSAGES[result.reason] ?? "No se pudo empezar la sesión.")
        toast.error(message)
        return
      }
      if (result.sessionId) {
        const query =
          exercisePosition != null ? `?exercise=${exercisePosition}` : ""
        router.push(`/run/${result.sessionId}${query}`)
      }
    })
  }

  if (iconOnly) {
    return (
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={handleClick}
        disabled={pending}
        aria-label={
          exercisePosition != null
            ? "Ejecutar desde este ejercicio"
            : "Ejecutar sesión"
        }
      >
        {pending ? (
          <Loader2Icon className="animate-spin" aria-hidden="true" />
        ) : (
          <PlayIcon aria-hidden="true" />
        )}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={resume ? "default" : "outline"}
      onClick={handleClick}
      disabled={pending}
      aria-label={resume ? "Continuar sesión en curso" : "Ejecutar sesión"}
    >
      {pending ? (
        <Loader2Icon className="animate-spin" aria-hidden="true" />
      ) : resume ? (
        <RotateCcwIcon aria-hidden="true" />
      ) : (
        <PlayIcon aria-hidden="true" />
      )}
      {resume ? "Continuar" : "Ejecutar"}
    </Button>
  )
}
