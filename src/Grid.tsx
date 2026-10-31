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
  const rectCache = useRef<DOMRect | null>(null);

  const getCell = useCallback((x: number, y: number): [number, number] | null => {
    const el = gridRef.current;
    if (!el) return null;
    // Cache bounding rect during a drag for smoother perf
    if (!rectCache.current) rectCache.current = el.getBoundingClientRect();
    const r = rectCache.current;
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    const col = Math.floor((x - r.left) / cellSize);
    const row = Math.floor((y - r.top) / cellSize);
    if (row >= 0 && row < puzzle.rows && col >= 0 && col < puzzle.cols) return [row, col];
    return null;
  }, [puzzle.rows, puzzle.cols, cellSize]);

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    // Refresh rect cache on each drag start
    rectCache.current = gridRef.current?.getBoundingClientRect() ?? null;

    const c = getCell(e.clientX, e.clientY);
    if (!c) return;

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
    rectCache.current = null;
    onDrawEnd();
  }, [onDrawEnd]);

  const pathSet = new Set(gameState.path.map(([r, c]) => `${r},${c}`));
  const head = gameState.path.length > 1 ? gameState.path[gameState.path.length - 1] : null;
  const strokeWidth = cellSize * 0.55;

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
      {puzzle.grid.map((row, r) =>
        row.map((cell, c) => {
          const isStart = puzzle.start[0] === r && puzzle.start[1] === c;
          const isEnd = puzzle.end[0] === r && puzzle.end[1] === c;
          const isWall = cell.type === CellType.Wall;
          const isTrivia = cell.type === CellType.TriviaWall;
          const isIce = cell.type === CellType.Ice;
          const isSand = cell.type === CellType.Sand;
          const isTrap = cell.type === CellType.Trap;
          const isWarp = cell.type === CellType.Warp;
          const cellKey = `${r},${c}`;
          const isUnlocked = gameState.unlockedCells.has(cellKey);
          const isFailed = gameState.failedCells.has(cellKey);
          const inPath = pathSet.has(cellKey);
          const triviaQ = puzzle.triviaQuestions.get(cellKey);
          const trapTriggered = gameState.triggeredTraps.has(cellKey);
          const warpTriggered = gameState.triggeredWarps.has(cellKey);
          const isHead = head && head[0] === r && head[1] === c;

          // Base background
          let bg = '#f0f1f3';
          if (isWall) bg = '#1a1a2e';
          if (isTrivia && !isUnlocked && !isFailed) bg = '#2a2a3e';
          if (isTrivia && isFailed) bg = '#1a1a2e';
          if (isTrivia && isUnlocked) bg = '#f0f1f3';
          if (isIce) bg = '#b3e5fc';
          if (isSand) bg = '#ffe0b2';
          if (isTrap && !trapTriggered) bg = '#ffcdd2';
          if (isTrap && trapTriggered) bg = '#f0f1f3';
          if (isWarp && !warpTriggered) bg = '#e1bee7';
          if (isWarp && warpTriggered) bg = '#f0f1f3';

          // Path fills the cell green
          if (inPath && !isWall && !(isTrivia && !isUnlocked)) {
            if (isEnd) bg = '#e53935';
            else if (isIce) bg = '#81d4fa'; // slightly brighter ice on path
            else if (isSand) bg = '#ffcc80'; // slightly brighter sand on path
            else bg = '#66bb6a';
          }

          const isSolid = isWall || (isTrivia && !isUnlocked);

          return (
            <div
              key={cellKey}
              style={{
                position: 'absolute',
                left: c * cellSize, top: r * cellSize,
                width: cellSize, height: cellSize,
                backgroundColor: bg,
                borderRadius: isSolid ? 4 : 0,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxSizing: 'border-box',
                border: isSolid ? 'none' : '1px solid rgba(0,0,0,0.06)',
                pointerEvents: 'none',
                overflow: 'hidden',
              }}
            >
              {/* Trivia label */}
              {isTrivia && !isUnlocked && !isFailed && (
                <span style={{
                  color: '#fff', fontSize: Math.max(cellSize * 0.32, 11),
                  fontWeight: 700, lineHeight: 1, opacity: 0.9, letterSpacing: -0.5,
                }}>
                  {triviaQ ? { entertainment: 'E', world: 'W', history: 'H', sports: 'S', science: 'Sc' }[triviaQ.category] : ''}?
                </span>
              )}
              {isTrivia && isFailed && (
                <span style={{ fontSize: Math.max(cellSize * 0.3, 10), color: '#ef5350', fontWeight: 800 }}>+1</span>
              )}

              {/* Ice indicator — show on path and off path */}
              {isIce && !inPath && (
                <svg width={cellSize * 0.5} height={cellSize * 0.5} viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4 }}>
                  <path d="M8 2v12M2 8h12M4 4l8 8M12 4l-8 8" stroke="#0288d1" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              {isIce && inPath && (
                <svg width={cellSize * 0.5} height={cellSize * 0.5} viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5 }}>
                  <path d="M8 2v12M2 8h12M4 4l8 8M12 4l-8 8" stroke="#01579b" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}

              {/* Sand dots — show on path and off path */}
              {isSand && !inPath && (
                <svg width={cellSize * 0.5} height={cellSize * 0.5} viewBox="0 0 16 16" fill="#e65100" style={{ opacity: 0.35 }}>
                  <circle cx="4" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" />
                </svg>
              )}
              {isSand && inPath && (
                <svg width={cellSize * 0.5} height={cellSize * 0.5} viewBox="0 0 16 16" fill="#bf360c" style={{ opacity: 0.45 }}>
                  <circle cx="4" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" />
                </svg>
              )}

              {/* Trap icon */}
              {isTrap && !trapTriggered && (
                <span style={{
                  fontSize: Math.max(cellSize * 0.4, 12), fontWeight: 800,
                  color: '#c62828', lineHeight: 1,
                }}>!</span>
              )}

              {/* Warp icon — spiral/portal */}
              {isWarp && !warpTriggered && (
                <svg width={cellSize * 0.55} height={cellSize * 0.55} viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
                  <circle cx="12" cy="12" r="8" stroke="#7b1fa2" strokeWidth="2" strokeDasharray="4 3" />
                  <circle cx="12" cy="12" r="3" fill="#7b1fa2" />
                </svg>
              )}

              {/* Start dot — always visible */}
              {isStart && !inPath && (
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: '#4caf50',
                  boxShadow: '0 0 10px rgba(76,175,80,0.4)',
                }} />
              )}

              {/* End goal */}
              {isEnd && (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: inPath ? 'transparent' : '#ff5252',
                  borderRadius: inPath ? 0 : 4,
                }}>
                  <span style={{
                    color: '#fff', fontSize: Math.max(cellSize * 0.28, 8),
                    fontWeight: 800, letterSpacing: 0.5, lineHeight: 1,
                  }}>
                    GOAL
                  </span>
                </div>
              )}

              {/* Head indicator — white dot on current cell */}
              {isHead && !isEnd && (
                <div style={{
                  position: 'absolute',
                  width: cellSize * 0.4, height: cellSize * 0.4,
                  borderRadius: '50%', backgroundColor: '#fff',
                  boxShadow: '0 0 6px rgba(0,0,0,0.15)',
                }} />
              )}
            </div>
          );
        })
      )}

      {/* SVG overlay for start marker and par path only */}
      <svg
        width={gridW} height={gridH}
        viewBox={`0 0 ${gridW} ${gridH}`}
        style={{ position: 'absolute', inset: 0 }}
        pointerEvents="none"
      >
        {/* Start circle marker */}
        {gameState.path.length > 0 && (
          <circle cx={puzzle.start[1] * cellSize + cellSize / 2} cy={puzzle.start[0] * cellSize + cellSize / 2}
            r={cellSize * 0.22} fill="#2e7d32" stroke="#fff" strokeWidth={2} />
        )}

        {/* Par path ghost line (powerup) */}
        {gameState.parPath && gameState.parPath.length > 1 && (
          <polyline
            points={gameState.parPath.map(([r, c]) => `${c * cellSize + cellSize / 2},${r * cellSize + cellSize / 2}`).join(' ')}
            fill="none" stroke="rgba(33,150,243,0.35)"
            strokeWidth={strokeWidth * 0.4} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="6,4"
          />
        )}
      </svg>
    </div>
  );
}
