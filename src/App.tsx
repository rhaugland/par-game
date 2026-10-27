import { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle } from './engine/generator';
import { createGameState, addToPath, getMoves, getScoreLabel } from './engine/game';
import { solvePath } from './engine/solver';
import { todaySeed, dayNumber, seedForDay } from './engine/seed';
import { Puzzle, GameState, TriviaQuestion, PowerupType, POWERUP_COSTS, POWERUP_LIMITS } from './engine/types';
import {
  saveRecord, getTodayRecord, setLocalTickets, setLocalInventory,
  getLocalTickets, getLocalInventory, syncRecordsFromApi,
} from './storage';
import { setAuthTokenGetter, buyPowerup as apiBuyPowerup, usePowerupApi, fetchProfile } from './lib/api';
import { useClerkAuth } from './useClerkAuth';
import Grid from './Grid';
import ScoreModal from './ScoreModal';
import StatsModal from './StatsModal';
import TriviaModal from './TriviaModal';
import ArcadeModal from './ArcadeModal';
import LoginModal from './LoginModal';

const DARK_KEY = 'par_dark_mode';

export default function App({ clerkEnabled }: { clerkEnabled: boolean }) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showArcade, setShowArcade] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [triviaTarget, setTriviaTarget] = useState<{ r: number; c: number; question: TriviaQuestion } | null>(null);
  const [dark, setDark] = useState(() => localStorage.getItem(DARK_KEY) === '1');
  const [tickets, setTickets] = useState(0);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  // Clerk auth — only call hooks when Clerk is enabled (provider is mounted)
  const clerkAuth = clerkEnabled ? useClerkAuth() : null; // eslint-disable-line react-hooks/rules-of-hooks
  const isSignedIn = clerkAuth?.isSignedIn ?? false;
  const clerkFirstName = clerkAuth?.firstName ?? null;
  const getToken = clerkAuth?.getToken ?? null;

  const stateRef = useRef<GameState | null>(null);
  stateRef.current = gameState;

  useEffect(() => {
    if (getToken) setAuthTokenGetter(getToken);
  }, [getToken]);

  // Load tickets + inventory
  useEffect(() => {
    if (isSignedIn) {
      fetchProfile().then(p => {
        setTickets(p.tickets);
        setInventory(p.inventory || {});
      }).catch(() => {
        setTickets(getLocalTickets());
        setInventory(getLocalInventory());
      });
    } else {
      setTickets(getLocalTickets());
      setInventory(getLocalInventory());
    }
  }, [isSignedIn]);

  // Sync records on login
  useEffect(() => {
    if (isSignedIn) {
      syncRecordsFromApi().then(() => {
        const seed = todaySeed();
        const record = getTodayRecord(seed);
        if (record?.completed && puzzle) {
          setGameState({
            path: record.path || [], drawing: false, completed: true,
            score: record.score, unlockedCells: new Set(), failedCells: new Set(),
            triviaPenalty: 0, powerupsUsed: record.powerups_used || {}, bombMode: false, parPath: null,
          });
        }
      });
    }
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setGameState({
        path: record.path || [], drawing: false, completed: true,
        score: record.score, unlockedCells: new Set(), failedCells: new Set(),
        triviaPenalty: 0, powerupsUsed: record.powerups_used || {}, bombMode: false, parPath: null,
      });
      setShowScore(true);
    } else {
      setGameState(createGameState(p));
    }
  }, []);

  const handleCellEnter = useCallback((r: number, c: number) => {
    if (!puzzle) return;
    const gs = stateRef.current;
    if (!gs || gs.completed) return;

    // Bomb mode: tapping a wall destroys it
    if (gs.bombMode) {
      const cell = puzzle.grid[r][c];
      if (cell.type === 1 /* Wall */) {
        puzzle.grid[r][c] = { type: 0 /* Empty */ };
        setGameState(s => s ? { ...s, bombMode: false } : s);
      }
      return;
    }

    const next = addToPath(gs, r, c, puzzle);
    if (next !== gs) {
      setGameState(next);
      if (next.completed) {
        const moves = getMoves(next);
        const record = {
          date: todaySeed(), moves, par: puzzle.par,
          score: next.score ?? 0, completed: true,
          path: next.path, powerups_used: next.powerupsUsed,
        };
        saveRecord(record, isSignedIn).then(({ ticketsEarned }) => {
          if (ticketsEarned > 0) {
            setTickets(t => t + ticketsEarned);
          }
        });
        setTimeout(() => setShowScore(true), 400);
      }
    }
  }, [puzzle, isSignedIn]);

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

  const handleBuyPowerup = useCallback(async (type: PowerupType) => {
    const cost = POWERUP_COSTS[type];
    if (tickets < cost) return;

    if (isSignedIn) {
      try {
        const result = await apiBuyPowerup(type);
        setTickets(result.balance);
        setInventory(result.inventory);
      } catch (e) {
        console.error('Buy error:', e);
      }
    } else {
      const newBalance = tickets - cost;
      const newInv = { ...inventory, [type]: (inventory[type] || 0) + 1 };
      setLocalTickets(newBalance);
      setLocalInventory(newInv);
      setTickets(newBalance);
      setInventory(newInv);
    }
  }, [tickets, inventory, isSignedIn]);

  const handleUsePowerup = useCallback(async (type: PowerupType) => {
    if (!puzzle || !gameState || gameState.completed) return;

    const owned = inventory[type] || 0;
    const used = gameState.powerupsUsed[type] || 0;
    if (owned <= 0 || used >= POWERUP_LIMITS[type]) return;

    // Deduct from inventory
    let newInv: Record<string, number>;
    if (isSignedIn) {
      try {
        const result = await usePowerupApi(type, todaySeed());
        newInv = result.inventory;
      } catch (e) {
        console.error('Use error:', e);
        return;
      }
    } else {
      newInv = { ...inventory, [type]: owned - 1 };
      setLocalInventory(newInv);
    }
    setInventory(newInv);

    const newUsed = { ...gameState.powerupsUsed, [type]: used + 1 };

    switch (type) {
      case 'backspace': {
        if (gameState.path.length <= 1) return;
        setGameState(s => s ? { ...s, path: s.path.slice(0, -1), powerupsUsed: newUsed } : s);
        break;
      }
      case 'trivia_retry': {
        const failedArr = Array.from(gameState.failedCells);
        if (failedArr.length === 0) return;
        const lastFailed = failedArr[failedArr.length - 1];
        const q = puzzle.triviaQuestions.get(lastFailed);
        if (q) {
          setGameState(s => {
            if (!s) return s;
            const newFailed = new Set(s.failedCells);
            newFailed.delete(lastFailed);
            return { ...s, failedCells: newFailed, triviaPenalty: Math.max(0, s.triviaPenalty - 1), powerupsUsed: newUsed };
          });
          const [rr, rc] = lastFailed.split(',').map(Number);
          setTriviaTarget({ r: rr, c: rc, question: q });
        }
        break;
      }
      case 'bomb': {
        setGameState(s => s ? { ...s, bombMode: true, powerupsUsed: newUsed } : s);
        setShowArcade(false); // close modal so they can tap the wall
        break;
      }
      case 'puzzle_retry': {
        setGameState({
          ...createGameState(puzzle),
          unlockedCells: gameState.unlockedCells,
          failedCells: gameState.failedCells,
          triviaPenalty: gameState.triviaPenalty,
          powerupsUsed: newUsed,
        });
        setShowArcade(false);
        break;
      }
      case 'par_path': {
        const optPath = solvePath(puzzle.grid, puzzle.start, puzzle.end, puzzle.rows, puzzle.cols);
        setGameState(s => s ? { ...s, parPath: optPath, powerupsUsed: newUsed } : s);
        setShowArcade(false);
        break;
      }
    }
  }, [puzzle, gameState, inventory, isSignedIn]);

  const handleViewHole = useCallback((day: number) => {
    const seed = seedForDay(day);
    const p = generatePuzzle(seed);
    setPuzzle(p);
    const record = getTodayRecord(seed);
    if (record?.completed) {
      setGameState({
        path: record.path || [], drawing: false, completed: true,
        score: record.score, unlockedCells: new Set(), failedCells: new Set(),
        triviaPenalty: 0, powerupsUsed: record.powerups_used || {}, bombMode: false, parPath: null,
      });
    } else {
      setGameState(createGameState(p));
    }
    setShowStats(false);
    if (record?.completed) {
      setTimeout(() => setShowScore(true), 300);
    }
  }, []);

  if (!puzzle || !gameState) return null;

  const todayRecord = getTodayRecord(todaySeed());
  const moves = gameState.completed && todayRecord ? todayRecord.moves : getMoves(gameState);
  const penalty = gameState.triviaPenalty;
  const displayScore = gameState.completed && todayRecord ? todayRecord.score : (moves + penalty) - puzzle.par;
  const diff = displayScore;

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
          <button style={s.iconBtn} onClick={() => isSignedIn ? undefined : setShowLogin(true)}>
            {isSignedIn ? (
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
              }}>
                {(clerkFirstName?.[0] || 'P').toUpperCase()}
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
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
          <button style={s.iconBtn} onClick={() => setShowArcade(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </button>
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

      {!gameState.completed && moves === 0 && !gameState.bombMode && (
        <div style={{ ...s.hint, color: t.sub }}>Draw a path from the green dot to the goal</div>
      )}
      {gameState.bombMode && (
        <div style={{ ...s.hint, color: '#ff9800', fontWeight: 600 }}>💣 Tap a wall to destroy it</div>
      )}
      {gameState.completed && (
        <div style={{ ...s.hint, color: t.sub }}>
          Completed &middot; <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowScore(true)}>view score</span>
        </div>
      )}

      <div style={{ ...s.gridWrap, boxShadow: t.gridShadow, position: 'relative' }}>
        <Grid
          puzzle={puzzle}
          gameState={gameState}
          onCellEnter={handleCellEnter}
          onDrawStart={() => setGameState(gs => gs ? { ...gs, drawing: true } : gs)}
          onDrawEnd={() => setGameState(gs => gs ? { ...gs, drawing: false } : gs)}
          onTriviaTap={handleTriviaTap}
        />
        {gameState.completed && (
          <div
            onClick={() => setShowScore(true)}
            style={{
              position: 'absolute', inset: 0, borderRadius: 12,
              background: dark ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              cursor: 'pointer', zIndex: 30,
            }}
          >
            <div style={{
              background: dark ? '#1e1e1e' : '#fff',
              borderRadius: 20, padding: '28px 40px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, fontWeight: 200, color: diff <= 0 ? '#4caf50' : '#ff9800', lineHeight: 1 }}>
                {diff <= 0 ? diff : `+${diff}`}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: dark ? '#e0e0e0' : '#1a1a2e', textTransform: 'uppercase', letterSpacing: 3, marginTop: 6 }}>
                {getScoreLabel(diff)}
              </div>
              <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 12 }}>Tap to view score</div>
            </div>
          </div>
        )}
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

      {!isSignedIn && (
        <div style={{ ...s.loginHint, color: t.sub2 }}>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowLogin(true)}>
            Sign in
          </span>
          {' '}to save progress & earn tickets
        </div>
      )}

      {triviaTarget && (
        <TriviaModal question={triviaTarget.question} onResult={handleTriviaResult} />
      )}
      <ScoreModal visible={showScore} gameState={gameState} puzzle={puzzle} onClose={() => setShowScore(false)} isSignedIn={isSignedIn} />
      <StatsModal visible={showStats} onClose={() => setShowStats(false)} onViewHole={handleViewHole} isSignedIn={isSignedIn} />
      <ArcadeModal
        visible={showArcade}
        onClose={() => setShowArcade(false)}
        tickets={tickets}
        inventory={inventory}
        powerupsUsed={gameState.powerupsUsed}
        completed={gameState.completed}
        hasFailed={gameState.failedCells.size > 0}
        onBuy={handleBuyPowerup}
        onUse={handleUsePowerup}
        dark={dark}
      />
      <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />
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
  headerRight: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 100 },
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
  loginHint: {
    fontSize: 13, marginTop: 12, marginBottom: 20,
  },
};
