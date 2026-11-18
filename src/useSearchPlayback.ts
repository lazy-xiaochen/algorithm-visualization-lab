import { useEffect, useRef, useState } from 'react'
import type { CellId, GridMap } from './core/grid'
import { searchSteps } from './core/search'
import type { Algorithm } from './core/search'

type Phase = 'idle' | 'running' | 'paused' | 'success' | 'failure'

interface Frame {
  phase: Phase
  current: CellId | null
  visited: ReadonlySet<CellId>
  path: ReadonlySet<CellId>
  distance: number | null
  elapsedMs: number
}

interface Session {
  iterator: ReturnType<typeof searchSteps>
  playing: boolean
  visited: Set<CellId>
  elapsedMs: number
}

const emptyCells: ReadonlySet<CellId> = new Set()
const idleFrame: Frame = {
  phase: 'idle',
  current: null,
  visited: emptyCells,
  path: emptyCells,
  distance: null,
  elapsedMs: 0,
}

function newSession(map: GridMap, algorithm: Algorithm, playing: boolean): Session {
  return { iterator: searchSteps(map, algorithm), playing, visited: new Set(), elapsedMs: 0 }
}

export function useSearchPlayback(speed: number) {
  const [frame, setFrame] = useState(idleFrame)
  const session = useRef<Session | null>(null)

  function advance(run: Session) {
    const startedAt = performance.now()
    const next = run.iterator.next()
    run.elapsedMs += performance.now() - startedAt

    const step = next.done ? undefined : next.value
    if (step) run.visited.add(step.cell)
    if (!step || step.path) session.current = null

    setFrame({
      phase: !step ? 'failure' : step.path ? 'success' : run.playing ? 'running' : 'paused',
      current: step?.path ? null : step?.cell ?? null,
      visited: new Set(run.visited),
      path: step?.path ? new Set(step.path) : emptyCells,
      distance: step?.path ? step.path.length - 1 : null,
      elapsedMs: run.elapsedMs,
    })
  }

  useEffect(() => {
    const scheduledRun = session.current
    if (frame.phase !== 'running' || !scheduledRun) return
    const timer = window.setTimeout(() => {
      if (session.current === scheduledRun && scheduledRun.playing) advance(scheduledRun)
    }, 1000 / speed)
    return () => window.clearTimeout(timer)
  }, [frame, speed])

  function clear() {
    session.current = null
    setFrame(idleFrame)
  }

  function toggle(map: GridMap, algorithm: Algorithm) {
    const run = session.current
    if (!run) {
      const nextRun = newSession(map, algorithm, true)
      session.current = nextRun
      advance(nextRun)
      return
    }

    run.playing = !run.playing
    const phase = run.playing ? 'running' : 'paused'
    setFrame((previous) => ({ ...previous, phase }))
  }

  function step(map: GridMap, algorithm: Algorithm) {
    const run = session.current ?? newSession(map, algorithm, false)
    if (run.playing) return
    session.current = run
    advance(run)
  }

  return { frame, clear, toggle, step }
}
