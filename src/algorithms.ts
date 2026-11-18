import { GitBranch, Sparkles, Waves, Waypoints } from 'lucide-react'
import type { Algorithm } from './core/search'

export const ALGORITHM_INFO = {
  bfs: {
    short: 'BFS',
    name: 'Breadth-first search',
    description: 'Explores in layers from the start. Finds a shortest path on this unit-cost grid.',
    Icon: Waves,
  },
  dfs: {
    short: 'DFS',
    name: 'Depth-first search',
    description: 'Follows one branch as far as it can, then backtracks. Its path may be longer.',
    Icon: GitBranch,
  },
  dijkstra: {
    short: 'Dijkstra',
    name: 'Dijkstra’s algorithm',
    description: 'Expands the frontier in order of distance from the start. Finds a shortest path.',
    Icon: Waypoints,
  },
  astar: {
    short: 'A*',
    name: 'A* search',
    description: 'Uses Manhattan distance to search toward the goal while preserving shortest paths.',
    Icon: Sparkles,
  },
} satisfies Record<Algorithm, { short: string; name: string; description: string; Icon: typeof Waves }>
