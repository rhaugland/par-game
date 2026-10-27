import { useRef, useCallback, useState, useEffect, PointerEvent } from 'react';
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
}

export default function Grid({ puzzle, gameState, onCellEnter, onDrawStart, onDrawEnd, onTriviaTap }: GridProps) {
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

  const getCell = useCallback((x: number, y: number): [number, number] | null => {
    const el = gridRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    const col = Math.floor((x - r.left) / cellSize);
    const row = Math.floor((y - r.top) / cellSize);
    if (row >= 0 && row < puzzle.rows && col >= 0 && col < puzzle.cols) return [row, col];
    return null;
  }, [puzzle.rows, puzzle.cols, cellSize]);

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Capture all future pointer events to this element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const c = getCell(e.clientX, e.clientY);
    if (!c) return;

    // Check trivia tap first
    const cell = puzzle.grid[c[0]][c[1]];
    const key = `${c[0]},${c[1]}`;
    if (cell.type === CellType.TriviaWall && !gameState.completed &&
        !gameState.unlockedCells.has(key) && !gameState.failedCells.has(key)) {
      const q = puzzle.triviaQuestions.get(key);
      if (q) { onTriviaTap(c[0], c[1], q); return; }
    }

    drawing.current = true;
    onDrawStart();
    lastCell.current = key;
    onCellEnter(c[0], c[1]);
  }, [getCell, puzzle, gameState, onCellEnter, onDrawStart, onTriviaTap]);

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const c = getCell(e.clientX, e.clientY);
    if (c) {
      const k = `${c[0]},${c[1]}`;
      if (k !== lastCell.current) {
        lastCell.current = k;
        onCellEnter(c[0], c[1]);
      }
    }
  }, [getCell, onCellEnter]);

  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    drawing.current = false;
    lastCell.current = '';
    onDrawEnd();
  }, [onDrawEnd]);

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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: gridW, height: gridH,
        borderRadius: 12, overflow: 'hidden',
        backgroundColor: '#e2e5e9', position: 'relative',
        touchAction: 'none', userSelect: 'none',
        WebkitUserSelect: 'none', cursor: 'pointer',
      }}
    >
      {/* Grid cells — all pointer-events: none so events pass to grid div */}
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

          return (
            <div
              key={cellKey}
              style={{
                position: 'absolute',
                left: c * cellSize, top: r * cellSize,
                width: cellSize, height: cellSize,
                backgroundColor: bg,
                borderRadius: (isWall || (isTrivia && !isUnlocked)) ? 4 : 0,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxSizing: 'border-box',
                border: (isWall || (isTrivia && !isUnlocked)) ? 'none' : '1px solid rgba(0,0,0,0.06)',
                pointerEvents: 'none',
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

      {/* Paint stripe SVG — pointer-events none via SVG attribute */}
      {pathPoints.length > 0 && (
        <svg
          width={gridW} height={gridH}
          viewBox={`0 0 ${gridW} ${gridH}`}
          style={{ position: 'absolute', inset: 0 }}
          pointerEvents="none"
        >
          <defs>
            <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#66bb6a" />
              <stop offset="100%" stopColor="#43a047" />
            </linearGradient>
            <filter id="pt">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="2" />
            </filter>
          </defs>
          <g pointerEvents="none">
            <polyline points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="rgba(0,0,0,0.08)"
              strokeWidth={strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="url(#pg)"
              strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
              filter="url(#pt)" />
            <polyline points={pathPoints.map(p => `${p.x},${p.y - strokeWidth * 0.15}`).join(' ')}
              fill="none" stroke="rgba(255,255,255,0.25)"
              strokeWidth={strokeWidth * 0.3} strokeLinecap="round" strokeLinejoin="round" />
            {head && (
              <>
                <circle cx={head[1] * cellSize + cellSize / 2} cy={head[0] * cellSize + cellSize / 2}
                  r={strokeWidth * 0.42} fill="#2e7d32" opacity={0.3} />
                <circle cx={head[1] * cellSize + cellSize / 2} cy={head[0] * cellSize + cellSize / 2}
                  r={strokeWidth * 0.32} fill="#fff" opacity={0.9} />
              </>
            )}
            {gameState.path.length > 0 && (
              <circle cx={puzzle.start[1] * cellSize + cellSize / 2} cy={puzzle.start[0] * cellSize + cellSize / 2}
                r={strokeWidth * 0.35} fill="#2e7d32" stroke="#fff" strokeWidth={2} />
            )}
            {gameState.completed && (
              <>
                <circle cx={puzzle.end[1] * cellSize + cellSize / 2} cy={puzzle.end[0] * cellSize + cellSize / 2}
                  r={strokeWidth * 0.4} fill="#4caf50" />
                <text x={puzzle.end[1] * cellSize + cellSize / 2} y={puzzle.end[0] * cellSize + cellSize / 2 + 3}
                  textAnchor="middle" fill="#fff" fontSize={8} fontWeight={800} letterSpacing={1}>
                  GOAL
                </text>
              </>
            )}
            {/* Par path ghost line */}
            {gameState.parPath && gameState.parPath.length > 1 && (
              <polyline
                points={gameState.parPath.map(([r, c]) => `${c * cellSize + cellSize / 2},${r * cellSize + cellSize / 2}`).join(' ')}
                fill="none" stroke="rgba(33,150,243,0.35)"
                strokeWidth={strokeWidth * 0.4} strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="6,4"
              />
            )}
          </g>
        </svg>
      )}
    </div>
  );
}
