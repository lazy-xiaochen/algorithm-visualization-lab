import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Minus } from 'lucide-react'
import { ALGORITHM_INFO } from '../algorithms'
import { GRID_LIMITS } from '../core/grid'
import type { GridMap } from '../core/grid'
import type { compareAlgorithms } from '../core/search'
import { Dialog } from './Dialog'

export const formatTime = (milliseconds: number) => `${milliseconds.toFixed(3)} ms`

export function CompareDialog({ results, map, onClose }: {
  results: ReturnType<typeof compareAlgorithms>
  map: GridMap
  onClose: () => void
}) {
  return (
    <Dialog title="Compare algorithms" wide onClose={onClose}>
      <p className="dialog-description">
        All four searches used this {map.rows} × {map.cols} grid with {map.walls.size} walls and the same endpoints.
      </p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Algorithm comparison results">
        <table>
          <thead>
            <tr>
              <th scope="col">Algorithm</th>
              <th scope="col">Outcome</th>
              <th scope="col">Steps</th>
              <th scope="col">Explored</th>
              <th scope="col">Compute time</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.algorithm}>
                <th scope="row">{ALGORITHM_INFO[result.algorithm].short}</th>
                <td>
                  <span className={`outcome ${result.found ? 'outcome-found' : 'outcome-missing'}`}>
                    {result.found ? <Check size={13} /> : <Minus size={13} />}
                    {result.found ? 'Found' : 'No path'}
                  </span>
                </td>
                <td>{result.distance ?? '—'}</td>
                <td>{result.visited.length}</td>
                <td>{formatTime(result.elapsedMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-note">Compute time covers the search itself and can vary between runs.</p>
    </Dialog>
  )
}

export function SizeDialog({ map, onResize, onClose }: {
  map: GridMap
  onResize: (rows: number, cols: number) => void
  onClose: () => void
}) {
  const [rows, setRows] = useState(String(map.rows))
  const [cols, setCols] = useState(String(map.cols))

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const rowsValue = Number(rows)
    const colsValue = Number(cols)
    if (!Number.isInteger(rowsValue) || !Number.isInteger(colsValue)
      || rowsValue < GRID_LIMITS.rows.min || rowsValue > GRID_LIMITS.rows.max
      || colsValue < GRID_LIMITS.cols.min || colsValue > GRID_LIMITS.cols.max) return
    onResize(rowsValue, colsValue)
    onClose()
  }

  return (
    <Dialog title="Grid size" onClose={onClose}>
      <p className="dialog-description">Walls inside the new bounds are kept. Endpoints are moved inside the grid if needed.</p>
      <form onSubmit={apply}>
        <div className="dimensions">
          <label>
            Rows
            <input required type="number" min={GRID_LIMITS.rows.min} max={GRID_LIMITS.rows.max}
              value={rows} onChange={(event) => setRows(event.target.value)} />
            <small>{GRID_LIMITS.rows.min}–{GRID_LIMITS.rows.max} rows</small>
          </label>
          <label>
            Columns
            <input required type="number" min={GRID_LIMITS.cols.min} max={GRID_LIMITS.cols.max}
              value={cols} onChange={(event) => setCols(event.target.value)} />
            <small>{GRID_LIMITS.cols.min}–{GRID_LIMITS.cols.max} columns</small>
          </label>
        </div>
        <div className="dialog-actions">
          <button type="button" className="button button-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button-primary">Apply size</button>
        </div>
      </form>
    </Dialog>
  )
}

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="How to use" onClose={onClose}>
      <dl className="help-list">
        <div>
          <dt>Edit the map</dt>
          <dd>Click or drag with Draw or Erase selected. Drag the start and goal markers onto open cells.</dd>
        </div>
        <div>
          <dt>Watch the search</dt>
          <dd>Choose an algorithm, then start the search or use Step to explore one cell at a time. Each move costs 1 and follows a horizontal or vertical edge.</dd>
        </div>
        <div>
          <dt>Compare results</dt>
          <dd>Run all four algorithms on the current map and compare the route length, cells explored, and computation time.</dd>
        </div>
        <div>
          <dt>Use the keyboard</dt>
          <dd>Tab to the grid. Use arrow keys to move, Space to draw or erase, and S or G to place either endpoint.</dd>
        </div>
      </dl>
    </Dialog>
  )
}
