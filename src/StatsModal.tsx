import { useEffect, useState } from 'react';
import { getStats } from './storage';
import { getScoreLabel } from './engine/game';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function StatsModal({ visible, onClose }: Props) {
  const [stats, setStats] = useState({ played: 0, avgScore: 0, bestScore: 0, streak: 0, parOrBetter: 0 });

  useEffect(() => {
    if (visible) setStats(getStats());
  }, [visible]);

  if (!visible) return null;

  const pct = stats.played > 0 ? Math.round((stats.parOrBetter / stats.played) * 100) : 0;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <div style={styles.title}>Statistics</div>
        <div style={styles.grid}>
          <Stat label="Played" value={`${stats.played}`} />
          <Stat label="Streak" value={`${stats.streak}`} />
          <Stat label="Par %" value={`${pct}%`} />
          <Stat label="Best" value={stats.played > 0 ? getScoreLabel(stats.bestScore) : '-'} />
        </div>
        <button style={styles.btn} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' as const, minWidth: 70 }}>
      <div style={{ fontSize: 28, fontWeight: 300, color: '#1a1a2e' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#9e9e9e', textTransform: 'uppercase' as const, letterSpacing: 1, marginTop: 4 }}>{label}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  card: {
    background: '#fff', borderRadius: 20, padding: 32,
    width: '80%', maxWidth: 320, textAlign: 'center',
  },
  title: {
    fontSize: 16, fontWeight: 600, color: '#9e9e9e',
    textTransform: 'uppercase', letterSpacing: 3, marginBottom: 24,
  },
  grid: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 },
  btn: {
    marginTop: 28, background: '#1a1a2e', color: '#fff', border: 'none',
    padding: '12px 48px', borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: 'pointer',
  },
};
