"use client"

import { useEffect, useState } from "react"
import {
  ClockIcon,
  FlagIcon,
  HourglassIcon,
  Maximize2Icon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
  SkipForwardIcon,
  TimerIcon,
  XIcon,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { formatClock } from "@/lib/domain/run"
import {
  MAX_COUNTDOWN_SEC,
  TICK_MS,
  useTimerStore,
  type TimerMode,
} from "@/lib/timer-store"

const COUNTDOWN_PRESETS = [30, 60, 120, 180, 300, 600] as const

export function TimerTool() {
  const open = useTimerStore((state) => state.open)

  useEffect(() => {
    if (!open) return
    const id = window.setInterval(() => useTimerStore.getState().tick(), TICK_MS)
    return () => window.clearInterval(id)
  }, [open])

  if (!open) return null
  return <TimerPanel />
}

function TimerPanel() {
  const minimized = useTimerStore((state) => state.minimized)
  return minimized ? <TimerPill /> : <TimerCard />
}

function TimerPill() {
  const remainingSec = useTimerStore((state) => state.remainingSec)
  const stopwatchMs = useTimerStore((state) => state.stopwatchMs)
  const countdownRunning = useTimerStore((state) => state.countdownRunning)
  const stopwatchRunning = useTimerStore((state) => state.stopwatchRunning)

  return (
    <div className="fixed right-4 bottom-4 z-50 flex min-w-52 flex-col rounded-2xl border bg-card p-1.5 shadow-lg">
      <header className="flex items-center justify-between px-2 py-1">
        <span className="flex items-center gap-1.5 text-xs font-medium" aria-hidden="true">
          <TimerIcon className="size-3.5 text-muted-foreground" />
          Temporizador
        </span>
        <span className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => useTimerStore.getState().expand()}
            aria-label="Expandir temporizador"
          >
            <Maximize2Icon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => useTimerStore.getState().close()}
            aria-label="Cerrar temporizador"
          >
            <XIcon />
          </Button>
        </span>
      </header>
<PillRow
        icon={<ClockIcon aria-hidden="true" />}
        label="Cronómetro"
        time={formatClock(Math.floor(stopwatchMs / 1000))}
        running={stopwatchRunning}
        onToggle={() => useTimerStore.getState().toggleMode("stopwatch")}
      />
      <PillRow
        icon={<HourglassIcon aria-hidden="true" />}
        label="Temporizador"
        time={formatClock(Math.ceil(remainingSec))}
        running={countdownRunning}
        onToggle={() => useTimerStore.getState().toggleMode("countdown")}
      />
    </div>
  )
}

function PillRow({
  icon,
  label,
  time,
  running,
  onToggle,
}: {
  icon: React.ReactNode
  label: string
  time: string
  running: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5">
      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
        {icon}
        <span className="truncate text-xs">{label}</span>
      </span>
      <span className="font-mono text-base tabular-nums" role="timer">
        {time}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
        aria-label={`${running ? "Pausar" : "Iniciar"} ${label.toLowerCase()}`}
      >
        {running ? <PauseIcon /> : <PlayIcon />}
      </Button>
    </div>
  )
}

function TimingToggle({ small = false }: { small?: boolean }) {
  const mode = useTimerStore((state) => state.mode)
  const countdownRunning = useTimerStore((state) => state.countdownRunning)
  const stopwatchRunning = useTimerStore((state) => state.stopwatchRunning)
  const running = mode === "countdown" ? countdownRunning : stopwatchRunning
  return (
    <Button
      type="button"
      variant={small ? "ghost" : "default"}
      size={small ? "icon-sm" : "sm"}
      onClick={() => useTimerStore.getState().toggleRun()}
      aria-label={running ? "Pausar temporizador" : "Iniciar temporizador"}
    >
      {running ? <PauseIcon /> : <PlayIcon />}
    </Button>
  )
}

function TimerCard() {
  const source = useTimerStore((state) => state.source)
  const mode = useTimerStore((state) => state.mode)
  const label = useTimerStore((state) => state.label)

  return (
    <Card
      aria-label="Temporizador"
      className="fixed right-4 bottom-4 z-50 w-80 max-w-[calc(100vw-2rem)] shadow-xl"
    >
      <CardContent className="flex flex-col gap-3 p-0">
        <header className="flex items-center gap-2 border-b px-3 py-2">
          <TimerIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium">
            {label ?? (mode === "stopwatch" ? "Cronómetro" : "Temporizador")}
          </p>
          {source === "rest" ? <Badge variant="secondary">Descanso</Badge> : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => useTimerStore.getState().minimize()}
            aria-label="Minimizar temporizador"
          >
            <MinusIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => useTimerStore.getState().close()}
            aria-label="Cerrar temporizador"
          >
            <XIcon />
          </Button>
        </header>

        <div className="flex items-center gap-1 px-3" role="group" aria-label="Modo del temporizador">
          <ModeButton modeValue="stopwatch" current={mode}>
            Cronómetro
          </ModeButton>
          <ModeButton modeValue="countdown" current={mode}>
            Temporizador
          </ModeButton>
        </div>

        <div className="px-3 pb-3">{mode === "stopwatch" ? <StopwatchView /> : <CountdownView />}</div>
      </CardContent>
    </Card>
  )
}

function ModeButton({
  modeValue,
  current,
  children,
}: {
  modeValue: TimerMode
  current: TimerMode
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={current === modeValue ? "secondary" : "ghost"}
      size="sm"
      className="flex-1"
      onClick={() => useTimerStore.getState().setMode(modeValue)}
      aria-pressed={current === modeValue}
    >
      {children}
    </Button>
  )
}

function StopwatchView() {
  const running = useTimerStore((state) => state.stopwatchRunning)
  const stopwatchMs = useTimerStore((state) => state.stopwatchMs)
  const laps = useTimerStore((state) => state.laps)

  return (
    <div className="flex flex-col gap-3">
      <p className="py-2 text-center font-mono text-5xl font-semibold tabular-nums" role="timer">
        {formatClock(Math.floor(stopwatchMs / 1000))}
      </p>
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => useTimerStore.getState().addLap()}
          disabled={!running}
        >
          <FlagIcon aria-hidden="true" /> Vuelta
        </Button>
        <TimingToggle />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => useTimerStore.getState().reset()}
        >
          <RotateCcwIcon aria-hidden="true" /> Reiniciar
        </Button>
      </div>
      {laps.length > 0 ? (
        <ol aria-label="Vueltas" className="flex max-h-40 flex-col gap-1 overflow-y-auto border-t pt-2 text-xs">
          {laps.map((lap, index) => (
            <li key={`${lap.totalMs}-${index}`} className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-muted-foreground">Vuelta {laps.length - index}</span>
              <span className="font-mono tabular-nums">{formatClock(lap.splitMs / 1000)}</span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {formatClock(lap.totalMs / 1000)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}

function CountdownView() {
  const totalSec = useTimerStore((state) => state.totalSec)
  const remainingSec = useTimerStore((state) => state.remainingSec)
  const running = useTimerStore((state) => state.countdownRunning)
  const finished = useTimerStore((state) => state.finished)
  const source = useTimerStore((state) => state.source)

  const [minuteValue, setMinuteValue] = useState(String(Math.floor(totalSec / 60)))
  const [secondValue, setSecondValue] = useState(String(totalSec % 60))

  useEffect(() => {
    setMinuteValue(String(Math.floor(totalSec / 60)))
    setSecondValue(String(totalSec % 60))
  }, [totalSec])

  function applyCustom() {
    const minutes = Number.parseInt(minuteValue, 10)
    const seconds = Number.parseInt(secondValue, 10)
    const total = (Number.isFinite(minutes) ? minutes : 0) * 60 + (Number.isFinite(seconds) ? seconds : 0)
    useTimerStore.getState().setCountdown(
      total > 0 ? Math.min(total, MAX_COUNTDOWN_SEC) : 60
    )
  }

  const disabled = running
  const progress = totalSec > 0 ? Math.min(1, remainingSec / totalSec) : 0
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const status = finished
    ? "Tiempo cumplido"
    : running
      ? "En marcha"
      : remainingSec < totalSec
        ? "En pausa"
        : "Listo"

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto size-40" role="timer">
        <svg viewBox="0 0 120 120" className="size-full" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="8"
            className="stroke-muted"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className="stroke-primary transition-[stroke-dashoffset] duration-200"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-3xl font-semibold tabular-nums">
          {formatClock(Math.ceil(remainingSec))}
        </span>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {status}
        {source === "rest" ? " · puedes saltarlo" : ""}
      </p>

      <div className="flex items-center justify-center gap-1" role="group" aria-label="Duración del temporizador">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={minuteValue}
          onChange={(event) => setMinuteValue(event.target.value)}
          disabled={disabled}
          aria-label="Minutos"
          className="w-16 text-center tabular-nums"
        />
        <span aria-hidden="true">:</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={secondValue}
          onChange={(event) => setSecondValue(event.target.value)}
          disabled={disabled}
          aria-label="Segundos"
          className="w-16 text-center tabular-nums"
        />
        <Button type="button" variant="outline" size="sm" onClick={applyCustom} disabled={disabled}>
          Aplicar
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Duración rápida">
        {COUNTDOWN_PRESETS.map((value) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            size="xs"
            onClick={() => useTimerStore.getState().setCountdown(value)}
            disabled={disabled}
            aria-pressed={!running && totalSec === value && remainingSec === value}
          >
            {formatClock(value)}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t pt-3">
        {source === "rest" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => useTimerStore.getState().close()}
            aria-label="Saltar descanso"
          >
            <SkipForwardIcon aria-hidden="true" /> Saltar
          </Button>
        ) : null}
        <TimingToggle />
        {!running ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => useTimerStore.getState().reset()}
          >
            <RotateCcwIcon aria-hidden="true" /> Reiniciar
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => useTimerStore.getState().addSec(30)}
          aria-label="Añadir 30 segundos"
        >
          <PlusIcon aria-hidden="true" /> 30s
        </Button>
      </div>
    </div>
  )
}