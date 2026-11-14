/** Weekday demand index for shelf planning (0–100). Seeded to pin + shop type. */
export function weekDemandIndex(seed = 0.42): { day: string; index: number; label: string }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  // Weekend lift + midweek trough — India kirana/QSR-ish pattern
  const base = [72, 68, 70, 74, 82, 96, 88]
  return days.map((day, i) => {
    const jitter = Math.round((((seed * 9973 + i * 17) % 9) - 4) * 1.15)
    const index = Math.max(42, Math.min(99, base[i] + jitter))
    const label = index >= 90 ? 'Peak' : index >= 78 ? 'Strong' : index >= 65 ? 'Steady' : 'Soft'
    return { day, index, label }
  })
}
