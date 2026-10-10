import { SiteNav } from "@/components/workouts/site-nav"

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8">
        {children}
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Tus planes son privados salvo que decidas publicarlos.
      </footer>
    </div>
  )
}
