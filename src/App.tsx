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

const DARK_KEY = 'par_dark_mode';

export default function App() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [triviaTarget, setTriviaTarget] = useState<{ r: number; c: number; question: TriviaQuestion } | null>(null);
  const [dark, setDark] = useState(() => localStorage.getItem(DARK_KEY) === '1');

  const stateRef = useRef<GameState | null>(null);
  stateRef.current = gameState;

  const toggleDark = () => {
    setDark(d => {
      const next = !d;
      localStorage.setItem(DARK_KEY, next ? '1' : '0');
      return next;
    });
  };

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

  // Theme colors
  const t = {
    bg: dark ? '#121212' : '#fff',
    text: dark ? '#e0e0e0' : '#1a1a2e',
    sub: dark ? '#666' : '#bdbdbd',
    sub2: dark ? '#555' : '#9e9e9e',
    divider: dark ? '#2a2a2a' : '#eee',
    icon: dark ? '#888' : '#9e9e9e',
    gridShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
  };

  return (
    <div style={{ ...s.container, background: t.bg }}>
      {/* Header */}
      <div style={s.headerRow}>
        <div style={s.headerLeft}>
          <button style={s.iconBtn} onClick={() => {/* TODO: profile */}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button style={s.iconBtn} onClick={toggleDark}>
            {dark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
        <div style={s.headerCenter}>
          <div style={{ ...s.title, color: t.text }}>par</div>
          <div style={{ ...s.day, color: t.sub }}>#{dayNumber()}</div>
        </div>
        <div style={s.headerRight}>
          <button style={s.iconBtn} onClick={() => setShowStats(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="12" width="4" height="9" rx="1" />
              <rect x="10" y="7" width="4" height="14" rx="1" />
              <rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      <div style={s.strip}>
        <div style={s.col}>
          <div style={{ ...s.num, color: t.text }}>{puzzle.par}</div>
          <div style={{ ...s.lbl, color: t.sub }}>par</div>
        </div>
        <div style={{ ...s.divider, background: t.divider }} />
        <div style={s.col}>
          <div style={{ ...s.num, color: t.text }}>{moves}{penalty > 0 ? <span style={{ color: '#ef5350', fontSize: 16 }}> +{penalty}</span> : ''}</div>
          <div style={{ ...s.lbl, color: t.sub }}>moves{penalty > 0 ? ' + penalty' : ''}</div>
        </div>
        <div style={{ ...s.divider, background: t.divider }} />
        <div style={s.col}>
          <div style={{ ...s.num, color: diff <= 0 ? '#4caf50' : '#ff9800' }}>
            {diff <= 0 ? diff : `+${diff}`}
          </div>
          <div style={{ ...s.lbl, color: t.sub }}>+/-</div>
        </div>
      </div>

      {!gameState.completed && moves === 0 && (
        <div style={{ ...s.hint, color: t.sub }}>Draw a path from the green dot to the goal</div>
      )}

      <div style={{ ...s.gridWrap, boxShadow: t.gridShadow }}>
        <Grid
          puzzle={puzzle}
          gameState={gameState}
          onCellEnter={handleCellEnter}
          onDrawStart={() => setGameState(gs => gs ? { ...gs, drawing: true } : gs)}
          onDrawEnd={() => setGameState(gs => gs ? { ...gs, drawing: false } : gs)}
          onTriviaTap={handleTriviaTap}
        />
      </div>

      <div style={s.legend}>
        <span style={{ color: t.sub2, fontSize: 12 }}>
          Tap <b style={{ color: t.text }}>?</b> blocks for trivia
          <span style={{ color: t.sub, margin: '0 6px' }}>|</span>
          <b>E</b> Entertainment
          <span style={{ color: t.sub, margin: '0 4px' }}>&middot;</span>
          <b>H</b> History
          <span style={{ color: t.sub, margin: '0 4px' }}>&middot;</span>
          <b>S</b> Sports
          <span style={{ color: t.sub, margin: '0 4px' }}>&middot;</span>
          <b>W</b> World
          <span style={{ color: t.sub, margin: '0 4px' }}>&middot;</span>
          <b>Sc</b> Science
        </span>
      </div>

      {triviaTarget && (
        <TriviaModal question={triviaTarget.question} onResult={handleTriviaResult} />
      )}
      <ScoreModal visible={showScore} gameState={gameState} puzzle={puzzle} onClose={() => setShowScore(false)} />
      <StatsModal visible={showStats} onClose={() => setShowStats(false)} onViewHole={handleViewHole} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', fontFamily: '-apple-system, system-ui, sans-serif',
    transition: 'background 0.2s',
  },
  headerRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', maxWidth: 420, padding: '0 12px',
    paddingTop: 'max(env(safe-area-inset-top), 12px)',
  },
  headerLeft: { display: 'flex', gap: 4, minWidth: 72 },
  headerCenter: { textAlign: 'center', flex: 1 },
  headerRight: { display: 'flex', justifyContent: 'flex-end', minWidth: 72 },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 8, borderRadius: 8, WebkitTapHighlightColor: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 36, fontWeight: 200, letterSpacing: 10 },
  day: { fontSize: 13, letterSpacing: 2, marginTop: 2 },
  strip: { display: 'flex', alignItems: 'center', margin: '20px 0' },
  col: { textAlign: 'center', padding: '0 24px' },
  num: { fontSize: 28, fontWeight: 300 },
  lbl: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  divider: { width: 1, height: 32 },
  hint: { fontSize: 14, marginBottom: 16, letterSpacing: 0.3 },
  gridWrap: { borderRadius: 12 },
  legend: {
    marginTop: 16, padding: '0 20px',
    textAlign: 'center', lineHeight: 1.8,
  },
};
