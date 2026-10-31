import { DailyRound, HOLES_PER_ROUND, totalScore, totalPar, isRoundComplete, getHoleResult, nextUnplayedHole } from './engine/round';
import { getRoundHistory } from './storage';
import { fetchLeaderboard, LeaderboardEntry } from './lib/api';
import { useState, useEffect } from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentRound: DailyRound | null;
  dark: boolean;
  onPlayHole?: (holeNumber: number) => void;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function ScorecardRow({ round, dark, onPlayHole }: { round: DailyRound; dark: boolean; onPlayHole?: (h: number) => void }) {
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#666' : '#9e9e9e';
  const score = totalScore(round);
  const par = totalPar(round);
  const complete = isRoundComplete(round);

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 14,
      background: dark ? '#1e1e1e' : '#f8f8fa',
      border: `1px solid ${dark ? '#2a2a2a' : '#eee'}`,
      marginBottom: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{formatDate(round.date)}</div>
          <div style={{ fontSize: 10, color: sub }}>
            {round.holes.length} hole{round.holes.length !== 1 ? 's' : ''}
            {!complete && ' (in progress)'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: score <= 0 ? '#4caf50' : '#ff9800' }}>
            {score <= 0 ? score : `+${score}`}
          </div>
          <div style={{ fontSize: 9, color: sub, textTransform: 'uppercase', letterSpacing: 1 }}>
            par {par}
          </div>
        </div>
      </div>
      {/* Mini hole scores with hole numbers */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {Array.from({ length: HOLES_PER_ROUND }, (_, i) => {
          const hole = getHoleResult(round, i + 1);
          const played = !!hole;
          const s = hole?.score ?? 0;
          const isNextHole = !played && i + 1 === nextUnplayedHole(round) && !round.ended;
          const canClick = !!onPlayHole;
          return (
            <div
              key={i}
              onClick={canClick ? () => onPlayHole(i + 1) : undefined}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: played
                  ? s <= -2 ? '#1b5e20' : s === -1 ? '#4caf50' : s === 0 ? '#ff9800' : '#ef5350'
                  : isNextHole
                    ? (dark ? '#2a3a2a' : '#e8f5e9')
                    : (dark ? '#2a2a2a' : '#e8e8e8'),
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: canClick ? 'pointer' : 'default',
                border: isNextHole ? '1.5px solid #4caf50' : 'none',
                transition: 'transform 0.1s',
              }}>
              <div style={{
                fontSize: played ? 10 : 9, fontWeight: 700,
                color: played ? '#fff' : (dark ? '#666' : '#999'),
                lineHeight: 1,
              }}>
                {played ? (s <= 0 ? s : `+${s}`) : (i + 1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, dark, index }: { entry: LeaderboardEntry; dark: boolean; index: number }) {
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#666' : '#9e9e9e';
  const scoreColor = entry.totalScore <= 0 ? '#4caf50' : '#ff9800';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 14,
      background: dark ? '#1e1e1e' : '#f8f8fa',
      border: `1px solid ${dark ? '#2a2a2a' : '#eee'}`,
      marginBottom: 4,
    }}>
      {/* Rank */}
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: index === 0 ? '#ffd600' : index === 1 ? '#bdbdbd' : index === 2 ? '#bf8040' : (dark ? '#2a2a2a' : '#e8e8e8'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 800,
          color: index < 3 ? '#1a1a2e' : (dark ? '#666' : '#999'),
        }}>
          {entry.rank}
        </span>
      </div>

      {/* Name + stats */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.displayName}
        </div>
        <div style={{ fontSize: 10, color: sub }}>
          {entry.holesPlayed} holes &middot; {entry.daysPlayed} day{entry.daysPlayed !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: scoreColor }}>
          {entry.totalScore <= 0 ? entry.totalScore : `+${entry.totalScore}`}
        </div>
        <div style={{ fontSize: 9, color: sub, letterSpacing: 0.5 }}>
          vs par
        </div>
      </div>
    </div>
  );
}

type Tab = 'rounds' | 'leaderboard';

export default function RoundScorecard({ visible, onClose, currentRound, dark, onPlayHole }: Props) {
  const [tab, setTab] = useState<Tab>('rounds');
  const [history, setHistory] = useState<DailyRound[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setHistory(getRoundHistory());
      setTab('rounds');
    }
  }, [visible]);

  useEffect(() => {
    if (visible && tab === 'leaderboard' && leaderboard.length === 0) {
      setLbLoading(true);
      fetchLeaderboard().then(data => {
        setLeaderboard(data);
        setLbLoading(false);
      }).catch(() => setLbLoading(false));
    }
  }, [visible, tab]);

  if (!visible) return null;

  const bg = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#666' : '#9e9e9e';
  const tabBg = dark ? '#242424' : '#f0f0f2';
  const tabActive = dark ? '#333' : '#fff';

  const rounds = currentRound
    ? [currentRound, ...history.filter(r => r.date !== currentRound.date)]
    : history;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: bg, borderRadius: 24, padding: '24px 16px',
        width: '92%', maxWidth: 380, position: 'relative',
        maxHeight: '85dvh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <button style={{
          position: 'absolute', top: 8, right: 8,
          background: 'none', border: 'none', fontSize: 28,
          color: dark ? '#666' : '#bdbdbd',
          cursor: 'pointer', zIndex: 10, width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>&times;</button>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, padding: 3, borderRadius: 12,
          background: tabBg, marginBottom: 16,
        }}>
          {(['rounds', 'leaderboard'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: tab === t ? tabActive : 'transparent',
                color: tab === t ? text : sub,
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {t === 'rounds' ? 'My Rounds' : 'Leaderboard'}
            </button>
          ))}
        </div>

        {/* My Rounds tab */}
        {tab === 'rounds' && (
          <>
            {rounds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: sub, fontSize: 13 }}>
                No rounds yet. Start playing!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {rounds.map(r => (
                  <ScorecardRow key={r.date} round={r} dark={dark} onPlayHole={onPlayHole} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Leaderboard tab */}
        {tab === 'leaderboard' && (
          <>
            {lbLoading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: sub, fontSize: 13 }}>
                Loading...
              </div>
            ) : leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: sub, fontSize: 13 }}>
                No entries yet. Complete a round to join!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {leaderboard.map((entry, i) => (
                  <LeaderboardRow key={entry.rank} entry={entry} dark={dark} index={i} />
                ))}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 10, color: sub }}>
              Minimum 9 holes played to qualify
            </div>
          </>
        )}
      </div>
    </div>
  );
}
