import { memo, useId, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { Flag, Navigation } from 'lucide-react'
import { brushLine, colOf, rowOf } from '../core/grid'
import type { CellId, GridMap } from '../core/grid'

export type Brush = 'wall' | 'erase'
export type Endpoint = 'start' | 'goal'
type CellState = 'empty' | 'wall' | 'start' | 'goal' | 'current' | 'visited' | 'path'

interface BoardProps {
  map: GridMap
  brush: Brush
  visited: ReadonlySet<CellId>
  path: ReadonlySet<CellId>
  current: CellId | null
  onPaint: (cells: CellId[], brush: Brush) => void
  onMove: (endpoint: Endpoint, cell: CellId) => void
}

const cellNames: Record<CellState, string> = {
  empty: 'Empty',
  wall: 'Wall',
  start: 'Start',
  goal: 'Goal',
  current: 'Exploring',
  visited: 'Visited',
  path: 'Path',
}

const GridCell = memo(function GridCell({ cell, cols, state, active, exploring, prefix }: {
  cell: CellId
  cols: number
  state: CellState
  active: boolean
  exploring: boolean
  prefix: string
}) {
  const Marker = state === 'start' ? Navigation : Flag
  return (
    <div
      id={prefix + cell}
      role="gridcell"
      aria-label={`Row ${rowOf(cell, cols) + 1}, column ${colOf(cell, cols) + 1}, ${cellNames[state]}${exploring && state !== 'current' ? ', exploring' : ''}`}
      className={`cell cell-${state}${active ? ' cell-active' : ''}`}
      data-cell={cell}
      data-state={state}
      data-exploring={exploring || undefined}
    >
      {(state === 'start' || state === 'goal') && (
        <span className="cell-marker">
          <Marker aria-hidden="true" strokeWidth={2.8} />
        </span>
      )}
    </div>
  )
})

export function Board({ map, brush, visited, path, current, onPaint, onMove }: BoardProps) {
  const prefix = useId()
  const [focused, setFocused] = useState<CellId | null>(null)
  const drag = useRef<{ id: number; last: CellId | null; mode: Brush | Endpoint } | null>(null)
  const active = focused !== null && focused < map.rows * map.cols ? focused : map.start

  function locate(event: PointerEvent<HTMLDivElement>): CellId | null {
    const rect = event.currentTarget.getBoundingClientRect()
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * map.cols)
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * map.rows)
    if (col < 0 || col >= map.cols || row < 0 || row >= map.rows) return null
    return row * map.cols + col
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || drag.current) return
    const cell = locate(event)
    if (cell === null) return
    const mode = cell === map.start ? 'start' : cell === map.goal ? 'goal' : brush
    drag.current = { id: event.pointerId, mode, last: cell }
    setFocused(cell)
    event.currentTarget.setPointerCapture(event.pointerId)
    if (mode === 'wall' || mode === 'erase') onPaint([cell], mode)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const stroke = drag.current
    if (!stroke || stroke.id !== event.pointerId) return
    const cell = locate(event)
    if (cell === stroke.last) return
    const previous = stroke.last
    stroke.last = cell
    if (cell === null) return
    setFocused(cell)
    if (stroke.mode === 'start' || stroke.mode === 'goal') onMove(stroke.mode, cell)
    else onPaint(previous === null ? [cell] : brushLine(previous, cell, map.cols), stroke.mode)
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id === event.pointerId) drag.current = null
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const row = rowOf(active, map.cols)
    const col = colOf(active, map.cols)
    switch (event.key) {
      case 'ArrowUp':
        setFocused(row ? active - map.cols : active)
        break
      case 'ArrowRight':
        setFocused(col < map.cols - 1 ? active + 1 : active)
        break
      case 'ArrowDown':
        setFocused(row < map.rows - 1 ? active + map.cols : active)
        break
      case 'ArrowLeft':
        setFocused(col ? active - 1 : active)
        break
      case ' ':
      case 'Enter':
        onPaint([active], brush)
        break
      case 's':
      case 'S':
        onMove('start', active)
        break
      case 'g':
      case 'G':
        onMove('goal', active)
        break
      default:
        return
    }
    event.preventDefault()
  }

  function cellState(cell: CellId): CellState {
    if (cell === map.start) return 'start'
    if (cell === map.goal) return 'goal'
    if (map.walls.has(cell)) return 'wall'
    if (path.has(cell)) return 'path'
    if (cell === current) return 'current'
    if (visited.has(cell)) return 'visited'
    return 'empty'
  }

  return (
    <div
      role="grid"
      aria-label="Pathfinding grid"
      aria-describedby="board-instructions"
      aria-rowcount={map.rows}
      aria-colcount={map.cols}
      aria-activedescendant={prefix + active}
      tabIndex={0}
      className={`board brush-${brush}`}
      style={{ '--columns': map.cols } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onLostPointerCapture={endPointer}
      onKeyDown={onKeyDown}
    >
      {Array.from({ length: map.rows }, (_, row) => (
        <div key={row} role="row" className="board-row">
          {Array.from({ length: map.cols }, (_, col) => {
            const cell = row * map.cols + col
            return <GridCell key={cell} cell={cell} cols={map.cols} state={cellState(cell)}
              active={cell === active} exploring={cell === current} prefix={prefix} />
          })}
        </div>
      ))}
    </div>
  )
}
