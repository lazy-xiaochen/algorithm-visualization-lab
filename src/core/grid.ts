export type CellId = number

export interface GridMap {
  rows: number
  cols: number
  start: CellId
  goal: CellId
  walls: ReadonlySet<CellId>
}

export const GRID_LIMITS = {
  rows: { min: 20, max: 36 },
  cols: { min: 30, max: 60 },
} as const

export const rowOf = (cell: CellId, cols: number) => Math.floor(cell / cols)
export const colOf = (cell: CellId, cols: number) => cell % cols

export function emptyGrid(rows: number, cols: number): GridMap {
  const middle = Math.floor(rows / 2) * cols
  return {
    rows,
    cols,
    walls: new Set(),
    start: middle + Math.floor(cols * 0.16),
    goal: middle + Math.floor(cols * 0.82),
  }
}

export function exampleGrid(): GridMap {
  const map = emptyGrid(20, 32)
  const walls = new Set<CellId>()
  const segments = [
    [2, 3, 2, 12], [2, 12, 6, 12], [5, 4, 5, 8],
    [0, 19, 5, 19], [5, 19, 5, 24], [2, 26, 2, 31],
    [5, 28, 10, 28], [10, 24, 10, 28],
    [8, 8, 14, 8], [8, 8, 8, 15], [8, 15, 12, 15],
    [10, 0, 10, 2], [16, 2, 16, 8], [16, 8, 19, 8],
    [15, 11, 15, 20], [8, 20, 15, 20], [15, 24, 18, 24],
    [15, 24, 15, 29], [18, 14, 19, 14], [18, 28, 18, 31],
  ]
  for (const [firstRow, firstCol, lastRow, lastCol] of segments) {
    for (let row = firstRow; row <= lastRow; row++) {
      for (let col = firstCol; col <= lastCol; col++) walls.add(row * map.cols + col)
    }
  }
  return { ...map, start: 10 * map.cols + 5, goal: 8 * map.cols + 25, walls }
}

export function resizeGrid(map: GridMap, rows: number, cols: number): GridMap {
  const remapEndpoint = (cell: CellId) =>
    Math.min(rowOf(cell, map.cols), rows - 1) * cols + Math.min(colOf(cell, map.cols), cols - 1)
  const start = remapEndpoint(map.start)
  let goal = remapEndpoint(map.goal)
  if (start === goal) goal = colOf(start, cols) > 0 ? start - 1 : start + 1

  const walls = new Set<CellId>()
  for (const wall of map.walls) {
    const row = rowOf(wall, map.cols)
    const col = colOf(wall, map.cols)
    if (row < rows && col < cols) walls.add(row * cols + col)
  }
  walls.delete(start)
  walls.delete(goal)
  return { rows, cols, start, goal, walls }
}

export function randomizeWalls(map: GridMap, random = Math.random): GridMap {
  const walls = new Set<CellId>()
  for (let cell = 0; cell < map.rows * map.cols; cell++) {
    if (cell !== map.start && cell !== map.goal && random() < 0.27) walls.add(cell)
  }
  return { ...map, walls }
}

export function generateMaze(map: GridMap, random = Math.random): GridMap {
  const { rows, cols } = map
  const walls = new Set(Array.from({ length: rows * cols }, (_, cell) => cell))
  const stack = [cols + 1]
  walls.delete(stack[0])

  while (stack.length) {
    const cell = stack[stack.length - 1]
    const row = rowOf(cell, cols)
    const col = colOf(cell, cols)
    const candidates = [
      row > 2 ? cell - 2 * cols : -1,
      col + 2 < cols - 1 ? cell + 2 : -1,
      row + 2 < rows - 1 ? cell + 2 * cols : -1,
      col > 2 ? cell - 2 : -1,
    ].filter((next) => walls.has(next))
    if (!candidates.length) {
      stack.pop()
      continue
    }
    const next = candidates[Math.floor(random() * candidates.length)]
    walls.delete((cell + next) / 2)
    walls.delete(next)
    stack.push(next)
  }

  // Join each endpoint to an odd-coordinate room in the connected maze.
  function connect(cell: CellId) {
    let row = rowOf(cell, cols)
    let col = colOf(cell, cols)
    const roomRow = Math.max(1, Math.min(2 * Math.floor((rows - 3) / 2) + 1, row | 1))
    const roomCol = Math.max(1, Math.min(2 * Math.floor((cols - 3) / 2) + 1, col | 1))
    walls.delete(cell)
    while (row !== roomRow) {
      row += Math.sign(roomRow - row)
      walls.delete(row * cols + col)
    }
    while (col !== roomCol) {
      col += Math.sign(roomCol - col)
      walls.delete(row * cols + col)
    }
  }

  connect(map.start)
  connect(map.goal)
  return { ...map, walls }
}

export function brushLine(from: CellId, to: CellId, cols: number): CellId[] {
  let x = colOf(from, cols)
  let y = rowOf(from, cols)
  const endX = colOf(to, cols)
  const endY = rowOf(to, cols)
  const dx = Math.abs(endX - x)
  const dy = -Math.abs(endY - y)
  const stepX = Math.sign(endX - x)
  const stepY = Math.sign(endY - y)
  const cells = [from]
  let error = dx + dy
  while (x !== endX || y !== endY) {
    const doubled = 2 * error
    if (doubled >= dy) {
      error += dy
      x += stepX
    }
    if (doubled <= dx) {
      error += dx
      y += stepY
    }
    cells.push(y * cols + x)
  }
  return cells
}
