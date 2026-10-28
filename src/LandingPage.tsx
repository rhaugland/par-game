import { CellType } from './engine/types';

interface Props {
  dark: boolean;
  onPlay: () => void;
}

// Completed demo — path on empty cells, special tiles visible off-path
// 0=Empty 1=Wall 2=Start 3=End 4=Trivia 5=Ice 6=Sand 7=Trap 8=Checkpoint
const DEMO_COLS = 7;
const DEMO_ROWS = 7;
//        c0  c1  c2  c3  c4  c5  c6
const DEMO: number[][] = [
  [       2,  0,  0,  1,  5,  5,  0],  // r0: start, path, path, wall, ice, ice, empty
  [       1,  1,  0,  0,  0,  1,  0],  // r1: wall, wall, path, empty, empty, wall, empty
  [       4,  0,  0,  1,  0,  0,  7],  // r2: trivia, empty, path, wall, empty, empty, trap
  [       0,  1,  0,  0,  0,  1,  0],  // r3: empty, wall, path, path, empty, wall, empty
  [       6,  6,  1,  0,  0,  0,  0],  // r4: sand, sand, wall, path, empty, empty, empty
  [       0,  0,  0,  0,  1,  8,  0],  // r5: empty, empty, empty, path, wall, checkpoint, empty
  [       0,  1,  0,  0,  0,  0,  3],  // r6: empty, wall, empty, path→path→path→goal
];
// Path: [0,0]→[0,1]→[0,2]→[1,2]→[2,2]→[3,2]→[3,3]→[4,3]→[5,3]→[6,3]→[6,4]→[6,5]→[6,6]
const DEMO_PATH: [number, number][] = [
  [0,0],[0,1],[0,2],[1,2],[2,2],[3,2],[3,3],[4,3],[5,3],[6,3],[6,4],[6,5],[6,6],
];
const DEMO_START: [number, number] = [0, 0];
const DEMO_END: [number, number] = [6, 6];

// Renders a single cell exactly like Grid.tsx — with green fill for path cells
const DEMO_PATH_SET = new Set(DEMO_PATH.map(([r, c]) => `${r},${c}`));

function DemoCell({ type, cellSize, isStart, isEnd, r, c }: {
  type: number; cellSize: number; isStart: boolean; isEnd: boolean; r: number; c: number;
}) {
  const isWall = type === CellType.Wall;
  const isTrivia = type === CellType.TriviaWall;
  const isIce = type === CellType.Ice;
  const isSand = type === CellType.Sand;
  const isTrap = type === CellType.Trap;
  const isCheckpoint = type === CellType.Checkpoint;
  const isSolid = isWall || isTrivia;
  const inPath = DEMO_PATH_SET.has(`${r},${c}`);

  let bg = '#f0f1f3';
  if (isWall) bg = '#1a1a2e';
  if (isTrivia) bg = '#2a2a3e';
  if (isIce) bg = '#b3e5fc';
  if (isSand) bg = '#ffe0b2';
  if (isTrap) bg = '#ffcdd2';
  if (isCheckpoint) bg = '#e0e0e0';

  // Path fills cell green (matching Grid.tsx)
  if (inPath && !isWall && !isTrivia) {
    if (isEnd) bg = '#e53935';
    else bg = '#66bb6a';
  }

  return (
    <div style={{
      position: 'absolute',
      left: c * cellSize, top: r * cellSize,
      width: cellSize, height: cellSize,
      backgroundColor: bg,
      borderRadius: isSolid ? 4 : 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      boxSizing: 'border-box',
      border: isSolid ? 'none' : '1px solid rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      {isTrivia && (
        <span style={{
          color: '#fff', fontSize: Math.max(cellSize * 0.32, 11),
          fontWeight: 700, lineHeight: 1, opacity: 0.9, letterSpacing: -0.5,
        }}>W?</span>
      )}
      {isIce && (
        <svg width={cellSize * 0.5} height={cellSize * 0.5} viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4 }}>
          <path d="M8 2v12M2 8h12M4 4l8 8M12 4l-8 8" stroke="#0288d1" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {isSand && (
        <svg width={cellSize * 0.5} height={cellSize * 0.5} viewBox="0 0 16 16" fill="#e65100" style={{ opacity: 0.35 }}>
          <circle cx="4" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" />
        </svg>
      )}
      {isTrap && (
        <span style={{
          fontSize: Math.max(cellSize * 0.4, 12), fontWeight: 800,
          color: '#c62828', lineHeight: 1,
        }}>!</span>
      )}
      {isCheckpoint && (
        <div style={{
          width: cellSize * 0.6, height: cellSize * 0.6,
          borderRadius: '50%', backgroundColor: '#9e9e9e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontSize: Math.max(cellSize * 0.3, 10), fontWeight: 800, lineHeight: 1 }}>1</span>
        </div>
      )}
      {/* Start marker */}
      {isStart && inPath && (
        <div style={{
          position: 'absolute',
          width: cellSize * 0.45, height: cellSize * 0.45, borderRadius: '50%',
          backgroundColor: '#2e7d32', border: '2px solid #fff',
        }} />
      )}
      {/* End reached */}
      {isEnd && inPath && (
        <span style={{ color: '#fff', fontSize: Math.max(cellSize * 0.28, 8), fontWeight: 800, letterSpacing: 0.5 }}>
          GOAL
        </span>
      )}
      {/* End not reached */}
      {isEnd && !inPath && (
        <div style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#ff5252' }}>
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>GOAL</span>
        </div>
      )}
    </div>
  );
}

export default function LandingPage({ dark, onPlay }: Props) {
  const bg = dark ? '#121212' : '#fff';
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#999' : '#555';
  const muted = dark ? '#555' : '#bdbdbd';
  const cardBg = dark ? '#1e1e1e' : '#f8f9fa';
  const cardBorder = dark ? '#2a2a2a' : '#eee';

  const cellSize = 44;
  const gridW = DEMO_COLS * cellSize;
  const gridH = DEMO_ROWS * cellSize;

  return (
    <div style={{ background: bg, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px', paddingBottom: 48 }}>

      {/* Title */}
      <div style={{ textAlign: 'center', marginTop: '6dvh', marginBottom: 24 }}>
        <div style={{ fontSize: 40, fontWeight: 200, color: text, letterSpacing: 10, lineHeight: 1 }}>
          par puzzle
        </div>
        <div style={{ fontSize: 15, color: sub, marginTop: 12, lineHeight: 1.5 }}>
          Draw the shortest path through the maze.
          <br />
          Beat the par. Beat the clock.
        </div>
      </div>

      {/* Demo grid — matches Grid.tsx rendering exactly */}
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        width: gridW, height: gridH,
        backgroundColor: '#e2e5e9',
        position: 'relative',
        boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
        marginBottom: 28,
      }}>
        {DEMO.map((row, r) =>
          row.map((cell, c) => (
            <DemoCell
              key={`${r},${c}`}
              type={cell}
              cellSize={cellSize}
              isStart={r === DEMO_START[0] && c === DEMO_START[1]}
              isEnd={r === DEMO_END[0] && c === DEMO_END[1]}
              r={r} c={c}
            />
          ))
        )}
        {/* Start circle overlay */}
        <svg
          width={gridW} height={gridH}
          viewBox={`0 0 ${gridW} ${gridH}`}
          style={{ position: 'absolute', inset: 0 }}
          pointerEvents="none"
        >
          <circle cx={DEMO_START[1] * cellSize + cellSize / 2} cy={DEMO_START[0] * cellSize + cellSize / 2}
            r={cellSize * 0.22} fill="#2e7d32" stroke="#fff" strokeWidth={2} />
        </svg>
      </div>

      {/* CTA */}
      <button
        onClick={onPlay}
        style={{
          background: '#1a1a2e', color: '#fff', border: 'none',
          padding: '16px 48px', borderRadius: 100, fontSize: 16,
          fontWeight: 600, cursor: 'pointer', letterSpacing: 1,
          marginBottom: 8, WebkitTapHighlightColor: 'transparent',
        }}
      >
        Play Today's Puzzle
      </button>
      <div style={{ fontSize: 11, color: muted, marginBottom: 28, letterSpacing: 1 }}>
        New puzzle daily &middot; 75s on the clock
      </div>

      {/* Compact tile guide — 3x2 grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
        maxWidth: 360, width: '100%', marginBottom: 20,
      }}>
        {TILES.map(t => (
          <div key={t.label} style={{
            background: cardBg, border: `1px solid ${cardBorder}`,
            borderRadius: 10, padding: '10px 6px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 4,
              backgroundColor: t.bg,
              border: t.border ? `1px solid ${t.border}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {t.inner}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: text }}>{t.label}</div>
            <div style={{ fontSize: 8, color: muted, lineHeight: 1.2 }}>{t.short}</div>
          </div>
        ))}
      </div>

      {/* Compact scoring — single row */}
      <div style={{
        maxWidth: 360, width: '100%', marginBottom: 20,
        background: cardBg, border: `1px solid ${cardBorder}`,
        borderRadius: 10, padding: '10px 8px',
      }}>
        <div style={{ fontSize: 11, color: sub, textAlign: 'center', marginBottom: 8 }}>
          Fewer moves = better score, like golf
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {SCORES.map(s => (
            <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 7, color: muted, letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tile guide items — rendered with the actual colors/icons from Grid.tsx
const TILES: { label: string; bg: string; border?: string; inner: React.ReactNode; short: string }[] = [
  {
    label: 'Walls',
    bg: '#1a1a2e', short: 'Blocked',
    inner: null,
  },
  {
    label: 'Trivia',
    bg: '#2a2a3e', short: 'Answer to pass',
    inner: <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, opacity: 0.9 }}>W?</span>,
  },
  {
    label: 'Ice',
    bg: '#b3e5fc', border: 'rgba(0,0,0,0.06)', short: "Can't turn",
    inner: (
      <svg width={14} height={14} viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4 }}>
        <path d="M8 2v12M2 8h12M4 4l8 8M12 4l-8 8" stroke="#0288d1" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Sand',
    bg: '#ffe0b2', border: 'rgba(0,0,0,0.06)', short: '2x move cost',
    inner: (
      <svg width={14} height={14} viewBox="0 0 16 16" fill="#e65100" style={{ opacity: 0.35 }}>
        <circle cx="4" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" />
        <circle cx="8" cy="8" r="1.5" />
        <circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" />
      </svg>
    ),
  },
  {
    label: 'Traps',
    bg: '#ffcdd2', border: 'rgba(0,0,0,0.06)', short: 'Back to start +2',
    inner: <span style={{ fontSize: 14, fontWeight: 800, color: '#c62828', lineHeight: 1 }}>!</span>,
  },
  {
    label: 'Checkpts',
    bg: '#e0e0e0', border: 'rgba(0,0,0,0.06)', short: 'Visit all first',
    inner: (
      <div style={{
        width: 20, height: 20, borderRadius: '50%', backgroundColor: '#9e9e9e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, lineHeight: 1 }}>1</span>
      </div>
    ),
  },
];

const SCORES = [
  { val: '-2', label: 'EAGLE', color: '#2e7d32' },
  { val: '-1', label: 'BIRDIE', color: '#4caf50' },
  { val: '0', label: 'PAR', color: '#ff9800' },
  { val: '+1', label: 'BOGEY', color: '#f44336' },
  { val: '+2', label: 'DBL BOGEY', color: '#c62828' },
];
