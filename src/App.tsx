import { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle } from './engine/generator';
import { createGameState, addToPath, getMoves } from './engine/game';
import { todaySeed, dayNumber, seedForDay } from './engine/seed';
import { Puzzle, GameState, TriviaQuestion } from './engine/types';
import { saveRecord, getTodayRecord } from './storage';
import Grid from './Grid';
import ScoreModal from './ScoreModal';
import StatsModal from './StatsModal';
import TriviaModal from './TriviaModal';

export default function App() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [triviaTarget, setTriviaTarget] = useState<{ r: number; c: number; question: TriviaQuestion } | null>(null);

  const stateRef = useRef<GameState | null>(null);
  stateRef.current = gameState;

  useEffect(() => {
    const seed = todaySeed();
    const p = generatePuzzle(seed);
    setPuzzle(p);

    const record = getTodayRecord(seed);
    if (record?.completed) {
      setGameState({ path: [], drawing: false, completed: true, score: record.score, unlockedCells: new Set(), failedCells: new Set(), triviaPenalty: 0 });
      setShowScore(true);
    } else {
      setGameState(createGameState(p));
    }
  }, []);

  const handleCellEnter = useCallback((r: number, c: number) => {
    if (!puzzle) return;
    const gs = stateRef.current;
    if (!gs || gs.completed) return;

    const next = addToPath(gs, r, c, puzzle);
    if (next !== gs) {
      setGameState(next);
      if (next.completed) {
        const moves = getMoves(next);
        saveRecord({
          date: todaySeed(), moves, par: puzzle.par,
          score: next.score ?? 0, completed: true,
        });
        setTimeout(() => setShowScore(true), 400);
      }
    }
  }, [puzzle]);

  const handleTriviaTap = useCallback((_r: number, _c: number, question: TriviaQuestion) => {
    setTriviaTarget({ r: _r, c: _c, question });
  }, []);

  const handleTriviaResult = useCallback((correct: boolean) => {
    if (triviaTarget) {
      setGameState(s => {
        if (!s) return s;
        if (correct) {
          const newUnlocked = new Set(s.unlockedCells);
          newUnlocked.add(`${triviaTarget.r},${triviaTarget.c}`);
          return { ...s, unlockedCells: newUnlocked };
        } else {
          const newFailed = new Set(s.failedCells);
          newFailed.add(`${triviaTarget.r},${triviaTarget.c}`);
          return { ...s, failedCells: newFailed, triviaPenalty: s.triviaPenalty + 1 };
        }
      });
    }
    setTriviaTarget(null);
  }, [triviaTarget]);

  const handleViewHole = useCallback((day: number) => {
    const seed = seedForDay(day);
    const p = generatePuzzle(seed);
    setPuzzle(p);
    const record = getTodayRecord(seed);
    if (record?.completed) {
      setGameState({ path: [], drawing: false, completed: true, score: record.score, unlockedCells: new Set(), failedCells: new Set(), triviaPenalty: 0 });
    } else {
      setGameState(createGameState(p));
    }
    setShowStats(false);
    if (record?.completed) {
      setTimeout(() => setShowScore(true), 300);
    }
  }, []);

  if (!puzzle || !gameState) return null;

  const moves = getMoves(gameState);
  const penalty = gameState.triviaPenalty;
  const diff = (moves + penalty) - puzzle.par;

  return (
    <div style={styles.container}>
      {/* Header row with profile, title, stats */}
      <div style={styles.headerRow}>
        <button style={styles.iconBtn} onClick={() => {/* TODO: profile/auth */}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        <div style={styles.headerCenter}>
          <div style={styles.title}>par</div>
          <div style={styles.day}>#{dayNumber()}</div>
        </div>
        <button style={styles.iconBtn} onClick={() => setShowStats(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="12" width="4" height="9" rx="1" />
            <rect x="10" y="7" width="4" height="14" rx="1" />
            <rect x="17" y="3" width="4" height="18" rx="1" />
          </svg>
        </button>
      </div>

      <div style={styles.strip}>
        <div style={styles.col}>
          <div style={styles.num}>{puzzle.par}</div>
          <div style={styles.lbl}>par</div>
        </div>
        <div style={styles.divider} />
        <div style={styles.col}>
          <div style={styles.num}>{moves}{penalty > 0 ? <span style={{ color: '#ef5350', fontSize: 16 }}> +{penalty}</span> : ''}</div>
          <div style={styles.lbl}>moves{penalty > 0 ? ' + penalty' : ''}</div>
        </div>
        <div style={styles.divider} />
        <div style={styles.col}>
          <div style={{ ...styles.num, color: diff <= 0 ? '#4caf50' : '#ff9800' }}>
            {diff <= 0 ? diff : `+${diff}`}
          </div>
          <div style={styles.lbl}>+/-</div>
        </div>
      </div>

      {!gameState.completed && moves === 0 && (
        <div style={styles.hint}>Draw a path from the green dot to the goal</div>
      )}

      <div style={styles.gridWrap}>
        <Grid
          puzzle={puzzle}
          gameState={gameState}
          onCellEnter={handleCellEnter}
          onDrawStart={() => setGameState(s => s ? { ...s, drawing: true } : s)}
          onDrawEnd={() => setGameState(s => s ? { ...s, drawing: false } : s)}
          onTriviaTap={handleTriviaTap}
        />
      </div>

      <div style={styles.legend}>
        <div style={styles.legendLine}>Tap dark blocks with <b>?</b> for trivia — right answer opens a shortcut, wrong adds +1</div>
        <div style={styles.legendKeys}>
          <span><b>E?</b> Entertainment</span>
          <span><b>H?</b> History</span>
          <span><b>S?</b> Sports</span>
          <span><b>W?</b> World</span>
          <span><b>Sc?</b> Science</span>
        </div>
      </div>

      {triviaTarget && (
        <TriviaModal question={triviaTarget.question} onResult={handleTriviaResult} />
      )}
      <ScoreModal visible={showScore} gameState={gameState} puzzle={puzzle} onClose={() => setShowScore(false)} />
      <StatsModal visible={showStats} onClose={() => setShowStats(false)} onViewHole={handleViewHole} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', background: '#fff', fontFamily: '-apple-system, system-ui, sans-serif',
  },
  headerRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', maxWidth: 420, padding: '0 16px',
    paddingTop: 'max(env(safe-area-inset-top), 12px)',
  },
  headerCenter: { textAlign: 'center', flex: 1 },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 8, borderRadius: 8, WebkitTapHighlightColor: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 36, fontWeight: 200, color: '#1a1a2e', letterSpacing: 10 },
  day: { fontSize: 13, color: '#bdbdbd', letterSpacing: 2, marginTop: 2 },
  strip: { display: 'flex', alignItems: 'center', margin: '20px 0' },
  col: { textAlign: 'center', padding: '0 24px' },
  num: { fontSize: 28, fontWeight: 300, color: '#1a1a2e' },
  lbl: { fontSize: 10, color: '#bdbdbd', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  divider: { width: 1, height: 32, background: '#eee' },
  hint: { fontSize: 14, color: '#bdbdbd', marginBottom: 16, letterSpacing: 0.3 },
  gridWrap: { boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 12 },
  legend: {
    marginTop: 20, textAlign: 'center', maxWidth: 340, padding: '0 16px',
  },
  legendLine: {
    fontSize: 13, color: '#9e9e9e', lineHeight: 1.5,
  },
  legendKeys: {
    display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
    gap: '4px 14px', marginTop: 8,
    fontSize: 11, color: '#bdbdbd',
  },
};
