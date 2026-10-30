import { useState, useRef, useCallback, useEffect } from 'react';
import { GameState, Puzzle, CellType } from './engine/types';
import { getScoreLabel, getMoves } from './engine/game';
import { DailyRound, HOLES_PER_ROUND, totalScore, totalPar, isRoundComplete } from './engine/round';

function MiniGrid({ puzzle, path }: { puzzle: Puzzle; path: [number, number][] }) {
  const size = Math.min(Math.floor(280 / puzzle.cols), Math.floor(200 / puzzle.rows), 20);
  const gap = 1;
  const w = puzzle.cols * (size + gap) - gap;
  const h = puzzle.rows * (size + gap) - gap;
  const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 12px' }}>
      <svg width={w} height={h} style={{ borderRadius: 4 }}>
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

            let fill = '#f0f1f3';
            let rounded = false;
            if (t === CellType.Wall) { fill = '#1a1a2e'; rounded = true; }
            if (t === CellType.TriviaWall) { fill = '#2a2a3e'; rounded = true; }
            if (t === CellType.Ice) fill = '#b3e5fc';
            if (t === CellType.Sand) fill = '#ffe0b2';
            if (t === CellType.Trap) fill = '#ffcdd2';
            if (t === CellType.Checkpoint) fill = '#e0e0e0';
            if (onPath && t === CellType.Empty) fill = '#66bb6a';
            if (isStart) fill = '#4caf50';
            if (isEnd) fill = '#e53935';

            const iconScale = size / 28;

            return (
              <g key={`${r},${c}`}>
                <rect x={x} y={y} width={size} height={size}
                  rx={rounded ? 2 : 0} fill={fill}
                  stroke={rounded ? 'none' : 'rgba(0,0,0,0.06)'} strokeWidth={0.5} />
                {t === CellType.Ice && !isStart && !isEnd && (
                  <g transform={`translate(${cx},${cy}) scale(${iconScale})`} opacity={0.4}>
                    <line x1="0" y1="-6" x2="0" y2="6" stroke="#0288d1" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="-6" y1="0" x2="6" y2="0" stroke="#0288d1" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="-4" y1="-4" x2="4" y2="4" stroke="#0288d1" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="4" y1="-4" x2="-4" y2="4" stroke="#0288d1" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                )}
                {t === CellType.Sand && !isStart && !isEnd && (
                  <g transform={`translate(${cx},${cy}) scale(${iconScale})`} opacity={0.35}>
                    <circle cx="-3" cy="-3" r="1" fill="#e65100" />
                    <circle cx="3" cy="-3" r="1" fill="#e65100" />
                    <circle cx="0" cy="0" r="1" fill="#e65100" />
                    <circle cx="-3" cy="3" r="1" fill="#e65100" />
                    <circle cx="3" cy="3" r="1" fill="#e65100" />
                  </g>
                )}
                {t === CellType.Trap && !isStart && !isEnd && (
                  <text x={cx} y={cy + size * 0.15} textAnchor="middle"
                    fontSize={size * 0.5} fontWeight={800} fill="#c62828">!</text>
                )}
                {t === CellType.TriviaWall && (
                  <text x={cx} y={cy + size * 0.15} textAnchor="middle"
                    fontSize={size * 0.32} fontWeight={700} fill="#fff" opacity={0.9}>?</text>
                )}
                {t === CellType.Checkpoint && cell.checkpointIndex !== undefined && (
                  <>
                    <circle cx={cx} cy={cy} r={size * 0.3} fill="#9e9e9e" />
                    <text x={cx} y={cy + size * 0.12} textAnchor="middle"
                      fontSize={size * 0.28} fontWeight={800} fill="#fff">
                      {cell.checkpointIndex + 1}
                    </text>
                  </>
                )}
                {isStart && onPath && (
                  <circle cx={cx} cy={cy} r={size * 0.25} fill="#2e7d32" stroke="#fff" strokeWidth={1} />
                )}
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

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

interface Props {
  visible: boolean;
  gameState: GameState;
  puzzle: Puzzle;
  round: DailyRound;
  holeNumber: number;
  onClose: () => void;
}

export default function ScoreModal({ visible, gameState, puzzle, round, holeNumber, onClose }: Props) {
  const [shared, setShared] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) setShared(false);
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
      const file = new File([blob], `par-${round.date}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Par Puzzle - ${formatDate(round.date)}` });
          setShared(true);
          return;
        } catch { /* user cancelled */ }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `par-${round.date}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setShared(true);
    }, 'image/png');
  }, [round.date]);

  if (!visible) return null;

  const holeScore = gameState.score ?? 0;
  const moves = getMoves(gameState, puzzle);
  const label = getScoreLabel(holeScore);
  const good = holeScore <= 0;
  const scoreColor = good ? '#4caf50' : '#ff9800';
  const roundScore = totalScore(round);
  const roundPar = totalPar(round);
  const roundComplete = isRoundComplete(round);

  return (
    <div style={st.overlay} onClick={onClose}>
      <div style={st.modal} onClick={e => e.stopPropagation()}>
        <button style={st.x} onClick={(e) => { e.stopPropagation(); onClose(); }}>&times;</button>

        {/* Shareable card */}
        <div ref={cardRef} style={st.card}>
          <div style={st.cardTop}>
            <span style={st.cardLogo}>par puzzle</span>
            <span style={st.cardDate}>{formatDate(round.date)}</span>
          </div>

          {/* Current hole result */}
          <div style={{ ...st.scoreLabel, color: scoreColor }}>{label}</div>
          <div style={{ ...st.scoreBig, color: scoreColor }}>
            {holeScore <= 0 ? holeScore : `+${holeScore}`}
          </div>
          <div style={st.movesDetail}>
            Hole {Math.min(holeNumber, HOLES_PER_ROUND)} &middot; {moves} moves &middot; par {puzzle.par}
          </div>

          <MiniGrid puzzle={puzzle} path={gameState.path} />

          {/* Round scorecard */}
          {round.holes.length > 0 && (
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10, marginTop: 4 }}>
              <div style={{ fontSize: 9, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                Round {roundComplete ? 'Score' : 'Progress'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                {Array.from({ length: HOLES_PER_ROUND }, (_, i) => {
                  const hole = round.holes[i];
                  const played = !!hole;
                  const s = hole?.score ?? 0;
                  return (
                    <div key={i} style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: played
                        ? s <= -2 ? '#1b5e20' : s === -1 ? '#4caf50' : s === 0 ? '#ff9800' : '#ef5350'
                        : '#f0f0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                      color: played ? '#fff' : '#ccc',
                    }}>
                      {played ? (s <= 0 ? s : `+${s}`) : (i + 1)}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: roundScore <= 0 ? '#4caf50' : '#ff9800' }}>
                    {roundScore <= 0 ? roundScore : `+${roundScore}`}
                  </div>
                  <div style={{ fontSize: 8, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                    {round.holes.length}/{HOLES_PER_ROUND} holes
                  </div>
                </div>
                <div style={{ width: 1, height: 24, background: '#f0f0f0' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a2e' }}>
                    {roundPar}
                  </div>
                  <div style={{ fontSize: 8, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                    total par
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={st.watermark}>par-web.vercel.app</div>
        </div>

        {/* Buttons */}
        <div style={st.btns}>
          <button style={st.shareBtn} onClick={shareAsImage}>
            {shared ? 'Saved!' : 'Share Result'}
          </button>
        </div>
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
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    marginBottom: 8,
  },
  cardLogo: {
    fontSize: 18, fontWeight: 200, color: '#1a1a2e', letterSpacing: 5,
  },
  cardDate: {
    fontSize: 11, color: '#9e9e9e', letterSpacing: 1, marginTop: 2,
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
  watermark: {
    fontSize: 9, color: '#ddd', marginTop: 10, letterSpacing: 1,
  },
  btns: { marginTop: 14, display: 'flex', justifyContent: 'center' },
  shareBtn: {
    background: '#1a1a2e', color: '#fff', border: 'none',
    padding: '12px 32px', borderRadius: 100, fontSize: 14,
    fontWeight: 500, cursor: 'pointer', letterSpacing: 0.5,
  },
};
