import { CellType } from './engine/types';

interface Props {
  dark: boolean;
  onPlay: () => void;
}

// Static mini puzzle for visual demo (8x8)
// 0=Empty, 1=Wall, 2=Start, 3=End, 4=TriviaWall, 5=Ice, 6=Sand, 7=Trap, 8=Checkpoint
const DEMO: number[][] = [
  [1,1,1,1,1,1,1,1],
  [1,2,0,5,0,1,0,1],
  [1,0,1,1,0,4,0,1],
  [1,0,0,7,0,1,6,1],
  [1,1,0,1,0,0,0,1],
  [1,0,0,0,8,1,0,1],
  [1,0,1,0,0,0,3,1],
  [1,1,1,1,1,1,1,1],
];

const DEMO_PATH: [number, number][] = [
  [1,1],[1,2],[1,3],[1,4],[2,4],[3,4],[4,4],[4,5],[4,6],[5,6],[6,6],
];

// Renders a single cell exactly like Grid.tsx
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

  let bg = '#f0f1f3';
  if (isWall) bg = '#1a1a2e';
  if (isTrivia) bg = '#2a2a3e';
  if (isIce) bg = '#b3e5fc';
  if (isSand) bg = '#ffe0b2';
  if (isTrap) bg = '#ffcdd2';
  if (isCheckpoint) bg = '#e0e0e0';

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
      {isStart && (
        <div style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: '#4caf50',
          boxShadow: '0 0 10px rgba(76,175,80,0.4)',
        }} />
      )}
      {isEnd && (
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

  const cellSize = 36;
  const gridW = 8 * cellSize;
  const gridH = 8 * cellSize;
  const strokeWidth = cellSize * 0.55;
  const pathPoints = DEMO_PATH.map(([r, c]) => ({
    x: c * cellSize + cellSize / 2,
    y: r * cellSize + cellSize / 2,
  }));

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
              isStart={r === 1 && c === 1}
              isEnd={r === 6 && c === 6}
              r={r} c={c}
            />
          ))
        )}
        {/* Path SVG — same gradient/style as Grid.tsx */}
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
          <polyline points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="rgba(0,0,0,0.08)"
            strokeWidth={strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="url(#pg)"
            strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
            filter="url(#pt)" />
          <polyline points={pathPoints.map(p => `${p.x - 0.001},${p.y - strokeWidth * 0.15}`).join(' ')}
            fill="none" stroke="rgba(255,255,255,0.25)"
            strokeWidth={strokeWidth * 0.3} strokeLinecap="round" strokeLinejoin="round" />
          {/* Start marker */}
          <circle cx={1 * cellSize + cellSize / 2} cy={1 * cellSize + cellSize / 2}
            r={strokeWidth * 0.35} fill="#2e7d32" stroke="#fff" strokeWidth={2} />
          {/* Head marker */}
          <circle cx={6 * cellSize + cellSize / 2} cy={6 * cellSize + cellSize / 2}
            r={strokeWidth * 0.42} fill="#2e7d32" opacity={0.3} />
          <circle cx={6 * cellSize + cellSize / 2} cy={6 * cellSize + cellSize / 2}
            r={strokeWidth * 0.32} fill="#fff" opacity={0.9} />
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
      <div style={{ fontSize: 11, color: muted, marginBottom: 36, letterSpacing: 1 }}>
        A new puzzle every day at midnight
      </div>

      {/* Tile guide — uses actual tile colors and icons from Grid.tsx */}
      <div style={{ maxWidth: 360, width: '100%', marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: muted, textAlign: 'center', marginBottom: 14 }}>
          Tiles
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TILES.map(t => (
            <div key={t.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 12,
              background: cardBg, border: `1px solid ${cardBorder}`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 4,
                backgroundColor: t.bg,
                border: t.border ? `1px solid ${t.border}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
              }}>
                {t.inner}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{t.label}</div>
                <div style={{ fontSize: 11, color: sub, marginTop: 1 }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring */}
      <div style={{ maxWidth: 360, width: '100%', marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: muted, textAlign: 'center', marginBottom: 14 }}>
          Scoring
        </div>
        <div style={{
          background: cardBg, border: `1px solid ${cardBorder}`,
          borderRadius: 14, padding: '16px 12px',
        }}>
          <div style={{ fontSize: 12, color: sub, textAlign: 'center', marginBottom: 14, lineHeight: 1.5 }}>
            Your score = your moves minus the par.
            <br />
            Lower is better, just like golf.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {SCORES.map(s => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '8px 10px', borderRadius: 10,
                background: dark ? '#252525' : '#fff', minWidth: 56,
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 8, color: muted, letterSpacing: 1.5, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: sub, textAlign: 'center', marginTop: 12 }}>
            Score par or better to earn tokens for the shop
          </div>
        </div>
      </div>

      {/* Timer note */}
      <div style={{
        maxWidth: 360, width: '100%',
        background: cardBg, border: `1px solid ${cardBorder}`,
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32,
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={dark ? '#aaa' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: text }}>You're on the clock</div>
          <div style={{ fontSize: 11, color: sub, marginTop: 1 }}>
            75 seconds to finish. Go over and you'll take penalty strokes. First game gets 2 minutes.
          </div>
        </div>
      </div>
    </div>
  );
}

// Tile guide items — rendered with the actual colors/icons from Grid.tsx
const TILES: { label: string; bg: string; border?: string; inner: React.ReactNode; desc: string }[] = [
  {
    label: 'Walls',
    bg: '#1a1a2e', desc: 'Blocked — find your way around them',
    inner: null,
  },
  {
    label: 'Trivia Walls',
    bg: '#2a2a3e', desc: 'Answer a trivia question to pass. Wrong = +1 penalty stroke',
    inner: <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, opacity: 0.9 }}>W?</span>,
  },
  {
    label: 'Ice',
    bg: '#b3e5fc', border: 'rgba(0,0,0,0.06)', desc: "Can't change direction — you slide straight through",
    inner: (
      <svg width={18} height={18} viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4 }}>
        <path d="M8 2v12M2 8h12M4 4l8 8M12 4l-8 8" stroke="#0288d1" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Sand',
    bg: '#ffe0b2', border: 'rgba(0,0,0,0.06)', desc: 'Costs 2 moves per tile instead of 1',
    inner: (
      <svg width={18} height={18} viewBox="0 0 16 16" fill="#e65100" style={{ opacity: 0.35 }}>
        <circle cx="4" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" />
        <circle cx="8" cy="8" r="1.5" />
        <circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" />
      </svg>
    ),
  },
  {
    label: 'Traps',
    bg: '#ffcdd2', border: 'rgba(0,0,0,0.06)', desc: 'Sends you back to start with a +2 penalty. Disarmed after triggering',
    inner: <span style={{ fontSize: 16, fontWeight: 800, color: '#c62828', lineHeight: 1 }}>!</span>,
  },
  {
    label: 'Checkpoints',
    bg: '#e0e0e0', border: 'rgba(0,0,0,0.06)', desc: 'Must visit all checkpoints before reaching the goal',
    inner: (
      <div style={{
        width: 24, height: 24, borderRadius: '50%', backgroundColor: '#9e9e9e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 800, lineHeight: 1 }}>1</span>
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
