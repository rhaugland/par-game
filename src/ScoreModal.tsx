import { useState, useRef, useCallback, useEffect } from 'react';
import { GameState, Puzzle, CellType } from './engine/types';
import { getScoreLabel, getMoves } from './engine/game';
import { dayNumber, todaySeed } from './engine/seed';
import { getLocalStats, getTodayRecord } from './storage';

function MiniGrid({ puzzle, path }: { puzzle: Puzzle; path: [number, number][] }) {
  const size = Math.min(Math.floor(280 / puzzle.cols), Math.floor(200 / puzzle.rows), 20);
  const gap = 1;
  const w = puzzle.cols * (size + gap) - gap;
  const h = puzzle.rows * (size + gap) - gap;
  const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 12px' }}>
      <svg width={w} height={h} style={{ borderRadius: 4 }}>
        {/* Background */}
        <rect width={w} height={h} fill="#e2e5e9" rx={4} />
        {Array.from({ length: puzzle.rows }, (_, r) =>
          Array.from({ length: puzzle.cols }, (_, c) => {
            const cell = puzzle.grid[r][c];
            const t = cell.type;
            const isStart = r === puzzle.start[0] && c === puzzle.start[1];
            const isEnd = r === puzzle.end[0] && c === puzzle.end[1];
            const onPath = pathSet.has(`${r},${c}`);
            const x = c * (size + gap);
            const y = r * (size + gap);
            const cx = x + size / 2;
            const cy = y + size / 2;

            // Cell background — match Grid.tsx colors exactly
            let fill = '#f0f1f3';
            let rounded = false;
            if (t === CellType.Wall) { fill = '#1a1a2e'; rounded = true; }
            if (t === CellType.TriviaWall) { fill = '#2a2a3e'; rounded = true; }
            if (t === CellType.Ice) fill = '#b3e5fc';
            if (t === CellType.Sand) fill = '#ffe0b2';
            if (t === CellType.Trap) fill = '#ffcdd2';
            if (t === CellType.Checkpoint) fill = '#e0e0e0';
            // Path fills green on empty cells
            if (onPath && t === CellType.Empty) fill = '#66bb6a';
            if (isStart) fill = '#4caf50';
            if (isEnd) fill = '#e53935';

            const iconScale = size / 28; // scale icons relative to cell size

            return (
              <g key={`${r},${c}`}>
                <rect x={x} y={y} width={size} height={size}
                  rx={rounded ? 2 : 0} fill={fill}
                  stroke={rounded ? 'none' : 'rgba(0,0,0,0.06)'} strokeWidth={0.5} />

                {/* Ice snowflake */}
                {t === CellType.Ice && !isStart && !isEnd && (
                  <g transform={`translate(${cx},${cy}) scale(${iconScale})`} opacity={0.4}>
                    <line x1="0" y1="-6" x2="0" y2="6" stroke="#0288d1" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="-6" y1="0" x2="6" y2="0" stroke="#0288d1" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="-4" y1="-4" x2="4" y2="4" stroke="#0288d1" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="4" y1="-4" x2="-4" y2="4" stroke="#0288d1" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                )}

                {/* Sand dots */}
                {t === CellType.Sand && !isStart && !isEnd && (
                  <g transform={`translate(${cx},${cy}) scale(${iconScale})`} opacity={0.35}>
                    <circle cx="-3" cy="-3" r="1" fill="#e65100" />
                    <circle cx="3" cy="-3" r="1" fill="#e65100" />
                    <circle cx="0" cy="0" r="1" fill="#e65100" />
                    <circle cx="-3" cy="3" r="1" fill="#e65100" />
                    <circle cx="3" cy="3" r="1" fill="#e65100" />
                  </g>
                )}

                {/* Trap ! */}
                {t === CellType.Trap && !isStart && !isEnd && (
                  <text x={cx} y={cy + size * 0.15} textAnchor="middle"
                    fontSize={size * 0.5} fontWeight={800} fill="#c62828">!</text>
                )}

                {/* Trivia W? */}
                {t === CellType.TriviaWall && (
                  <text x={cx} y={cy + size * 0.15} textAnchor="middle"
                    fontSize={size * 0.32} fontWeight={700} fill="#fff" opacity={0.9}>?</text>
                )}

                {/* Checkpoint circle */}
                {t === CellType.Checkpoint && cell.checkpointIndex !== undefined && (
                  <>
                    <circle cx={cx} cy={cy} r={size * 0.3} fill="#9e9e9e" />
                    <text x={cx} y={cy + size * 0.12} textAnchor="middle"
                      fontSize={size * 0.28} fontWeight={800} fill="#fff">
                      {cell.checkpointIndex + 1}
                    </text>
                  </>
                )}

                {/* Start marker */}
                {isStart && onPath && (
                  <circle cx={cx} cy={cy} r={size * 0.25} fill="#2e7d32" stroke="#fff" strokeWidth={1} />
                )}

                {/* End marker */}
                {isEnd && (
                  <text x={cx} y={cy + size * 0.12} textAnchor="middle"
                    fontSize={size * 0.3} fontWeight={800} fill="#fff" letterSpacing={0.5}>
                    END
                  </text>
                )}
              </g>
            );
          })
        )}
        {/* Path line */}
        {path.length > 1 && (
          <polyline
            points={path.map(([r, c]) =>
              `${c * (size + gap) + size / 2},${r * (size + gap) + size / 2}`
            ).join(' ')}
            fill="none" stroke="rgba(255,255,255,0.35)"
            strokeWidth={size * 0.15} strokeLinecap="round" strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}

interface Props {
  visible: boolean;
  gameState: GameState;
  puzzle: Puzzle;
  onClose: () => void;
  isSignedIn: boolean;
}

export default function ScoreModal({ visible, gameState, puzzle, onClose, isSignedIn: _isSignedIn }: Props) {
  const [shared, setShared] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ played: 0, avgScore: 0, bestScore: 0, streak: 0, parOrBetter: 0, birdies: 0, bogeys: 0, pars: 0, lifetimeScore: 0 });

  useEffect(() => {
    if (visible) {
      setStats(getLocalStats());
      setShared(false);
    }
  }, [visible]);

  const shareAsImage = useCallback(async () => {
    const el = cardRef.current;
    if (!el) return;

    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(el, {
      backgroundColor: '#fff',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `par-${dayNumber()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Par #${dayNumber()}` });
          setShared(true);
          return;
        } catch { /* user cancelled */ }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `par-${dayNumber()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setShared(true);
    }, 'image/png');
  }, []);

  if (!visible) return null;

  const record = getTodayRecord(todaySeed());
  const score = gameState.score ?? record?.score ?? 0;
  const label = getScoreLabel(score);
  const moves = record?.moves ?? getMoves(gameState, puzzle);
  const good = score <= 0;
  const scoreColor = good ? '#4caf50' : '#ff9800';

  return (
    <div style={st.overlay} onClick={onClose}>
      <div style={st.modal} onClick={e => e.stopPropagation()}>
        <button style={st.x} onClick={(e) => { e.stopPropagation(); onClose(); }}>&times;</button>

        {/* Shareable card area */}
        <div ref={cardRef} style={st.card}>
          <div style={st.cardTop}>
            <span style={st.cardLogo}>par puzzle</span>
            <span style={st.cardDay}>#{dayNumber()}</span>
          </div>

          <div style={{ ...st.scoreLabel, color: scoreColor }}>{label}</div>
          <div style={{ ...st.scoreBig, color: scoreColor }}>
            {score <= 0 ? score : `+${score}`}
          </div>
          <div style={st.movesDetail}>{moves} moves &middot; par {puzzle.par}</div>

          <MiniGrid puzzle={puzzle} path={gameState.path} />

          <div style={st.statsRow}>
            <div style={st.statBox}>
              <div style={st.statNum}>{stats.played}</div>
              <div style={st.statLabel}>Played</div>
            </div>
            <div style={st.statDivider} />
            <div style={st.statBox}>
              <div style={{ ...st.statNum, color: '#4caf50' }}>{stats.pars}</div>
              <div style={st.statLabel}>Pars</div>
            </div>
            <div style={st.statDivider} />
            <div style={st.statBox}>
              <div style={{ ...st.statNum, color: '#2e7d32' }}>{stats.birdies}</div>
              <div style={st.statLabel}>Birdies</div>
            </div>
            <div style={st.statDivider} />
            <div style={st.statBox}>
              <div style={{ ...st.statNum, color: '#ff9800' }}>{stats.bogeys}</div>
              <div style={st.statLabel}>Bogeys</div>
            </div>
          </div>

          <div style={st.streakRow}>
            <span style={{ ...st.lifetimeNum, color: stats.lifetimeScore <= 0 ? '#4caf50' : '#ff9800' }}>
              {stats.lifetimeScore <= 0 ? stats.lifetimeScore : `+${stats.lifetimeScore}`}
            </span>
            <span style={st.streakText}>lifetime score</span>
          </div>

          <div style={st.watermark}>par-web.vercel.app</div>
        </div>

        {/* Buttons */}
        <div style={st.btns}>
          <button style={st.shareBtn} onClick={shareAsImage}>
            {shared ? 'Saved!' : 'Share Result'}
          </button>
        </div>
        <div style={st.sub}>Come back tomorrow for a new hole</div>
      </div>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
    padding: '16px 0',
  },
  modal: {
    background: '#fff', borderRadius: 24, padding: '16px 16px 24px',
    width: '90%', maxWidth: 360, textAlign: 'center', position: 'relative',
    maxHeight: '90dvh', overflowY: 'auto',
  },
  x: {
    position: 'absolute', top: 8, right: 8,
    background: 'none', border: 'none', fontSize: 28, color: '#bdbdbd',
    cursor: 'pointer', zIndex: 10, width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '16px 16px 12px',
    border: '1.5px solid #f0f0f0',
  },
  cardTop: {
    display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8,
    marginBottom: 8,
  },
  cardLogo: {
    fontSize: 18, fontWeight: 200, color: '#1a1a2e', letterSpacing: 5,
  },
  cardDay: {
    fontSize: 12, color: '#bdbdbd', letterSpacing: 1,
  },
  scoreLabel: {
    fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: 3, marginBottom: 2,
  },
  scoreBig: {
    fontSize: 48, fontWeight: 200, lineHeight: 1, marginBottom: 2,
  },
  movesDetail: {
    fontSize: 12, color: '#9e9e9e', marginBottom: 8,
  },
  statsRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: 0, padding: '10px 0', borderTop: '1px solid #f5f5f5',
    borderBottom: '1px solid #f5f5f5',
  },
  statBox: { textAlign: 'center', flex: 1 },
  statNum: { fontSize: 18, fontWeight: 600, color: '#1a1a2e' },
  statLabel: { fontSize: 8, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 },
  statDivider: { width: 1, height: 22, background: '#f0f0f0' },
  streakRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: 6, marginTop: 8,
  },
  lifetimeNum: { fontSize: 16, fontWeight: 600 },
  streakText: { fontSize: 11, color: '#9e9e9e', fontWeight: 500 },
  watermark: {
    fontSize: 9, color: '#ddd', marginTop: 8, letterSpacing: 1,
  },
  btns: { marginTop: 14, display: 'flex', justifyContent: 'center' },
  shareBtn: {
    background: '#1a1a2e', color: '#fff', border: 'none',
    padding: '12px 32px', borderRadius: 100, fontSize: 14,
    fontWeight: 500, cursor: 'pointer', letterSpacing: 0.5,
  },
  sub: { marginTop: 12, fontSize: 11, color: '#bdbdbd', fontStyle: 'italic' },
};
