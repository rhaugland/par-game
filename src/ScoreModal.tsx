import { useState, useRef, useCallback, useEffect } from 'react';
import { GameState, Puzzle, CellType } from './engine/types';
import { getScoreLabel, getMoves } from './engine/game';
import { dayNumber, todaySeed } from './engine/seed';
import { getLocalStats, getTodayRecord } from './storage';

function MiniGrid({ puzzle, path }: { puzzle: Puzzle; path: [number, number][] }) {
  const size = Math.min(Math.floor(260 / puzzle.cols), Math.floor(180 / puzzle.rows), 18);
  const gap = 1;
  const w = puzzle.cols * (size + gap) - gap;
  const h = puzzle.rows * (size + gap) - gap;
  const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));

  const cellColor = (r: number, c: number) => {
    const t = puzzle.grid[r][c].type;
    const isStart = r === puzzle.start[0] && c === puzzle.start[1];
    const isEnd = r === puzzle.end[0] && c === puzzle.end[1];
    const onPath = pathSet.has(`${r},${c}`);

    if (isStart) return '#4caf50';
    if (isEnd) return '#e53935';
    if (t === CellType.Wall) return '#2a2a3e';
    if (t === CellType.TriviaWall) return '#3a3a4e';
    if (t === CellType.Ice) return onPath ? '#64b5f6' : '#90caf9';
    if (t === CellType.Sand) return onPath ? '#ffa726' : '#ffcc80';
    if (onPath) return '#66bb6a';
    return '#e8e8e8';
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 16px' }}>
      <svg width={w} height={h}>
        {Array.from({ length: puzzle.rows }, (_, r) =>
          Array.from({ length: puzzle.cols }, (_, c) => (
            <rect
              key={`${r},${c}`}
              x={c * (size + gap)}
              y={r * (size + gap)}
              width={size}
              height={size}
              rx={2}
              fill={cellColor(r, c)}
            />
          ))
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

    // Dynamic import html2canvas
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

      // Try native share (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Par #${dayNumber()}` });
          setShared(true);
          return;
        } catch { /* user cancelled */ }
      }

      // Fallback: download
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
            <span style={st.cardLogo}>par</span>
            <span style={st.cardTagline}>daily maze challenge</span>
          </div>

          <div style={st.cardDay}>#{dayNumber()}</div>

          <div style={{ ...st.scoreLabel, color: scoreColor }}>{label}</div>
          <div style={{ ...st.scoreBig, color: scoreColor }}>
            {score <= 0 ? score : `+${score}`}
          </div>
          <div style={st.movesDetail}>{moves} moves &middot; par {puzzle.par}</div>

          {/* Mini grid visualization */}
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
  },
  modal: {
    background: '#fff', borderRadius: 24, padding: '16px 16px 28px',
    width: '90%', maxWidth: 360, textAlign: 'center', position: 'relative',
  },
  x: {
    position: 'absolute', top: 8, right: 8,
    background: 'none', border: 'none', fontSize: 28, color: '#bdbdbd',
    cursor: 'pointer', zIndex: 10, width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '24px 20px 16px',
    border: '1.5px solid #f0f0f0',
  },
  cardTop: {
    display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8,
    marginBottom: 4,
  },
  cardLogo: {
    fontSize: 24, fontWeight: 200, color: '#1a1a2e', letterSpacing: 8,
  },
  cardTagline: {
    fontSize: 9, color: '#bdbdbd', letterSpacing: 2, textTransform: 'uppercase' as const,
  },
  cardDay: {
    fontSize: 13, color: '#9e9e9e', letterSpacing: 1, textAlign: 'center' as const,
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: 4, marginBottom: 4,
  },
  scoreBig: {
    fontSize: 64, fontWeight: 200, lineHeight: 1, marginBottom: 4,
  },
  movesDetail: {
    fontSize: 14, color: '#9e9e9e', marginBottom: 20,
  },
  statsRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: 0, padding: '16px 0', borderTop: '1px solid #f5f5f5',
    borderBottom: '1px solid #f5f5f5',
  },
  statBox: { textAlign: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: 600, color: '#1a1a2e' },
  statLabel: { fontSize: 9, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 },
  statDivider: { width: 1, height: 28, background: '#f0f0f0' },
  streakRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: 6, marginTop: 12,
  },
  lifetimeNum: { fontSize: 18, fontWeight: 600 },
  streakText: { fontSize: 13, color: '#9e9e9e', fontWeight: 500 },
  watermark: {
    fontSize: 10, color: '#ddd', marginTop: 12, letterSpacing: 1,
  },
  btns: { marginTop: 20, display: 'flex', justifyContent: 'center' },
  shareBtn: {
    background: '#1a1a2e', color: '#fff', border: 'none',
    padding: '14px 36px', borderRadius: 100, fontSize: 15,
    fontWeight: 500, cursor: 'pointer', letterSpacing: 0.5,
  },
  sub: { marginTop: 16, fontSize: 12, color: '#bdbdbd', fontStyle: 'italic' },
};
