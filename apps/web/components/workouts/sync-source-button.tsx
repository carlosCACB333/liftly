"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2Icon, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { syncPlanFromSource } from "@/lib/actions/workouts"

const MESSAGES: Record<string, string> = {
  unauthenticated: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
  "not-found": "Este plan ya no existe.",
  forbidden: "No tienes permiso sobre este plan.",
  conflict: "No se pudo sincronizar: recarga la página e inténtalo de nuevo.",
}

type SyncSourceButtonProps = {
  planId: string
  sourceName: string
}

export function SyncSourceButton({ planId, sourceName }: SyncSourceButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleSync() {
    if (pending) return
    startTransition(async () => {
      const result = await syncPlanFromSource(planId)
      if (!result.ok) {
        setConfirmOpen(false)
        toast.error(MESSAGES[result.reason] ?? "No se pudo sincronizar el plan.")
        return
      }
      setConfirmOpen(false)
      toast.success("Tu copia vuelve a coincidir con el plan original.")
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
      >
        {pending ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
        {pending ? "Sincronizando…" : "Sincronizar con el original"}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Sincronizar con «{sourceName}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Tus sesiones y ejercicios actuales se reemplazarán por los del plan
              original. El nombre, la descripción, la visibilidad y los corazones
              de tu copia no cambian. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={handleSync}>
              {pending ? "Sincronizando…" : "Sincronizar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
