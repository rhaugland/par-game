import { useState, useRef, useCallback, useEffect } from 'react';
import { GameState, Puzzle } from './engine/types';
import { getScoreLabel, getMoves } from './engine/game';
import { dayNumber, todaySeed } from './engine/seed';
import { getStats, getTodayRecord } from './storage';

interface Props {
  visible: boolean;
  gameState: GameState;
  puzzle: Puzzle;
  onClose: () => void;
}

export default function ScoreModal({ visible, gameState, puzzle, onClose }: Props) {
  const [shared, setShared] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ played: 0, avgScore: 0, bestScore: 0, streak: 0, parOrBetter: 0, birdies: 0, bogeys: 0, pars: 0 });

  useEffect(() => {
    if (visible) {
      setStats(getStats());
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
  const moves = record?.moves ?? getMoves(gameState);
  const good = score <= 0;
  const scoreColor = good ? '#4caf50' : '#ff9800';

  return (
    <div style={st.overlay} onClick={onClose}>
      <div style={st.modal} onClick={e => e.stopPropagation()}>
        <button style={st.x} onClick={(e) => { e.stopPropagation(); onClose(); }}>&times;</button>

        {/* Shareable card area */}
        <div ref={cardRef} style={st.card}>
          <div style={st.cardHeader}>
            <span style={st.cardLogo}>par</span>
            <span style={st.cardDay}>#{dayNumber()}</span>
          </div>

          <div style={{ ...st.scoreLabel, color: scoreColor }}>{label}</div>
          <div style={{ ...st.scoreBig, color: scoreColor }}>
            {score <= 0 ? score : `+${score}`}
          </div>
          <div style={st.movesDetail}>{moves} moves &middot; par {puzzle.par}</div>

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
            <span style={st.streakFire}>{stats.streak > 0 ? '🔥' : ''}</span>
            <span style={st.streakText}>{stats.streak} day streak</span>
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
  cardHeader: {
    display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8,
    marginBottom: 16,
  },
  cardLogo: {
    fontSize: 22, fontWeight: 200, color: '#1a1a2e', letterSpacing: 6,
  },
  cardDay: {
    fontSize: 12, color: '#bdbdbd', letterSpacing: 1,
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
  streakFire: { fontSize: 16 },
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
