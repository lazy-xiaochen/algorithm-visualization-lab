import { colOf, rowOf } from './grid'
import type { CellId, GridMap } from './grid'
import { PriorityQueue } from './priority-queue'

export const ALGORITHMS = ['bfs', 'dfs', 'dijkstra', 'astar'] as const
export type Algorithm = typeof ALGORITHMS[number]

export interface SearchStep {
  cell: CellId
  path?: CellId[]
}

export interface SearchResult {
  found: boolean
  path: CellId[]
  distance: number | null
  visited: CellId[]
  elapsedMs: number
}

type SearchIterator = Generator<SearchStep, void, void>
const UNSEEN = -2
const ROOT = -1

function neighbors(map: GridMap, cell: CellId): CellId[] {
  const { rows, cols, walls } = map
  const row = rowOf(cell, cols)
  const col = colOf(cell, cols)
  const result: CellId[] = []
  if (row > 0 && !walls.has(cell - cols)) result.push(cell - cols)
  if (col + 1 < cols && !walls.has(cell + 1)) result.push(cell + 1)
  if (row + 1 < rows && !walls.has(cell + cols)) result.push(cell + cols)
  if (col > 0 && !walls.has(cell - 1)) result.push(cell - 1)
  return result
}

function visit(cell: CellId, goal: CellId, parents: Int32Array): SearchStep {
  if (cell !== goal) return { cell }
  const path = []
  for (let at = goal; at !== ROOT; at = parents[at]) path.push(at)
  return { cell, path: path.reverse() }
}

function* walkUnweighted(map: GridMap, parents: Int32Array, depthFirst: boolean): SearchIterator {
  const frontier = [{ cell: map.start, from: ROOT }]
  let head = 0
  if (!depthFirst) parents[map.start] = ROOT

  while (head < frontier.length) {
    const { cell, from } = depthFirst ? frontier.pop()! : frontier[head++]
    if (depthFirst) {
      if (parents[cell] !== UNSEEN) continue
      parents[cell] = from
    }

    yield visit(cell, map.goal, parents)
    if (cell === map.goal) return

    const nextCells = neighbors(map, cell)
    if (depthFirst) nextCells.reverse()
    for (const next of nextCells) {
      if (parents[next] !== UNSEEN) continue
      if (!depthFirst) parents[next] = cell
      frontier.push({ cell: next, from: cell })
    }
  }
}

interface FrontierItem {
  cell: CellId
  cost: number
  priority: number
  heuristic: number
  order: number
}

function* walkByCost(map: GridMap, parents: Int32Array, useHeuristic: boolean): SearchIterator {
  const cost = new Float64Array(parents.length).fill(Infinity)
  const frontier = new PriorityQueue<FrontierItem>(
    (a, b) => a.priority - b.priority || a.heuristic - b.heuristic || a.order - b.order,
  )
  let order = 0

  function enqueue(cell: CellId, distance: number) {
    const heuristic = useHeuristic
      ? Math.abs(rowOf(cell, map.cols) - rowOf(map.goal, map.cols))
        + Math.abs(colOf(cell, map.cols) - colOf(map.goal, map.cols))
      : 0
    frontier.push({ cell, cost: distance, heuristic, priority: distance + heuristic, order: order++ })
  }

  cost[map.start] = 0
  parents[map.start] = ROOT
  enqueue(map.start, 0)

  for (let item = frontier.pop(); item; item = frontier.pop()) {
    const { cell, cost: distance } = item
    if (distance !== cost[cell]) continue

    yield visit(cell, map.goal, parents)
    if (cell === map.goal) return

    const nextDistance = distance + 1
    for (const next of neighbors(map, cell)) {
      if (nextDistance >= cost[next]) continue
      cost[next] = nextDistance
      parents[next] = cell
      enqueue(next, nextDistance)
    }
  }
}

export function* searchSteps(map: GridMap, algorithm: Algorithm): SearchIterator {
  const { rows, cols, start, goal, walls } = map
  const size = rows * cols
  if (!Number.isSafeInteger(rows) || !Number.isSafeInteger(cols) || rows <= 0 || cols <= 0
    || !Number.isSafeInteger(size)) {
    throw new RangeError('Grid dimensions must be positive integers.')
  }
  for (const cell of [start, goal]) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= size || walls.has(cell)) {
      throw new RangeError('Endpoints must be inside the grid and passable.')
    }
  }

  const parents = new Int32Array(size).fill(UNSEEN)
  switch (algorithm) {
    case 'bfs':
    case 'dfs':
      yield* walkUnweighted(map, parents, algorithm === 'dfs')
      break
    case 'dijkstra':
    case 'astar':
      yield* walkByCost(map, parents, algorithm === 'astar')
  }
}

export function runSearch(map: GridMap, algorithm: Algorithm): SearchResult {
  const startedAt = performance.now()
  const visited: CellId[] = []
  let path: CellId[] = []
  for (const step of searchSteps(map, algorithm)) {
    visited.push(step.cell)
    if (step.path) path = step.path
  }
  const elapsedMs = performance.now() - startedAt
  const found = path.length > 0
  return { found, path, distance: found ? path.length - 1 : null, visited, elapsedMs }
}

export function compareAlgorithms(map: GridMap) {
  return ALGORITHMS.map((algorithm) => ({ algorithm, ...runSearch(map, algorithm) }))
}
