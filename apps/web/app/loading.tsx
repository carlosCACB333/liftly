import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-40" />
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-6 px-4 py-16">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-5 w-full max-w-lg" />
        <div className="mt-4 grid w-full gap-4 sm:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </main>
    </div>
  )
}
