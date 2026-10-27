import { useRef, useCallback, useEffect, useState } from 'react';
import { Puzzle, GameState, CellType, TriviaQuestion } from './engine/types';

const GRID_MARGIN = 24;
const MAX_GRID = 420;

interface GridProps {
  puzzle: Puzzle;
  gameState: GameState;
  onCellEnter: (r: number, c: number) => void;
  onDrawStart: () => void;
  onDrawEnd: () => void;
  onTriviaTap: (r: number, c: number, question: TriviaQuestion) => void;
  disabled?: boolean;
}

export default function Grid({ puzzle, gameState, onCellEnter, onDrawStart, onDrawEnd, onTriviaTap, disabled }: GridProps) {
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

  const cbRef = useRef({ onCellEnter, onDrawStart, onDrawEnd, onTriviaTap });
  cbRef.current = { onCellEnter, onDrawStart, onDrawEnd, onTriviaTap };

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const cellSizeRef = useRef(cellSize);
  cellSizeRef.current = cellSize;

  const getCell = useCallback((x: number, y: number): [number, number] | null => {
    const el = gridRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    // Check bounds
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    const col = Math.floor((x - r.left) / cellSizeRef.current);
    const row = Math.floor((y - r.top) / cellSizeRef.current);
    if (row >= 0 && row < puzzle.rows && col >= 0 && col < puzzle.cols) return [row, col];
    return null;
  }, [puzzle.rows, puzzle.cols]);

  const startDraw = useCallback((x: number, y: number) => {
    const c = getCell(x, y);
    if (!c) return; // touch isn't on the grid
    drawing.current = true;
    cbRef.current.onDrawStart();
    lastCell.current = `${c[0]},${c[1]}`;
    cbRef.current.onCellEnter(c[0], c[1]);
  }, [getCell]);

  const moveDraw = useCallback((x: number, y: number) => {
    if (!drawing.current) return;
    const c = getCell(x, y);
    if (c) {
      const k = `${c[0]},${c[1]}`;
      if (k !== lastCell.current) { lastCell.current = k; cbRef.current.onCellEnter(c[0], c[1]); }
    }
  }, [getCell]);

  const endDraw = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    lastCell.current = '';
    cbRef.current.onDrawEnd();
  }, []);

  // Attach to document so SVG overlay can't intercept
  useEffect(() => {
    const ts = (e: TouchEvent) => {
      if (disabledRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      const c = getCell(t.clientX, t.clientY);
      if (c) { e.preventDefault(); startDraw(t.clientX, t.clientY); }
    };
    const tm = (e: TouchEvent) => {
      if (!drawing.current) return;
      e.preventDefault();
      const t = e.touches[0];
      if (t) moveDraw(t.clientX, t.clientY);
    };
    const te = (e: TouchEvent) => {
      if (!drawing.current) return;
      e.preventDefault();
      endDraw();
    };
    const md = (e: MouseEvent) => {
      if (disabledRef.current) return;
      const c = getCell(e.clientX, e.clientY);
      if (c) { e.preventDefault(); startDraw(e.clientX, e.clientY); }
    };
    const mm = (e: MouseEvent) => { moveDraw(e.clientX, e.clientY); };
    const mu = () => { endDraw(); };

    document.addEventListener('touchstart', ts, { passive: false });
    document.addEventListener('touchmove', tm, { passive: false });
    document.addEventListener('touchend', te, { passive: false });
    document.addEventListener('touchcancel', te);
    document.addEventListener('mousedown', md);
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);

    return () => {
      document.removeEventListener('touchstart', ts);
      document.removeEventListener('touchmove', tm);
      document.removeEventListener('touchend', te);
      document.removeEventListener('touchcancel', te);
      document.removeEventListener('mousedown', md);
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup', mu);
    };
  }, [getCell, startDraw, moveDraw, endDraw]);

  const pathSet = new Set(gameState.path.map(([r, c]) => `${r},${c}`));
  const head = gameState.path[gameState.path.length - 1];
  const strokeWidth = cellSize * 0.55;

  const pathPoints = gameState.path.map(([r, c]) => ({
    x: c * cellSize + cellSize / 2,
    y: r * cellSize + cellSize / 2,
  }));

  return (
    <div
      ref={gridRef}
      style={{
        width: gridW, height: gridH,
        borderRadius: 12, overflow: 'hidden',
        backgroundColor: '#e2e5e9', position: 'relative',
        touchAction: 'none', userSelect: 'none',
        WebkitUserSelect: 'none', cursor: 'pointer',
      }}
    >
      {/* Grid cells */}
      {puzzle.grid.map((row, r) =>
        row.map((cell, c) => {
          const isStart = puzzle.start[0] === r && puzzle.start[1] === c;
          const isEnd = puzzle.end[0] === r && puzzle.end[1] === c;
          const isWall = cell.type === CellType.Wall;
          const isTrivia = cell.type === CellType.TriviaWall;
          const cellKey = `${r},${c}`;
          const isUnlocked = gameState.unlockedCells.has(cellKey);
          const isFailed = gameState.failedCells.has(cellKey);
          const inPath = pathSet.has(cellKey);
          const triviaQ = puzzle.triviaQuestions.get(cellKey);

          let bg = '#f0f1f3';
          if (isWall) bg = '#1a1a2e';
          if (isTrivia && !isUnlocked && !isFailed) bg = '#2a2a3e';
          if (isTrivia && isFailed) bg = '#1a1a2e';
          if (isTrivia && isUnlocked) bg = '#f0f1f3';

          const isTappable = isTrivia && !isUnlocked && !isFailed && !gameState.completed;

          return (
            <div
              key={`${r}-${c}`}
              onClick={isTappable && triviaQ ? (e) => {
                e.stopPropagation();
                cbRef.current.onTriviaTap(r, c, triviaQ);
              } : undefined}
              style={{
                position: 'absolute',
                left: c * cellSize, top: r * cellSize,
                width: cellSize, height: cellSize,
                backgroundColor: bg,
                borderRadius: (isWall || (isTrivia && !isUnlocked)) ? 4 : 0,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxSizing: 'border-box',
                border: (isWall || (isTrivia && !isUnlocked)) ? 'none' : '1px solid rgba(0,0,0,0.06)',
                pointerEvents: isTappable ? 'auto' : 'none',
                cursor: isTappable ? 'pointer' : 'default',
                overflow: 'hidden',
              }}
            >
              {isTrivia && !isUnlocked && !isFailed && (
                <span style={{
                  color: '#fff', fontSize: Math.max(cellSize * 0.32, 11),
                  fontWeight: 700, lineHeight: 1, opacity: 0.9,
                  letterSpacing: -0.5,
                }}>
                  {triviaQ ? { entertainment: 'E', world: 'W', history: 'H', sports: 'S', science: 'Sc' }[triviaQ.category] : ''}?
                </span>
              )}
              {isTrivia && isFailed && (
                <span style={{ fontSize: Math.max(cellSize * 0.3, 10), color: '#ef5350', fontWeight: 800 }}>
                  +1
                </span>
              )}
              {isStart && !inPath && (
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: '#4caf50',
                  boxShadow: '0 0 10px rgba(76,175,80,0.4)',
                }} />
              )}
              {isEnd && !inPath && (
                <div style={{
                  padding: '4px 8px', borderRadius: 4,
                  backgroundColor: '#ff5252',
                }}>
                  <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>GOAL</span>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Paint stripe SVG overlay */}
      {pathPoints.length > 0 && (
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={gridW}
          height={gridH}
          viewBox={`0 0 ${gridW} ${gridH}`}
        >
          <defs>
            <linearGradient id="paint-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#66bb6a" />
              <stop offset="100%" stopColor="#43a047" />
            </linearGradient>
            <filter id="paint-texture">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
            </filter>
          </defs>

          {/* Shadow */}
          <polyline
            points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main paint stripe */}
          <polyline
            points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="url(#paint-grad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#paint-texture)"
          />

          {/* Glossy highlight */}
          <polyline
            points={pathPoints.map(p => `${p.x},${p.y - strokeWidth * 0.15}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={strokeWidth * 0.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Head dot */}
          {head && (
            <>
              <circle
                cx={head[1] * cellSize + cellSize / 2}
                cy={head[0] * cellSize + cellSize / 2}
                r={strokeWidth * 0.42}
                fill="#2e7d32"
                opacity={0.3}
              />
              <circle
                cx={head[1] * cellSize + cellSize / 2}
                cy={head[0] * cellSize + cellSize / 2}
                r={strokeWidth * 0.32}
                fill="#fff"
                opacity={0.9}
              />
            </>
          )}

          {/* Start circle on stripe */}
          {gameState.path.length > 0 && (
            <circle
              cx={puzzle.start[1] * cellSize + cellSize / 2}
              cy={puzzle.start[0] * cellSize + cellSize / 2}
              r={strokeWidth * 0.35}
              fill="#2e7d32"
              stroke="#fff"
              strokeWidth={2}
            />
          )}

          {/* Goal on top if reached */}
          {gameState.completed && (
            <>
              <circle
                cx={puzzle.end[1] * cellSize + cellSize / 2}
                cy={puzzle.end[0] * cellSize + cellSize / 2}
                r={strokeWidth * 0.4}
                fill="#4caf50"
              />
              <text
                x={puzzle.end[1] * cellSize + cellSize / 2}
                y={puzzle.end[0] * cellSize + cellSize / 2 + 3}
                textAnchor="middle"
                fill="#fff"
                fontSize={8}
                fontWeight={800}
                letterSpacing={1}
              >
                GOAL
              </text>
            </>
          )}
        </svg>
      )}
    </div>
  );
}
