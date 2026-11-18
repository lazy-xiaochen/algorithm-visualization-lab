import { expect, it } from 'vitest'
import { brushLine, emptyGrid, exampleGrid, generateMaze, randomizeWalls, resizeGrid } from '../src/core/grid'
import { runSearch } from '../src/core/search'

function seededRandom() {
  let state = 118
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

it('opens with a solvable 20 × 32 example', () => {
  const map = exampleGrid()
  expect(map).toMatchObject({ rows: 20, cols: 32 })
  expect(map.walls.size).toBeGreaterThan(0)
  expect(runSearch(map, 'bfs').found).toBe(true)
})

it.each([[20, 32], [21, 33], [36, 60]])('connects corner endpoints in a %i × %i maze', (rows, cols) => {
  const map = { ...emptyGrid(rows, cols), start: cols - 1, goal: (rows - 1) * cols }
  const maze = generateMaze(map, seededRandom())
  expect(maze.start).toBe(map.start)
  expect(maze.goal).toBe(map.goal)
  expect(maze.walls.size).toBeGreaterThan(0)
  expect(runSearch(maze, 'bfs').found).toBe(true)
  expect(maze.walls).toEqual(generateMaze(map, seededRandom()).walls)
})

it('never places random walls over either endpoint', () => {
  const map = emptyGrid(20, 32)
  const randomized = randomizeWalls(map, () => 0)
  expect(randomized.walls.size).toBe(638)
  expect(randomized.walls.has(map.start)).toBe(false)
  expect(randomized.walls.has(map.goal)).toBe(false)
})

it('preserves in-bounds walls and separates endpoints clamped to the same cell', () => {
  const map = {
    rows: 24, cols: 36, start: 23 * 36 + 35, goal: 22 * 36 + 34,
    walls: new Set([2 * 36 + 1, 19 * 36 + 28, 19 * 36 + 29, 18 * 36 + 33]),
  }
  expect(resizeGrid(map, 20, 30)).toEqual({
    rows: 20, cols: 30, start: 599, goal: 598, walls: new Set([61]),
  })
})

it('fills missed pointer samples along a continuous brush stroke', () => {
  expect(brushLine(11, 15, 10)).toEqual([11, 12, 13, 14, 15])
  expect(brushLine(42, 12, 10)).toEqual([42, 32, 22, 12])
  expect(brushLine(11, 44, 10)).toEqual([11, 22, 33, 44])
})
