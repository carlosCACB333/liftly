"use client"

import { useState, type ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"

type SessionDisclosureProps = {
  index: number
  name: string
  exerciseCount: number
  defaultOpen?: boolean
  actions?: ReactNode
  children: ReactNode
}

export function SessionDisclosure({
  index,
  name,
  exerciseCount,
  defaultOpen = false,
  actions,
  children,
}: SessionDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = `plan-session-${index}-body`

  return (
    <li className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
        <h3 className="flex min-w-0 items-center font-medium tracking-tight">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={open ? `Contraer «${name}»` : `Expandir «${name}»`}
            className="flex min-w-0 items-center gap-2.5 rounded-sm text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ChevronDownIcon
              aria-hidden="true"
              className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-sm font-medium text-muted-foreground ring-1 ring-border">
              {index + 1}
            </span>
            <span className="truncate">{name}</span>
          </button>
        </h3>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {exerciseCount} {exerciseCount === 1 ? "ejercicio" : "ejercicios"}
          </span>
          {actions}
        </div>
      </div>
      {open ? <div id={bodyId}>{children}</div> : null}
    </li>
  )
}
