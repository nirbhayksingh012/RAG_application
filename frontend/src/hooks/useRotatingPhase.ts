import { useEffect, useState } from 'react'

/**
 * Cycles through labels while `active` is true (e.g. waiting on a network request).
 */
export function useRotatingPhase<T extends string>(
  active: boolean,
  phases: readonly T[],
  intervalMs = 1400,
): T {
  const safe = phases.length ? phases : ([''] as unknown as readonly T[])
  const [i, setI] = useState(0)

  useEffect(() => {
    if (!active || safe.length <= 1) return
    const t = window.setInterval(
      () => setI((x) => (x + 1) % safe.length),
      intervalMs,
    )
    return () => window.clearInterval(t)
  }, [active, safe.length, intervalMs])

  useEffect(() => {
    if (!active) setI(0)
  }, [active])

  return safe[i] ?? safe[0]
}
