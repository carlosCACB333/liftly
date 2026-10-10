"use client"

import { create } from "zustand"
import { playChime, primeTimerAudio } from "./timer-audio"

export type TimerMode = "stopwatch" | "countdown"
export type TimerSource = "tool" | "rest"
export type TimerLap = { splitMs: number; totalMs: number }

export const MAX_COUNTDOWN_SEC = 12 * 60 * 60
export const DEFAULT_COUNTDOWN_SEC = 60
export const TICK_MS = 250

type TimerState = {
  open: boolean
  minimized: boolean
  mode: TimerMode
  source: TimerSource
  countdownRunning: boolean
  stopwatchRunning: boolean
  finished: boolean
  label: string | null
  totalSec: number
  remainingSec: number
  stopwatchMs: number
  laps: TimerLap[]

  openTool: (mode?: TimerMode) => void
  openForRest: (totalSec: number, label: string) => void
  close: () => void
  minimize: () => void
  expand: () => void
  setMode: (mode: TimerMode) => void
  start: () => void
  pause: () => void
  toggleRun: () => void
  toggleMode: (mode: TimerMode) => void
  reset: () => void
  addSec: (seconds: number) => void
  addLap: () => void
  setCountdown: (totalSec: number) => void
  tick: () => void
}

function clampCountdownSeconds(value: number): number {
  return Math.max(1, Math.min(MAX_COUNTDOWN_SEC, Math.round(value)))
}

export const useTimerStore = create<TimerState>((set, get) => {
  const runningOf = (mode: TimerMode) =>
    mode === "stopwatch" ? get().stopwatchRunning : get().countdownRunning
  const setRunning = (mode: TimerMode, value: boolean) =>
    set(mode === "stopwatch" ? { stopwatchRunning: value } : { countdownRunning: value })
  const startMode = (mode: TimerMode) => {
    primeTimerAudio()
    if (mode === "stopwatch") {
      set({ stopwatchRunning: true })
      return
    }
    const remainingSec = get().remainingSec <= 0 ? get().totalSec : get().remainingSec
    set({ countdownRunning: true, finished: false, remainingSec })
  }

  return {
    open: false,
    minimized: false,
    mode: "stopwatch",
    source: "tool",
    countdownRunning: false,
    stopwatchRunning: false,
    finished: false,
    label: null,
    totalSec: DEFAULT_COUNTDOWN_SEC,
    remainingSec: DEFAULT_COUNTDOWN_SEC,
    stopwatchMs: 0,
    laps: [],

    openTool(mode = "stopwatch") {
      set({ open: true, minimized: false, mode, source: "tool", finished: false })
    },

    openForRest(totalSec, label) {
      const seconds = clampCountdownSeconds(totalSec)
      primeTimerAudio()
      set({
        open: true,
        minimized: false,
        mode: "countdown",
        source: "rest",
        finished: false,
        label,
        totalSec: seconds,
        remainingSec: seconds,
        countdownRunning: true,
      })
    },

    close() {
      set({
        open: false,
        minimized: false,
        countdownRunning: false,
        stopwatchRunning: false,
        finished: false,
      })
    },

    minimize() {
      set({ minimized: true })
    },

    expand() {
      set({ minimized: false })
    },

    setMode(mode) {
      if (get().mode === mode) return
      set({ mode })
      if (mode === "countdown" && get().totalSec <= 0) {
        set({ totalSec: DEFAULT_COUNTDOWN_SEC, remainingSec: DEFAULT_COUNTDOWN_SEC })
      }
    },

    start() {
      startMode(get().mode)
    },

    pause() {
      setRunning(get().mode, false)
    },

    toggleRun() {
      const mode = get().mode
      if (runningOf(mode)) setRunning(mode, false)
      else startMode(mode)
    },

    toggleMode(mode) {
      if (runningOf(mode)) setRunning(mode, false)
      else startMode(mode)
    },

    reset() {
      const state = get()
      if (state.mode === "stopwatch") {
        set({ stopwatchRunning: false, stopwatchMs: 0, laps: [] })
      } else {
        set({ countdownRunning: false, remainingSec: state.totalSec, finished: false })
      }
    },

    addSec(seconds) {
      const state = get()
      if (state.mode !== "countdown") return
      const remainingSec = Math.max(0, state.remainingSec + seconds)
      set({ remainingSec, totalSec: Math.max(state.totalSec, remainingSec), finished: false })
    },

    addLap() {
      const state = get()
      if (state.mode !== "stopwatch" || !state.stopwatchRunning) return
      const previous = state.laps[0]?.totalMs ?? 0
      set({
        laps: [{ splitMs: state.stopwatchMs - previous, totalMs: state.stopwatchMs }, ...state.laps],
      })
    },

    setCountdown(totalSec) {
      const seconds = clampCountdownSeconds(totalSec)
      primeTimerAudio()
      set({ totalSec: seconds, remainingSec: seconds, finished: false, countdownRunning: false })
    },

    tick() {
      const state = get()
      const updates: Partial<TimerState> = {}
      if (state.countdownRunning) {
        const remainingSec = Math.max(0, state.remainingSec - TICK_MS / 1000)
        if (remainingSec <= 0) {
          updates.countdownRunning = false
          updates.remainingSec = 0
          updates.finished = true
          playChime()
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([400, 120, 400])
          }
        } else {
          updates.remainingSec = remainingSec
        }
      }
      if (state.stopwatchRunning) {
        updates.stopwatchMs = state.stopwatchMs + TICK_MS
      }
      if (Object.keys(updates).length > 0) set(updates)
    },
  }
})