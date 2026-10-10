"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  GlobeIcon,
  LockIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { deletePlan, togglePlanVisibility } from "@/lib/actions/workouts"

type OwnerActionsProps = {
  workoutId: string
  planName: string
  isPublished: boolean
  editHref: string
  redirectTo?: string
}

const MESSAGES: Record<string, string> = {
  unauthenticated: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
  "not-found": "Este plan ya no existe.",
  forbidden: "No tienes permiso sobre este plan.",
}

export function OwnerActions({
  workoutId,
  planName,
  isPublished,
  editHref,
  redirectTo,
}: OwnerActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [published, setPublished] = useState(isPublished)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleVisibility() {
    if (pending) return
    startTransition(async () => {
      const result = await togglePlanVisibility(workoutId)
      if (!result.ok) {
        toast.error(MESSAGES[result.reason] ?? "No se pudo cambiar la visibilidad.")
        return
      }
      if ("visibility" in result) {
        const nowPublished = result.visibility === "public"
        setPublished(nowPublished)
        toast.success(
          nowPublished
            ? "Plan publicado: ya aparece en Explorar."
            : "Plan despublicado: deja de aparecer en Explorar al instante."
        )
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (pending) return
    startTransition(async () => {
      const result = await deletePlan(workoutId)
      if (!result.ok) {
        setConfirmOpen(false)
        toast.error(MESSAGES[result.reason] ?? "No se pudo eliminar el plan.")
        return
      }
      toast.success(`«${planName}» se ha eliminado.`)
      setConfirmOpen(false)
      if (redirectTo) {
        router.push(redirectTo)
        return
      }
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              aria-label={`Más acciones sobre ${planName}`}
            />
          }
        >
          {pending ? <Loader2Icon className="animate-spin" /> : <MoreHorizontalIcon />}
          Acciones
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem render={<Link href={editHref} />}>
            <PencilIcon />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onClick={handleVisibility}
            aria-pressed={published}
          >
            {published ? <GlobeIcon /> : <LockIcon />}
            {published ? "Despublicar" : "Publicar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{planName}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán sus sesiones, ejercicios y corazones. Los planes que
              otros hayan copiado no se ven afectados. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? "Eliminando…" : "Eliminar plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
