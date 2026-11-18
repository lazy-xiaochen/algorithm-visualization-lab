import { describe, expect, it } from 'vitest'
import { colOf, rowOf } from '../src/core/grid'
import type { GridMap } from '../src/core/grid'
import { ALGORITHMS, compareAlgorithms, runSearch, searchSteps } from '../src/core/search'

function grid(...lines: string[]): GridMap {
  const cells = Array.from(lines.join(''))
  return {
    rows: lines.length,
    cols: lines[0].length,
    start: cells.indexOf('S'),
    goal: cells.indexOf('G'),
    walls: new Set(cells.flatMap((cell, index) => cell === '#' ? [index] : [])),
  }
}

const open = grid('....', 'S.G.', '....')
const closed = grid('S#G', '.#.', '.#.')
const detour = grid('.......', '.S#...G', '..#.#..', '..#.#..', '.......')

describe.each(ALGORITHMS)('%s', (algorithm) => {
  it('finds a path on an empty grid', () => {
    const result = runSearch(open, algorithm)
    expect(result.found).toBe(true)
    expect(result.path.at(0)).toBe(open.start)
    expect(result.path.at(-1)).toBe(open.goal)
    expect(result.distance).toBe(result.path.length - 1)
  })

  it('exhausts the reachable region when the goal is blocked off', () => {
    const result = runSearch(closed, algorithm)
    expect(result).toMatchObject({ found: false, path: [], distance: null, visited: [0, 3, 6] })
  })

  it('returns a zero-step path when start equals goal', () => {
    const result = runSearch({ ...open, goal: open.start }, algorithm)
    expect(result).toMatchObject({
      found: true, distance: 0, path: [open.start], visited: [open.start],
    })
  })

  it('stays off walls and returns only adjacent, in-bounds steps', () => {
    const result = runSearch(detour, algorithm)
    expect(result.found).toBe(true)
    expect(result.path.at(0)).toBe(detour.start)
    expect(result.path.at(-1)).toBe(detour.goal)
    expect(new Set(result.visited).size).toBe(result.visited.length)
    for (const cell of [...result.path, ...result.visited]) {
      expect(cell).toBeGreaterThanOrEqual(0)
      expect(cell).toBeLessThan(detour.rows * detour.cols)
      expect(detour.walls.has(cell)).toBe(false)
    }
    for (let i = 1; i < result.path.length; i++) {
      const here = result.path[i]
      const previous = result.path[i - 1]
      const steps = Math.abs(rowOf(here, detour.cols) - rowOf(previous, detour.cols))
        + Math.abs(colOf(here, detour.cols) - colOf(previous, detour.cols))
      expect(steps).toBe(1)
    }
  })

  it('matches the incremental search order and final path', () => {
    const frames = [...searchSteps(detour, algorithm)]
    const result = runSearch(detour, algorithm)
    expect(frames.map(({ cell }) => cell)).toEqual(result.visited)
    expect(frames.at(-1)?.path).toEqual(result.path)
  })
})

it.each(['bfs', 'dijkstra', 'astar'] as const)('%s uses the shortest unit-cost detour', (algorithm) => {
  expect(runSearch(detour, algorithm).distance).toBe(7)
})

it('compares deterministic counts and routes on the same grid', () => {
  const results = compareAlgorithms(open)
  expect(results.map(({ algorithm, found, distance, visited }) =>
    [algorithm, found, distance, visited.length])).toEqual([
    ['bfs', true, 2, 6],
    ['dfs', true, 8, 9],
    ['dijkstra', true, 2, 6],
    ['astar', true, 2, 3],
  ])
  expect(results[0].visited).toEqual([4, 0, 5, 8, 1, 6])
  expect(results[2].visited).toEqual(results[0].visited)
  for (const result of results) {
    expect(Number.isFinite(result.elapsedMs)).toBe(true)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
  }
})

it('rejects blocked or out-of-bounds endpoints', () => {
  expect(() => runSearch({ ...open, goal: -1 }, 'bfs')).toThrow(RangeError)
  expect(() => runSearch({ ...open, walls: new Set([open.start]) }, 'astar')).toThrow(RangeError)
})
