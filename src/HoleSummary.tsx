import { getScoreLabel } from './engine/game';
import { DailyRound, HOLES_PER_ROUND, totalScore } from './engine/round';

interface Props {
  round: DailyRound;
  holeScore: number;
  holeMoves: number;
  holePar: number;
  dark: boolean;
  onNextHole: () => void;
  onEndRound: () => void;
  onGoToHole: (holeNum: number) => void;
}

export default function HoleSummary({ round, holeScore, holeMoves, holePar, dark, onNextHole, onEndRound, onGoToHole }: Props) {
  const bg = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#666' : '#9e9e9e';
  const border = dark ? '#333' : '#e8e8e8';
  const good = holeScore <= 0;
  const scoreColor = good ? '#4caf50' : '#ff9800';
  const holesPlayed = round.holes.length;
  const cumScore = totalScore(round);
  const isLastHole = round.currentHole > HOLES_PER_ROUND;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
    }}>
      <div style={{
        background: bg, borderRadius: 24, padding: '28px 24px',
        width: '88%', maxWidth: 340, textAlign: 'center',
      }}>
        {/* Hole result */}
        <div style={{ fontSize: 11, fontWeight: 700, color: sub, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          Hole {holesPlayed} of {HOLES_PER_ROUND}
        </div>
        <div style={{ fontSize: 48, fontWeight: 200, color: scoreColor, lineHeight: 1 }}>
          {holeScore <= 0 ? holeScore : `+${holeScore}`}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: scoreColor, textTransform: 'uppercase', letterSpacing: 3, marginTop: 4 }}>
          {getScoreLabel(holeScore)}
        </div>
        <div style={{ fontSize: 12, color: sub, marginTop: 6 }}>
          {holeMoves} moves &middot; par {holePar}
        </div>

        {/* Cumulative score */}
        <div style={{
          marginTop: 20, padding: '12px 0',
          borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: cumScore <= 0 ? '#4caf50' : '#ff9800' }}>
              {cumScore <= 0 ? cumScore : `+${cumScore}`}
            </div>
            <div style={{ fontSize: 9, color: sub, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Round Score
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: text }}>
              {holesPlayed}/{HOLES_PER_ROUND}
            </div>
            <div style={{ fontSize: 9, color: sub, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Holes
            </div>
          </div>
        </div>

        {/* Mini scorecard — tappable */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 16, flexWrap: 'wrap' }}>
          {Array.from({ length: HOLES_PER_ROUND }, (_, i) => {
            const hole = round.holes[i];
            const played = !!hole;
            const s = hole?.score ?? 0;
            const isNext = !played && i + 1 === round.currentHole;
            return (
              <div
                key={i}
                onClick={() => onGoToHole(i + 1)}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: played
                    ? s <= -2 ? '#1b5e20' : s === -1 ? '#4caf50' : s === 0 ? '#ff9800' : '#ef5350'
                    : isNext
                      ? (dark ? '#2a3a2a' : '#e8f5e9')
                      : (dark ? '#2a2a2a' : '#f0f0f0'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  color: played ? '#fff' : (dark ? '#666' : '#999'),
                  cursor: 'pointer',
                  border: isNext ? '1.5px solid #4caf50' : 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                {played ? (s <= 0 ? s : `+${s}`) : i + 1}
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {!isLastHole && (
            <button
              onClick={onEndRound}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 12,
                border: `1.5px solid ${border}`, background: 'none',
                fontSize: 13, fontWeight: 600, color: sub, cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              End Round
            </button>
          )}
          <button
            onClick={isLastHole ? onEndRound : onNextHole}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 12, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: '#1a1a2e', color: '#fff',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isLastHole ? 'View Scorecard' : 'Next Hole'}
          </button>
        </div>
      </div>
    </div>
  );
}
