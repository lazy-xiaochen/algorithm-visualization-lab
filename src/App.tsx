import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  BarChart3, CircleHelp, Eraser, Flag, Grid3X3, MousePointer2, Navigation, Pause, Pencil,
  Play, RotateCcw, Route, Shuffle, SkipForward, Trash2, Workflow,
} from 'lucide-react'
import { ALGORITHM_INFO } from './algorithms'
import { Board } from './components/Board'
import type { Brush, Endpoint } from './components/Board'
import { CompareDialog, HelpDialog, SizeDialog, formatTime } from './components/LabDialogs'
import { emptyGrid, exampleGrid, generateMaze, randomizeWalls, resizeGrid } from './core/grid'
import type { CellId, GridMap } from './core/grid'
import { ALGORITHMS, compareAlgorithms } from './core/search'
import type { Algorithm } from './core/search'
import { useSearchPlayback } from './useSearchPlayback'

const phaseLabels = {
  idle: 'Ready',
  running: 'Searching',
  paused: 'Paused',
  success: 'Path found',
  failure: 'No path found',
}

const playbackLabels = {
  idle: 'Start search',
  running: 'Pause',
  paused: 'Resume',
  success: 'Run again',
  failure: 'Run again',
}

const legend = [
  { label: 'Start', type: 'start', Icon: Navigation },
  { label: 'Goal', type: 'goal', Icon: Flag },
  { label: 'Wall', type: 'wall' },
  { label: 'Exploring', type: 'current' },
  { label: 'Visited', type: 'visited' },
  { label: 'Path', type: 'path' },
] as const

export function App() {
  const [map, setMap] = useState(exampleGrid)
  const activeMap = useRef(map)
  const [brush, setBrush] = useState<Brush>('wall')
  const [algorithm, setAlgorithm] = useState<Algorithm>('astar')
  const [speed, setSpeed] = useState(32)
  const [dialog, setDialog] = useState<'size' | 'help' | null>(null)
  const [comparison, setComparison] = useState<{
    map: GridMap
    results: ReturnType<typeof compareAlgorithms>
  } | null>(null)
  const playback = useSearchPlayback(speed)
  const { frame } = playback
  const PlaybackIcon = frame.phase === 'running' ? Pause : Play

  function updateMap(nextMap: GridMap) {
    activeMap.current = nextMap
    setMap(nextMap)
    playback.clear()
  }

  function paint(cells: CellId[], mode: Brush) {
    const current = activeMap.current
    const draw = mode === 'wall'
    const changed = cells.filter((cell) =>
      cell !== current.start && cell !== current.goal && current.walls.has(cell) !== draw)
    if (!changed.length) return
    const walls = new Set(current.walls)
    for (const cell of changed) {
      if (draw) walls.add(cell)
      else walls.delete(cell)
    }
    updateMap({ ...current, walls })
  }

  function move(endpoint: Endpoint, cell: CellId) {
    const current = activeMap.current
    if (cell === current.start || cell === current.goal || current.walls.has(cell)) return
    updateMap({ ...current, [endpoint]: cell })
  }

  const closeDialog = () => setDialog(null)

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark"><Route size={22} strokeWidth={2.2} /></span>
            <span>Algorithm Visualization Lab</span>
          </div>
          <button className="button help-button" type="button" onClick={() => setDialog('help')}>
            <CircleHelp size={17} /> <span>How to use</span>
          </button>
        </div>
      </header>

      <main className="main">
        <div className="intro">
          <div>
            <h1>Pathfinding playground</h1>
            <p>Build a map, watch it being searched, and compare four classic algorithms.</p>
          </div>
          <button
            type="button"
            className="button button-compare"
            onClick={() => setComparison({ map, results: compareAlgorithms(map) })}
          >
            <BarChart3 size={19} /> Compare algorithms
          </button>
        </div>

        <div className="workspace">
          <section className="card map-card" aria-labelledby="map-title">
            <div className="map-header">
              <div className="map-title">
                <h2 id="map-title">Grid map</h2>
                <span className="size-chip">{map.rows} × {map.cols}</span>
              </div>
              <div className="map-actions" aria-label="Map actions">
                <button type="button" className="button button-outline" onClick={() => updateMap(randomizeWalls(map))}>
                  <Shuffle size={15} /> Random walls
                </button>
                <button type="button" className="button button-outline" onClick={() => updateMap(generateMaze(map))}>
                  <Workflow size={15} /> Maze
                </button>
                <button type="button" className="button button-outline" onClick={() => updateMap(emptyGrid(map.rows, map.cols))}>
                  <RotateCcw size={15} /> Reset map
                </button>
              </div>
            </div>

            <div className="map-body">
              <div className="edit-toolbar">
                <div className="brush-group" role="group" aria-label="Wall editing tool">
                  <button type="button" aria-pressed={brush === 'wall'} onClick={() => setBrush('wall')}>
                    <Pencil size={14} /> Draw
                  </button>
                  <button type="button" aria-pressed={brush === 'erase'} onClick={() => setBrush('erase')}>
                    <Eraser size={15} /> Erase
                  </button>
                </div>
                <button type="button" className="button size-button" onClick={() => setDialog('size')}>
                  <Grid3X3 size={15} /> Grid size
                </button>
              </div>
              <div className="board-shell">
                <Board map={map} brush={brush} visited={frame.visited} path={frame.path}
                  current={frame.current} onPaint={paint} onMove={move} />
              </div>
              <ul className="legend" aria-label="Grid legend">
                {legend.map((item) => (
                  <li key={item.type}>
                    <span className={`legend-key key-${item.type}`}>
                      {'Icon' in item && <item.Icon size={10} strokeWidth={2.8} />}
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="board-tip" id="board-instructions">
              <MousePointer2 size={15} />
              <span>Drag across cells to edit walls. Drag either marker to move it.</span>
            </div>
          </section>

          <aside className="control-panel" aria-label="Search controls and metrics">
            <section className="card side-card" aria-labelledby="algorithm-title">
              <h2 id="algorithm-title">Search algorithm</h2>
              <div className="algorithm-options" role="radiogroup" aria-labelledby="algorithm-title">
                {ALGORITHMS.map((id) => {
                  const { short, name, Icon } = ALGORITHM_INFO[id]
                  return (
                    <label className="algorithm-option" key={id} title={name}>
                      <input type="radio" name="algorithm" value={id}
                        checked={id === algorithm} onChange={() => {
                          setAlgorithm(id)
                          playback.clear()
                        }} />
                      <span><Icon size={17} strokeWidth={2.2} /> {short}</span>
                    </label>
                  )
                })}
              </div>
              <div className="algorithm-description" aria-live="polite">
                <strong>{ALGORITHM_INFO[algorithm].name}</strong>
                <p>{ALGORITHM_INFO[algorithm].description}</p>
              </div>
            </section>

            <section className="card side-card" aria-labelledby="playback-title">
              <h2 id="playback-title">Playback</h2>
              <button className="button button-primary playback-primary" type="button"
                onClick={() => playback.toggle(activeMap.current, algorithm)}>
                <PlaybackIcon size={17} fill="currentColor" /> {playbackLabels[frame.phase]}
              </button>
              <div className="playback-secondary">
                <button className="button button-outline" type="button" disabled={frame.phase === 'running'}
                  onClick={() => playback.step(activeMap.current, algorithm)}>
                  <SkipForward size={16} /> Step
                </button>
                <button className="button button-outline" type="button" onClick={playback.clear}>
                  <Trash2 size={15} /> Clear trace
                </button>
              </div>
              <div className="speed-control">
                <label htmlFor="speed">Animation speed</label>
                <output htmlFor="speed">{speed} cells/s</output>
                <input id="speed" type="range" min={2} max={120} step={1} value={speed}
                  style={{ '--progress': `${(speed - 2) / 118 * 100}%` } as CSSProperties}
                  onChange={(event) => setSpeed(Number(event.target.value))} />
              </div>
            </section>

            <section className="card side-card metrics" aria-labelledby="metrics-title">
              <div className="metrics-header">
                <h2 id="metrics-title">Live metrics</h2>
                <span role="status" className={`status status-${frame.phase}`}>{phaseLabels[frame.phase]}</span>
              </div>
              <dl className="metrics-list">
                <div><dt>Cells explored</dt><dd>{frame.visited.size}</dd></div>
                <div><dt>Path length</dt><dd>{frame.distance === null ? '—' : `${frame.distance} steps`}</dd></div>
                <div><dt>Compute time</dt><dd>{frame.phase === 'idle' ? '—' : formatTime(frame.elapsedMs)}</dd></div>
              </dl>
            </section>
          </aside>
        </div>
      </main>

      {dialog === 'help' && <HelpDialog onClose={closeDialog} />}
      {dialog === 'size' && <SizeDialog map={map} onResize={(rows, cols) => {
        if (rows !== map.rows || cols !== map.cols) updateMap(resizeGrid(map, rows, cols))
      }} onClose={closeDialog} />}
      {comparison && <CompareDialog {...comparison} onClose={() => setComparison(null)} />}
    </>
  )
}
