import { DailyRound, HOLES_PER_ROUND, totalScore, getHoleResult } from './engine/round';

interface Props {
  round: DailyRound;
  holeNumber: number;
  holeScore: number;
  holeMoves: number;
  holePar: number;
  dark: boolean;
  onNextHole: () => void;
  onEndRound: () => void;
  onGoToHole: (holeNum: number) => void;
}

export default function HoleSummary({ round, holeNumber: _hn, holeScore: _hs, holeMoves: _hm, holePar: _hp, dark, onNextHole, onEndRound, onGoToHole }: Props) {
  const bg = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#666' : '#9e9e9e';
  const border = dark ? '#333' : '#e8e8e8';
  const holesPlayed = round.holes.length;
  const cumScore = totalScore(round);
  const allPlayed = holesPlayed >= HOLES_PER_ROUND;
  const scoreColor = cumScore <= 0 ? '#4caf50' : '#ff9800';

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
    }}>
      <div style={{
        background: bg, borderRadius: 24, padding: '28px 24px',
        width: '88%', maxWidth: 340, textAlign: 'center',
      }}>
        {/* Round score — big and prominent */}
        <div style={{ fontSize: 11, fontWeight: 700, color: sub, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          Round Score
        </div>
        <div style={{ fontSize: 52, fontWeight: 200, color: scoreColor, lineHeight: 1 }}>
          {cumScore <= 0 ? cumScore : `+${cumScore}`}
        </div>
        <div style={{ fontSize: 12, color: sub, marginTop: 6 }}>
          {holesPlayed} of {HOLES_PER_ROUND} holes
        </div>

        {/* Per-hole scores — tappable */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 4, marginTop: 20,
          paddingTop: 16, borderTop: `1px solid ${border}`, flexWrap: 'wrap',
        }}>
          {Array.from({ length: HOLES_PER_ROUND }, (_, i) => {
            const hole = getHoleResult(round, i + 1);
            const played = !!hole;
            const s = hole?.score ?? 0;
            return (
              <div
                key={i}
                onClick={() => onGoToHole(i + 1)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  fontSize: 8, fontWeight: 600, color: sub, lineHeight: 1,
                }}>
                  {i + 1}
                </div>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: played
                    ? s <= -2 ? '#1b5e20' : s === -1 ? '#4caf50' : s === 0 ? '#ff9800' : '#ef5350'
                    : (dark ? '#2a2a2a' : '#f0f0f0'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: played ? '#fff' : (dark ? '#555' : '#bbb'),
                }}>
                  {played ? (s <= 0 ? s : `+${s}`) : '-'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Button */}
        <div style={{ marginTop: 24 }}>
          <button
            onClick={allPlayed ? onEndRound : onNextHole}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: text, color: bg,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {allPlayed ? 'View Scorecard' : `Hole ${round.holes.length + 1}`}
          </button>
        </div>
      </div>
    </div>
  );
}
