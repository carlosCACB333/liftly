import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CalendarIcon, DumbbellIcon, GlobeIcon, MailIcon } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { getSession } from "@/lib/auth/session"
import { getUserProfile } from "@/lib/data/workouts"
import { EditProfileForm } from "@/components/profile/edit-profile-form"
import { WorkoutCard } from "@/components/workouts/workout-card"

export const metadata: Metadata = {
  title: "Perfil",
  description: "Perfil de usuario de Liftly y sus planes públicos.",
}

type Params = Promise<{ userId: string }>

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
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { userId } = await params
  const session = await getSession()
  const currentUserId = session?.user?.id

  const profile = await getUserProfile(userId, currentUserId)
  if (!profile) notFound()

  const { user, isOwn, workouts } = profile

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                {user.image ? (
                  <AvatarImage src={user.image} alt={`Foto de ${user.name}`} />
                ) : null}
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-tight break-words">
                  {user.name}
                </h1>
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
                  <CalendarIcon className="size-4" />
                  En Liftly desde{" "}
                  <time dateTime={user.createdAt}>
                    {formatDate(user.createdAt)}
                  </time>
                </p>
                {user.email ? (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MailIcon className="size-4" />
                    {user.email}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                {isOwn ? (
                  <DumbbellIcon className="size-3.5" />
                ) : (
                  <GlobeIcon className="size-3.5" />
                )}
                {isOwn
                  ? workouts.length === 1
                    ? "1 plan"
                    : `${workouts.length} planes`
                  : workouts.length === 1
                    ? "1 plan público"
                    : `${workouts.length} planes públicos`}
              </span>
            </div>
          </div>

          {isOwn ? (
            <p className="text-sm text-muted-foreground">
              Este es tu perfil público. Los demás solo ven tus planes públicos;
              edita tu nombre y tu foto (enlace) abajo.
            </p>
          ) : null}
        </CardHeader>
      </Card>

      {isOwn ? (
        <Card>
          <CardHeader className="gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              Editar perfil
            </h2>
            <p className="text-sm text-muted-foreground">
              El nombre y la foto se actualizan en toda la app.
            </p>
          </CardHeader>
          <CardContent>
            <EditProfileForm name={user.name} image={user.image} />
          </CardContent>
        </Card>
      ) : null}

      <section
        aria-labelledby="public-plans-heading"
        className="flex flex-col gap-4"
      >
        <h2
          id="public-plans-heading"
          className="text-lg font-semibold tracking-tight"
        >
          {isOwn ? "Mis planes" : "Planes públicos"}
        </h2>

        {isOwn && workouts.some((workout) => !workout.isPublished) ? (
          <p className="text-sm text-muted-foreground">
            Aquí ves todos tus planes, incluidos los privados; los demás solo
            ven los que publicaste.
          </p>
        ) : null}

        {workouts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <DumbbellIcon className="size-6" />
            </span>
            <p className="font-medium">Sin planes públicos por ahora</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {isOwn
                ? "Publica un plan desde Mis planes para que el resto de la comunidad lo encuentre aquí."
                : `Cuando ${user.name} publique un plan, aparecerá aquí.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                currentUserId={currentUserId}
                showLike={!isOwn}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
