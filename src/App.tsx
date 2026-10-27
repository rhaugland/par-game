import { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle } from './engine/generator';
import { createGameState, addToPath, getMoves } from './engine/game';
import { todaySeed, dayNumber } from './engine/seed';
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
      setGameState({ path: [], drawing: false, completed: true, score: record.score, unlockedCells: new Set() });
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
    if (correct && triviaTarget) {
      setGameState(s => {
        if (!s) return s;
        const newUnlocked = new Set(s.unlockedCells);
        newUnlocked.add(`${triviaTarget.r},${triviaTarget.c}`);
        return { ...s, unlockedCells: newUnlocked };
      });
    }
    setTriviaTarget(null);
  }, [triviaTarget]);

  const handleReset = useCallback(() => {
    if (!puzzle) return;
    setShowScore(false);
    setGameState(createGameState(puzzle));
  }, [puzzle]);

  if (!puzzle || !gameState) return null;

  const moves = getMoves(gameState);
  const diff = moves - puzzle.par;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>par</div>
        <div style={styles.day}>#{dayNumber()}</div>
      </div>

      <div style={styles.strip}>
        <div style={styles.col}>
          <div style={styles.num}>{puzzle.par}</div>
          <div style={styles.lbl}>par</div>
        </div>
        <div style={styles.divider} />
        <div style={styles.col}>
          <div style={styles.num}>{moves}</div>
          <div style={styles.lbl}>moves</div>
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
        <div style={styles.hint}>
          Draw a path from the green dot to the goal
          {puzzle.triviaQuestions.size > 0 && (
            <div style={{ marginTop: 4, fontSize: 12 }}>Tap purple blocks to unlock shortcuts</div>
          )}
        </div>
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

      {!gameState.completed && moves > 0 && (
        <button style={styles.resetBtn} onClick={handleReset}>Clear Path</button>
      )}

      <button style={styles.statsLink} onClick={() => setShowStats(true)}>View Stats</button>

      {triviaTarget && (
        <TriviaModal question={triviaTarget.question} onResult={handleTriviaResult} />
      )}
      <ScoreModal visible={showScore} gameState={gameState} puzzle={puzzle} onReset={handleReset} onClose={() => setShowScore(false)} />
      <StatsModal visible={showStats} onClose={() => setShowStats(false)} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', background: '#fff', fontFamily: '-apple-system, system-ui, sans-serif',
  },
  header: { textAlign: 'center', paddingTop: 'max(env(safe-area-inset-top), 16px)' },
  title: { fontSize: 36, fontWeight: 200, color: '#1a1a2e', letterSpacing: 10 },
  day: { fontSize: 13, color: '#bdbdbd', letterSpacing: 2, marginTop: 2 },
  strip: { display: 'flex', alignItems: 'center', margin: '20px 0' },
  col: { textAlign: 'center', padding: '0 24px' },
  num: { fontSize: 28, fontWeight: 300, color: '#1a1a2e' },
  lbl: { fontSize: 10, color: '#bdbdbd', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  divider: { width: 1, height: 32, background: '#eee' },
  hint: { fontSize: 14, color: '#bdbdbd', marginBottom: 16, letterSpacing: 0.3 },
  gridWrap: { boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 12 },
  resetBtn: {
    marginTop: 24, padding: '10px 28px', borderRadius: 100,
    border: '1.5px solid #e0e0e0', background: 'none',
    fontSize: 14, color: '#9e9e9e', fontWeight: 500, cursor: 'pointer',
  },
  statsLink: {
    marginTop: 20, background: 'none', border: 'none',
    fontSize: 13, color: '#bdbdbd', letterSpacing: 1, cursor: 'pointer',
  },
};
