import { useRef, useCallback, useEffect, useState } from 'react';
import { Puzzle, GameState, CellType } from './engine/types';

const GRID_MARGIN = 24;
const MAX_GRID = 420;

interface GridProps {
  puzzle: Puzzle;
  gameState: GameState;
  onCellEnter: (r: number, c: number) => void;
  onDrawStart: () => void;
  onDrawEnd: () => void;
}

export default function Grid({ puzzle, gameState, onCellEnter, onDrawStart, onDrawEnd }: GridProps) {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const cellSize = Math.min(
    Math.floor((width - GRID_MARGIN * 2) / puzzle.cols),
    Math.floor(MAX_GRID / puzzle.cols)
  );
  const gridW = cellSize * puzzle.cols;
  const gridH = cellSize * puzzle.rows;

  const gridRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const lastCell = useRef('');

  const cbRef = useRef({ onCellEnter, onDrawStart, onDrawEnd });
  cbRef.current = { onCellEnter, onDrawStart, onDrawEnd };

  const cellSizeRef = useRef(cellSize);
  cellSizeRef.current = cellSize;

  const getCell = useCallback((x: number, y: number): [number, number] | null => {
    const el = gridRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const col = Math.floor((x - r.left) / cellSizeRef.current);
    const row = Math.floor((y - r.top) / cellSizeRef.current);
    if (row >= 0 && row < puzzle.rows && col >= 0 && col < puzzle.cols) return [row, col];
    return null;
  }, [puzzle.rows, puzzle.cols]);

  const start = useCallback((x: number, y: number) => {
    drawing.current = true;
    cbRef.current.onDrawStart();
    const c = getCell(x, y);
    if (c) { lastCell.current = `${c[0]},${c[1]}`; cbRef.current.onCellEnter(c[0], c[1]); }
  }, [getCell]);

  const move = useCallback((x: number, y: number) => {
    if (!drawing.current) return;
    const c = getCell(x, y);
    if (c) {
      const k = `${c[0]},${c[1]}`;
      if (k !== lastCell.current) { lastCell.current = k; cbRef.current.onCellEnter(c[0], c[1]); }
    }
  }, [getCell]);

  const end = useCallback(() => {
    drawing.current = false;
    lastCell.current = '';
    cbRef.current.onDrawEnd();
  }, []);

  // Attach touch/mouse — runs once after mount
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const ts = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; if (t) start(t.clientX, t.clientY); };
    const tm = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; if (t) move(t.clientX, t.clientY); };
    const te = (e: TouchEvent) => { e.preventDefault(); end(); };
    const md = (e: MouseEvent) => { e.preventDefault(); start(e.clientX, e.clientY); };
    const mm = (e: MouseEvent) => { move(e.clientX, e.clientY); };
    const mu = () => { end(); };

    el.addEventListener('touchstart', ts, { passive: false });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', te, { passive: false });
    el.addEventListener('touchcancel', te);
    el.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);

    return () => {
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', te);
      el.removeEventListener('touchcancel', te);
      el.removeEventListener('mousedown', md);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
    };
  }, [start, move, end]);

  const pathSet = new Set(gameState.path.map(([r, c]) => `${r},${c}`));
  const head = gameState.path[gameState.path.length - 1];

  return (
    <div
      ref={gridRef}
      style={{
        width: gridW, height: gridH,
        borderRadius: 12, overflow: 'hidden',
        backgroundColor: '#eef0f2', position: 'relative',
        touchAction: 'none', userSelect: 'none',
        WebkitUserSelect: 'none', cursor: 'pointer',
      }}
    >
      {/* Cells */}
      {puzzle.grid.map((row, r) =>
        row.map((cell, c) => {
          const isStart = puzzle.start[0] === r && puzzle.start[1] === c;
          const isEnd = puzzle.end[0] === r && puzzle.end[1] === c;
          const inPath = pathSet.has(`${r},${c}`);
          const isHead = head && head[0] === r && head[1] === c;
          const isWall = cell.type === CellType.Wall;

          let bg = '#f8f9fa';
          if (isWall) bg = '#1a1a2e';
          else if (inPath) bg = '#e8f5e9';

          return (
            <div
              key={`${r}-${c}`}
              style={{
                position: 'absolute',
                left: c * cellSize, top: r * cellSize,
                width: cellSize, height: cellSize,
                backgroundColor: bg,
                borderRadius: isWall ? 4 : 0,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxSizing: 'border-box',
                border: '0.5px solid rgba(0,0,0,0.04)',
                pointerEvents: 'none',
              }}
            >
              {isStart && (
                <div style={{
                  width: 20, height: 20, borderRadius: 10,
                  backgroundColor: '#4caf50',
                  boxShadow: isHead ? '0 0 12px rgba(76,175,80,0.6)' : 'none',
                }} />
              )}
              {isEnd && (
                <div style={{
                  padding: '3px 6px', borderRadius: 4,
                  backgroundColor: gameState.completed ? '#4caf50' : '#ff5252',
                }}>
                  <span style={{ color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>GOAL</span>
                </div>
              )}
              {isHead && !isStart && !isEnd && (
                <div style={{
                  width: 18, height: 18, borderRadius: 9,
                  backgroundColor: '#2196f3',
                  boxShadow: '0 0 12px rgba(33,150,243,0.5)',
                }} />
              )}
              {inPath && !isHead && !isStart && !isEnd && (
                <div style={{
                  width: 10, height: 10, borderRadius: 5,
                  backgroundColor: '#81c784', opacity: 0.7,
                }} />
              )}
            </div>
          );
        })
      )}

      {/* Path lines */}
      {gameState.path.slice(0, -1).map(([r1, c1], i) => {
        const [r2, c2] = gameState.path[i + 1];
        const x1 = c1 * cellSize + cellSize / 2;
        const y1 = r1 * cellSize + cellSize / 2;
        const x2 = c2 * cellSize + cellSize / 2;
        const y2 = r2 * cellSize + cellSize / 2;
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const ang = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

        return (
          <div key={`l${i}`} style={{
            position: 'absolute',
            left: x1, top: y1 - 2,
            width: len, height: 4,
            backgroundColor: '#4caf50', borderRadius: 2,
            transform: `rotate(${ang}deg)`, transformOrigin: '0% 50%',
            pointerEvents: 'none',
          }} />
        );
      })}
    </div>
  );
}
