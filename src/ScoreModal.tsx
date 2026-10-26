import { useState } from 'react';
import { GameState, Puzzle } from './engine/types';
import { getScoreLabel, getMoves, generateShareCard } from './engine/game';
import { dayNumber } from './engine/seed';

interface Props {
  visible: boolean;
  gameState: GameState;
  puzzle: Puzzle;
  onReset: () => void;
  onClose: () => void;
}

export default function ScoreModal({ visible, gameState, puzzle, onReset, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const score = gameState.score ?? 0;
  const label = getScoreLabel(score);
  const moves = getMoves(gameState);
  const good = score <= 0;

  const share = async () => {
    const card = generateShareCard(gameState, puzzle, dayNumber());
    try {
      await navigator.clipboard.writeText(card);
      setCopied(true);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = card;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <button style={styles.x} onClick={onClose}>&times;</button>
        <div style={styles.day}>#{dayNumber()}</div>
        <div style={{ ...styles.scoreNum, color: good ? '#4caf50' : '#ff9800' }}>
          {score <= 0 ? score : `+${score}`}
        </div>
        <div style={styles.label}>{label}</div>
        <div style={styles.detail}>{moves} moves / par {puzzle.par}</div>
        <div style={styles.btns}>
          <button style={styles.primary} onClick={share}>
            {copied ? 'Copied!' : 'Share Result'}
          </button>
          <button style={styles.secondary} onClick={onReset}>Try Again</button>
        </div>
        <div style={styles.sub}>Come back tomorrow for a new hole</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  card: {
    background: '#fff', borderRadius: 24, padding: 36,
    width: '85%', maxWidth: 340, textAlign: 'center', position: 'relative',
  },
  x: {
    position: 'absolute', top: 14, right: 18,
    background: 'none', border: 'none', fontSize: 22, color: '#bdbdbd', cursor: 'pointer',
  },
  day: { fontSize: 13, color: '#bdbdbd', letterSpacing: 2 },
  scoreNum: { fontSize: 72, fontWeight: 200, margin: '4px 0' },
  label: {
    fontSize: 16, fontWeight: 500, color: '#1a1a2e',
    textTransform: 'uppercase', letterSpacing: 3,
  },
  detail: { fontSize: 14, color: '#9e9e9e', marginTop: 8 },
  btns: { display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 },
  primary: {
    background: '#1a1a2e', color: '#fff', border: 'none',
    padding: '14px 24px', borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: 'pointer',
  },
  secondary: {
    background: 'transparent', color: '#616161',
    border: '1.5px solid #e0e0e0',
    padding: '14px 24px', borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: 'pointer',
  },
  sub: { marginTop: 20, fontSize: 12, color: '#bdbdbd', fontStyle: 'italic' },
};
