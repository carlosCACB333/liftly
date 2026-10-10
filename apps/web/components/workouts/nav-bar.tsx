"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  DumbbellIcon,
  LogOutIcon,
  MenuIcon,
  PenLineIcon,
  PlusIcon,
  TimerIcon,
  UserIcon,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { authClient } from "@workspace/db/client"
import { useTimerStore } from "@/lib/timer-store"

type NavBarProps = {
  user: { id: string; name: string; image: string | null } | null
}

const LINKS = [
  { href: "/plans", label: "Explorar" },
  { href: "/my-plans", label: "Mis planes" },
] as const

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

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

export function NavBar({ user }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <div className="flex w-full items-center gap-2">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 rounded-sm text-base font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <DumbbellIcon className="size-4" />
        </span>
        <span className="hidden sm:inline">Liftly</span>
      </Link>

      <nav
        aria-label="Principal"
        className="ml-2 hidden items-center gap-1 text-sm font-medium md:flex"
      >
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(pathname, link.href) ? "page" : undefined}
            className={
              "rounded-md px-2.5 py-1.5 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none " +
              (isActive(pathname, link.href)
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")
            }
          >
            {link.label}
          </Link>
        ))}
        {user ? (
          <Link
            href="/plans/create"
            aria-current={
              isActive(pathname, "/plans/create") ? "page" : undefined
            }
            className={
              "rounded-md px-2.5 py-1.5 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none " +
              (isActive(pathname, "/plans/create")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")
            }
          >
            Crear plan
          </Link>
        ) : null}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => useTimerStore.getState().openTool()}
          aria-label="Abrir temporizador"
          title="Temporizador"
        >
          <TimerIcon />
        </Button>
        <ThemeToggle />

        {user ? (
          <>
            <Link
              href="/plans/create"
              className={`${buttonVariants({ size: "sm" })} hidden md:inline-flex`}
            >
              <PlusIcon />
              Crear plan
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  />
                }
              >
                <Avatar className="size-6">
                  {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                  <AvatarFallback className="text-[10px]">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-28 truncate sm:inline">
                  {user.name}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="truncate">
                    {user.name}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href={`/profile/${user.id}`} />}
                >
                  <UserIcon />
                  Mi perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <Link
                      href="/my-plans"
                      aria-current={
                        isActive(pathname, "/my-plans") ? "page" : undefined
                      }
                    />
                  }
                >
                  Mis planes
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <Link
                      href="/plans/create"
                      aria-current={
                        isActive(pathname, "/plans/create") ? "page" : undefined
                      }
                    />
                  }
                >
                  <PenLineIcon />
                  Crear plan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleLogout()}
                  variant="destructive"
                >
                  <LogOutIcon />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                  />
                }
                aria-label="Abrir menú de navegación"
              >
                <MenuIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {LINKS.map((link) => (
                  <DropdownMenuItem
                    key={link.href}
                    render={<Link href={link.href} />}
                    aria-current={
                      isActive(pathname, link.href) ? "page" : undefined
                    }
                  >
                    {link.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href={`/profile/${user.id}`} />}
                >
                  <UserIcon />
                  Mi perfil
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/plans/create" />}>
                  <PlusIcon />
                  Crear plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className={`${buttonVariants({ variant: "ghost", size: "sm" })} hidden sm:inline-flex`}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Crear cuenta
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="sm:hidden"
                  />
                }
                aria-label="Abrir menú de navegación"
              >
                <MenuIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {LINKS.map((link) => (
                  <DropdownMenuItem
                    key={link.href}
                    render={<Link href={link.href} />}
                    aria-current={
                      isActive(pathname, link.href) ? "page" : undefined
                    }
                  >
                    {link.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/login" />}>
                  Iniciar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  )
}
