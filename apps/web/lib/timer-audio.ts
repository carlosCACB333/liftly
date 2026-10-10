let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!context) context = new Ctor()
  if (context.state === "suspended") {
    void context.resume().catch(() => undefined)
  }
  return context
}

export function primeTimerAudio() {
  getContext()
}

export function playChime() {
  const ctx = getContext()
  if (!ctx) return
  const now = ctx.currentTime
  const notes = [659.25, 880]
  notes.forEach((freq, index) => {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = "sine"
    oscillator.frequency.value = freq
    const start = now + index * 0.16
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.16, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + 1.1)
  })
}