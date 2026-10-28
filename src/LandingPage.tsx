import { CellType } from './engine/types';

interface Props {
  dark: boolean;
  onPlay: () => void;
}

// Static mini puzzle for visual demo (8x8)
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

const CELL_COLORS: Record<number, { bg: string; dark: string }> = {
  [CellType.Empty]:      { bg: '#f0f0f0', dark: '#2a2a2a' },
  [CellType.Wall]:       { bg: '#1a1a2e', dark: '#0a0a1a' },
  [CellType.Start]:      { bg: '#4caf50', dark: '#4caf50' },
  [CellType.End]:        { bg: '#e53935', dark: '#e53935' },
  [CellType.TriviaWall]: { bg: '#7e57c2', dark: '#5e35b1' },
  [CellType.Ice]:        { bg: '#b3e5fc', dark: '#4fc3f7' },
  [CellType.Sand]:       { bg: '#ffe0b2', dark: '#ffb74d' },
  [CellType.Trap]:       { bg: '#ffcdd2', dark: '#ef9a9a' },
  [CellType.Checkpoint]: { bg: '#fff9c4', dark: '#fff176' },
};

export default function LandingPage({ dark, onPlay }: Props) {
  const bg = dark ? '#121212' : '#fff';
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#999' : '#555';
  const muted = dark ? '#555' : '#bdbdbd';
  const cardBg = dark ? '#1e1e1e' : '#f8f9fa';
  const cardBorder = dark ? '#2a2a2a' : '#eee';
  const pathSet = new Set(DEMO_PATH.map(([r,c]) => `${r},${c}`));

  const cellSize = 32;
  const gap = 2;
  const gridW = 8 * (cellSize + gap) - gap;
  const gridH = 8 * (cellSize + gap) - gap;

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

      {/* Demo grid */}
      <div style={{
        borderRadius: 14, overflow: 'hidden', padding: 12,
        background: dark ? '#1a1a1a' : '#fff',
        boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
        marginBottom: 28,
      }}>
        <svg width={gridW} height={gridH}>
          {DEMO.map((row, r) =>
            row.map((cell, c) => {
              const onPath = pathSet.has(`${r},${c}`);
              const colors = CELL_COLORS[cell] || CELL_COLORS[CellType.Empty];
              let fill = dark ? colors.dark : colors.bg;
              if (onPath && cell === CellType.Empty) fill = '#66bb6a';
              if (onPath && cell === CellType.Ice) fill = '#4fc3f7';
              if (onPath && cell === CellType.Sand) fill = '#ffa726';
              return (
                <g key={`${r},${c}`}>
                  <rect
                    x={c * (cellSize + gap)} y={r * (cellSize + gap)}
                    width={cellSize} height={cellSize} rx={4}
                    fill={fill}
                  />
                  {cell === CellType.TriviaWall && (
                    <text
                      x={c * (cellSize + gap) + cellSize / 2}
                      y={r * (cellSize + gap) + cellSize / 2 + 5}
                      textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff"
                    >?</text>
                  )}
                  {cell === CellType.Trap && (
                    <text
                      x={c * (cellSize + gap) + cellSize / 2}
                      y={r * (cellSize + gap) + cellSize / 2 + 5}
                      textAnchor="middle" fontSize="16" fontWeight="700" fill="#c62828"
                    >!</text>
                  )}
                  {cell === CellType.Checkpoint && (
                    <circle
                      cx={c * (cellSize + gap) + cellSize / 2}
                      cy={r * (cellSize + gap) + cellSize / 2}
                      r={6} fill="none" stroke="#f9a825" strokeWidth="2"
                    />
                  )}
                  {cell === CellType.Ice && (
                    <text
                      x={c * (cellSize + gap) + cellSize / 2}
                      y={r * (cellSize + gap) + cellSize / 2 + 4}
                      textAnchor="middle" fontSize="12" fill={dark ? '#1a1a2e' : '#0288d1'}
                    >{'\u2744'}</text>
                  )}
                </g>
              );
            })
          )}
          {/* Path line */}
          <polyline
            points={DEMO_PATH.map(([r, c]) =>
              `${c * (cellSize + gap) + cellSize / 2},${r * (cellSize + gap) + cellSize / 2}`
            ).join(' ')}
            fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"
            strokeLinejoin="round" opacity="0.6"
          />
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

      {/* Tile guide */}
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
                width: 36, height: 36, borderRadius: 8,
                background: dark ? t.darkColor : t.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: t.iconColor || '#fff',
                flexShrink: 0,
              }}>
                {t.icon}
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

const TILES = [
  { label: 'Walls', icon: '', color: '#1a1a2e', darkColor: '#0a0a1a', iconColor: '#1a1a2e', desc: 'Blocked — find your way around them' },
  { label: 'Trivia Walls', icon: '?', color: '#7e57c2', darkColor: '#5e35b1', iconColor: '#fff', desc: 'Answer a trivia question to pass. Wrong = +1 penalty stroke' },
  { label: 'Ice', icon: '\u2744', color: '#b3e5fc', darkColor: '#4fc3f7', iconColor: '#0288d1', desc: "Can't change direction once you step on — you slide straight" },
  { label: 'Sand', icon: '\u2591', color: '#ffe0b2', darkColor: '#ffb74d', iconColor: '#e65100', desc: 'Costs 2 moves per tile instead of 1' },
  { label: 'Traps', icon: '!', color: '#ffcdd2', darkColor: '#ef9a9a', iconColor: '#c62828', desc: 'Sends you back to start with a +2 penalty. Disarmed after triggering' },
  { label: 'Checkpoints', icon: '\u25CB', color: '#fff9c4', darkColor: '#fff176', iconColor: '#f9a825', desc: 'Must visit all checkpoints before reaching the goal' },
];

const SCORES = [
  { val: '-2', label: 'EAGLE', color: '#2e7d32' },
  { val: '-1', label: 'BIRDIE', color: '#4caf50' },
  { val: '0', label: 'PAR', color: '#ff9800' },
  { val: '+1', label: 'BOGEY', color: '#f44336' },
  { val: '+2', label: 'DBL BOGEY', color: '#c62828' },
];
