import { useEffect, useState } from 'react';
import { getRoundHistory } from './storage';
import { DailyRound, HOLES_PER_ROUND, totalScore, isRoundComplete } from './engine/round';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentRound: DailyRound | null;
  dark: boolean;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function StatsModal({ visible, onClose, currentRound, dark }: Props) {
  const [rounds, setRounds] = useState<DailyRound[]>([]);

  useEffect(() => {
    if (visible) {
      const history = getRoundHistory();
      const all = currentRound
        ? [currentRound, ...history.filter(r => r.date !== currentRound.date)]
        : history;
      setRounds(all);
    }
  }, [visible, currentRound]);

  if (!visible) return null;

  const bg = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#666' : '#9e9e9e';
  const border = dark ? '#2a2a2a' : '#f0f0f0';
  const cardBg = dark ? '#1e1e1e' : '#f8f8fa';

  // Aggregate stats across all rounds
  const completedRounds = rounds.filter(r => isRoundComplete(r));
  const allHoles = rounds.flatMap(r => r.holes);
  const totalHolesPlayed = allHoles.length;
  const eagles = allHoles.filter(h => h.score <= -2).length;
  const birdies = allHoles.filter(h => h.score === -1).length;
  const pars = allHoles.filter(h => h.score === 0).length;
  const bogeys = allHoles.filter(h => h.score === 1).length;
  const doubles = allHoles.filter(h => h.score >= 2).length;
  const lifetimeScore = allHoles.reduce((s, h) => s + h.score, 0);
  const roundScores = completedRounds.map(r => totalScore(r));
  const bestRound = roundScores.length > 0 ? Math.min(...roundScores) : 0;
  const avgRound = roundScores.length > 0
    ? Math.round((roundScores.reduce((a, b) => a + b, 0) / roundScores.length) * 10) / 10
    : 0;

  // Streak
  let streak = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const roundDates = new Set(rounds.map(r => r.date));
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (roundDates.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: bg, borderRadius: 24, padding: '28px 20px',
        width: '92%', maxWidth: 380, textAlign: 'center', position: 'relative',
        maxHeight: '85dvh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <button style={{
          position: 'absolute', top: 8, right: 8,
          background: 'none', border: 'none', fontSize: 28,
          color: dark ? '#666' : '#bdbdbd',
          cursor: 'pointer', zIndex: 10, width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>&times;</button>

        <div style={{ fontSize: 18, fontWeight: 200, color: text, letterSpacing: 6, marginBottom: 4 }}>Stats</div>
        <div style={{ fontSize: 11, color: sub, marginBottom: 20 }}>
          {completedRounds.length} round{completedRounds.length !== 1 ? 's' : ''} completed
        </div>

        {/* Top stats row */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '14px 0', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
          marginBottom: 16,
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: lifetimeScore <= 0 ? '#4caf50' : '#ff9800' }}>
              {lifetimeScore <= 0 ? lifetimeScore : `+${lifetimeScore}`}
            </div>
            <div style={{ fontSize: 8, color: sub, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>Lifetime</div>
          </div>
          <div style={{ width: 1, height: 28, background: border }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: bestRound <= 0 ? '#4caf50' : '#ff9800' }}>
              {bestRound <= 0 ? bestRound : `+${bestRound}`}
            </div>
            <div style={{ fontSize: 8, color: sub, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>Best Round</div>
          </div>
          <div style={{ width: 1, height: 28, background: border }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: text }}>{streak}</div>
            <div style={{ fontSize: 8, color: sub, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>Streak</div>
          </div>
        </div>

        {/* Hole breakdown */}
        <div style={{
          background: cardBg, borderRadius: 14, padding: '14px 16px',
          border: `1px solid ${border}`, marginBottom: 12,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
            {totalHolesPlayed} Holes Played
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[
              { label: 'Eagle+', count: eagles, color: '#1b5e20' },
              { label: 'Birdie', count: birdies, color: '#4caf50' },
              { label: 'Par', count: pars, color: '#ff9800' },
              { label: 'Bogey', count: bogeys, color: '#ef5350' },
              { label: 'Dbl+', count: doubles, color: '#c62828' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color }}>{count}</div>
                <div style={{ fontSize: 8, color: sub, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Avg round */}
        {completedRounds.length > 0 && (
          <div style={{
            background: cardBg, borderRadius: 14, padding: '12px 16px',
            border: `1px solid ${border}`, marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: sub, fontWeight: 500 }}>Avg Round Score</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: avgRound <= 0 ? '#4caf50' : '#ff9800' }}>
              {avgRound <= 0 ? avgRound : `+${avgRound}`}
            </span>
          </div>
        )}

        {/* Recent rounds */}
        {rounds.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
              Recent Rounds
            </div>
            {rounds.slice(0, 5).map(r => {
              const sc = totalScore(r);
              const complete = isRoundComplete(r);
              return (
                <div key={r.date} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 10,
                  background: cardBg, border: `1px solid ${border}`,
                  marginBottom: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: text }}>{formatDate(r.date)}</span>
                    <span style={{ fontSize: 10, color: sub }}>
                      {r.holes.length}/{HOLES_PER_ROUND}
                      {!complete && ' ip'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {r.holes.map((h, i) => (
                        <div key={i} style={{
                          width: 10, height: 10, borderRadius: 2,
                          background: h.score <= -2 ? '#1b5e20' : h.score === -1 ? '#4caf50' : h.score === 0 ? '#ff9800' : '#ef5350',
                        }} />
                      ))}
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 600,
                      color: sc <= 0 ? '#4caf50' : '#ff9800',
                      minWidth: 30, textAlign: 'right',
                    }}>
                      {sc <= 0 ? sc : `+${sc}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
