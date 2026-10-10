import { getSession } from "@/lib/auth/session"
import { NavBar } from "@/components/workouts/nav-bar"

export async function SiteNav() {
  const session = await getSession()

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-4">
        <NavBar
          user={
            session?.user
              ? {
                  id: session.user.id,
                  name: session.user.name,
                  image: session.user.image ?? null,
                }
              : null
          }
        />
      </div>
    </header>
  )
}
