import { beforeEach, describe, expect, test } from "bun:test"
import { DEFAULT_COUNTDOWN_SEC, useTimerStore } from "./timer-store"

function snapshot() {
  const state = useTimerStore.getState()
  return {
    open: state.open,
    minimized: state.minimized,
    mode: state.mode,
    source: state.source,
    countdownRunning: state.countdownRunning,
    stopwatchRunning: state.stopwatchRunning,
    finished: state.finished,
    label: state.label,
    totalSec: state.totalSec,
    remainingSec: state.remainingSec,
    stopwatchMs: state.stopwatchMs,
    laps: state.laps,
  }
}

beforeEach(() => {
  useTimerStore.setState({
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
  })
})

describe("useTimerStore", () => {
  test("openTool abre el cronómetro por defecto", () => {
    useTimerStore.getState().openTool()
    expect(snapshot()).toMatchObject({
      open: true,
      minimized: false,
      mode: "stopwatch",
      source: "tool",
    })
  })

  test("openForRest configura un countdown en marcha como descanso", () => {
    useTimerStore.getState().openForRest(90, "Siguiente: Prensa · serie 3")
    expect(snapshot()).toMatchObject({
      open: true,
      mode: "countdown",
      source: "rest",
      countdownRunning: true,
      finished: false,
      label: "Siguiente: Prensa · serie 3",
      totalSec: 90,
      remainingSec: 90,
    })
  })

  test("tick decrementa el countdown y termina con aviso", () => {
    useTimerStore.getState().openForRest(30, "Descanso")
    useTimerStore.getState().tick()
    expect(snapshot().remainingSec).toBeCloseTo(30 - 0.25)

    useTimerStore.setState({ remainingSec: 0.25 })
    useTimerStore.getState().tick()
    expect(snapshot()).toMatchObject({ countdownRunning: false, finished: true, remainingSec: 0 })
  })

  test("reset restaura la duración del countdown", () => {
    useTimerStore.getState().openForRest(60, "Descanso")
    useTimerStore.setState({ remainingSec: 12 })
    useTimerStore.getState().reset()
    expect(snapshot()).toMatchObject({ remainingSec: 60, countdownRunning: false, finished: false })
  })

  test("addSec suma tiempo al countdown y amplía su total", () => {
    useTimerStore.getState().openForRest(30, "Descanso")
    useTimerStore.getState().addSec(30)
    expect(snapshot()).toMatchObject({ remainingSec: 60, totalSec: 60 })
  })

  test("start reanuda un countdown parado y reinicia uno terminado", () => {
    useTimerStore.getState().openForRest(30, "Descanso")
    useTimerStore.getState().pause()
    expect(snapshot().countdownRunning).toBe(false)
    useTimerStore.getState().start()
    expect(snapshot().countdownRunning).toBe(true)

    useTimerStore.setState({ remainingSec: 0, finished: true })
    useTimerStore.getState().start()
    expect(snapshot()).toMatchObject({
      countdownRunning: true,
      remainingSec: 30,
      finished: false,
    })
  })

  test("el stopwatch suma, marca vueltas y se reinicia", () => {
    useTimerStore.getState().openTool()
    useTimerStore.getState().start()
    useTimerStore.getState().tick()
    expect(snapshot().stopwatchMs).toBe(250)

    useTimerStore.getState().addLap()
    expect(snapshot().laps).toEqual([{ splitMs: 250, totalMs: 250 }])

    useTimerStore.getState().reset()
    expect(snapshot()).toMatchObject({ stopwatchMs: 0, laps: [], stopwatchRunning: false })
  })

  test("setMode solo cambia la vista sin tocar label ni running", () => {
    useTimerStore.getState().openForRest(60, "Descanso")
    useTimerStore.getState().setMode("stopwatch")
    expect(snapshot()).toMatchObject({
      mode: "stopwatch",
      source: "rest",
      label: "Descanso",
      countdownRunning: true,
    })
  })

  test("al cambiar de modo, cada temporizador sigue corriendo en segundo plano", () => {
    useTimerStore.getState().openForRest(30, "Descanso")
    useTimerStore.getState().setMode("stopwatch")
    useTimerStore.getState().start()
    useTimerStore.getState().tick()
    expect(snapshot()).toMatchObject({ countdownRunning: true, stopwatchRunning: true })
    expect(snapshot().remainingSec).toBeCloseTo(30 - 0.25)
    expect(snapshot().stopwatchMs).toBe(250)

    useTimerStore.getState().setMode("countdown")
    useTimerStore.getState().tick()
    expect(snapshot().remainingSec).toBeCloseTo(30 - 0.5)
    expect(snapshot().stopwatchMs).toBe(500)
  })

  test("toggleMode inicia o pausa un modo concreto sin tocar el otro", () => {
    useTimerStore.getState().openForRest(30, "Descanso")
    useTimerStore.getState().toggleMode("stopwatch")
    expect(snapshot()).toMatchObject({ stopwatchRunning: true, countdownRunning: true })

    useTimerStore.getState().toggleMode("stopwatch")
    expect(snapshot()).toMatchObject({ stopwatchRunning: false, countdownRunning: true })

    useTimerStore.getState().toggleMode("countdown")
    expect(snapshot()).toMatchObject({
      countdownRunning: false,
      stopwatchRunning: false,
      remainingSec: 30,
    })
  })

  test("minimizar conserva el temporizador en marcha", () => {
    useTimerStore.getState().openForRest(60, "Descanso")
    useTimerStore.getState().minimize()
    expect(snapshot()).toMatchObject({ minimized: true, countdownRunning: true, open: true })
    useTimerStore.getState().expand()
    expect(snapshot().minimized).toBe(false)
  })

  test("close detiene el temporizador", () => {
    useTimerStore.getState().openForRest(60, "Descanso")
    useTimerStore.getState().close()
    expect(snapshot()).toMatchObject({ open: false, countdownRunning: false, finished: false })
  })
})