import { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle } from './engine/generator';
import { createGameState, addToPath, getMoves } from './engine/game';
import { solvePathWithFeatures } from './engine/solver';
import { todaySeed } from './engine/seed';
import { Puzzle, GameState, TriviaQuestion, PowerupType, POWERUP_COSTS, POWERUP_LIMITS } from './engine/types';
import { DailyRound, HoleResult, HOLES_PER_ROUND, gridSizeForHole, holeSeed, totalScore, isRoundComplete, getHoleResult, nextUnplayedHole } from './engine/round';
import {
  setLocalTickets, setLocalInventory,
  getLocalTickets, getLocalInventory, syncRecordsFromApi,
  getRound, saveRound, getRoundHistory,
} from './storage';
import { setAuthTokenGetter, buyPowerup as apiBuyPowerup, usePowerupApi, fetchProfile } from './lib/api';
import { useClerkAuth } from './useClerkAuth';
import Grid from './Grid';
import ScoreModal from './ScoreModal';
import StatsModal from './StatsModal';
import TriviaModal from './TriviaModal';
import ArcadeModal from './ArcadeModal';
import LoginModal from './LoginModal';
import LandingPage from './LandingPage';
import HoleSummary from './HoleSummary';
import RoundScorecard from './RoundScorecard';

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
}

const DARK_KEY = 'par_dark_mode';
const LANDING_KEY = 'par_seen_landing';
const PLAYED_KEY = 'par_has_played';
const TIMER_DURATION = 75;
const FIRST_TIMER_DURATION = 120;
const OVERTIME_INTERVAL = 15;

function initRound(date: string): DailyRound {
  return { date, holes: [], currentHole: 1, ended: false };
}

function loadHolePuzzle(daySeed: string, holeNum: number): Puzzle {
  const seed = holeSeed(daySeed, holeNum);
  const size = gridSizeForHole(holeNum);
  return generatePuzzle(seed, size, daySeed, holeNum);
}

export default function App({ clerkEnabled }: { clerkEnabled: boolean }) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showArcade, setShowArcade] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRounds, setShowRounds] = useState(false);
  const [showHoleSummary, setShowHoleSummary] = useState(false);
  const [triviaTarget, setTriviaTarget] = useState<{ r: number; c: number; question: TriviaQuestion } | null>(null);
  const [dark, setDark] = useState(() => localStorage.getItem(DARK_KEY) === '1');
  const [tickets, setTickets] = useState(0);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [trapFlash, setTrapFlash] = useState(false);
  const [warpFlash, setWarpFlash] = useState(false);
  const [showLanding, setShowLanding] = useState(() => !localStorage.getItem(LANDING_KEY));
  const [isFirstPlay] = useState(() => !localStorage.getItem(PLAYED_KEY));

  // Round state
  const [round, setRound] = useState<DailyRound>(() => {
    const seed = todaySeed();
    return getRound(seed) || initRound(seed);
  });
  const [holeNumber, setHoleNumber] = useState(() => {
    const seed = todaySeed();
    const existing = getRound(seed);
    return existing ? existing.currentHole : 1;
  });
  const [lastHoleScore, setLastHoleScore] = useState(0);
  const [lastHoleMoves, setLastHoleMoves] = useState(0);
  const [lastHolePar, setLastHolePar] = useState(0);

  // Timer state
  const [elapsed, setElapsed] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clerkAuth = clerkEnabled ? useClerkAuth() : null; // eslint-disable-line react-hooks/rules-of-hooks
  const isSignedIn = clerkAuth?.isSignedIn ?? false;
  const clerkFirstName = clerkAuth?.firstName ?? null;
  const getToken = clerkAuth?.getToken ?? null;

  const stateRef = useRef<GameState | null>(null);
  stateRef.current = gameState;
  const puzzleRef = useRef<Puzzle | null>(null);
  puzzleRef.current = puzzle;

  useEffect(() => {
    if (getToken) setAuthTokenGetter(getToken);
  }, [getToken]);

  // Track visit for analytics
  useEffect(() => {
    const VISITOR_KEY = 'par_visitor_id';
    let vid = localStorage.getItem(VISITOR_KEY);
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, vid);
    }
    (async () => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = await getToken?.();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch('/api/ping', {
        method: 'POST',
        headers,
        body: JSON.stringify({ visitorId: vid }),
      }).catch(() => {});
    })();
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (isSignedIn) {
      syncRecordsFromApi();
    }
  }, [isSignedIn]);

  const toggleDark = () => {
    setDark(d => {
      const next = !d;
      localStorage.setItem(DARK_KEY, next ? '1' : '0');
      return next;
    });
  };

  // Load the current hole's puzzle
  const loadCurrentHole = useCallback((holeNum: number) => {
    const seed = todaySeed();
    const p = loadHolePuzzle(seed, holeNum);
    setPuzzle(p);
    setGameState(createGameState(p));
    setElapsed(0);
    setTimerStarted(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    const seed = todaySeed();
    const existing = getRound(seed);
    if (existing && isRoundComplete(existing)) {
      // Round is done — show scorecard state, load last hole for display
      const lastHole = existing.holes[existing.holes.length - 1];
      if (lastHole) {
        const p = loadHolePuzzle(seed, lastHole.holeNumber);
        setPuzzle(p);
        setGameState({
          ...createGameState(p),
          path: lastHole.path, drawing: false, completed: true,
          score: lastHole.score, powerupsUsed: {},
        });
      }
    } else {
      const hole = existing ? existing.currentHole : 1;
      loadCurrentHole(hole);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer management
  useEffect(() => {
    if (timerStarted && !gameState?.completed && !triviaTarget) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerStarted, gameState?.completed, triviaTarget]);

  useEffect(() => {
    if (gameState?.completed && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [gameState?.completed]);

  const timerDuration = isFirstPlay && holeNumber === 1 ? FIRST_TIMER_DURATION : TIMER_DURATION;
  const timePenalty = elapsed > timerDuration ? Math.floor((elapsed - timerDuration) / OVERTIME_INTERVAL) : 0;
  const timeLeft = timerDuration - elapsed;

  const handleCellEnter = useCallback((r: number, c: number) => {
    const pz = puzzleRef.current;
    if (!pz) return;
    const gs = stateRef.current;
    if (!gs || gs.completed) return;
    if (!timerStarted) return;

    // Bomb mode
    if (gs.bombMode) {
      if (pz.grid[r][c].type === 1) {
        pz.grid[r][c] = { type: 0 };
        setGameState(s => s ? { ...s, bombMode: false } : s);
      }
      return;
    }

    // Melt ice mode
    if (gs.meltMode) {
      if (pz.grid[r][c].type === 5) {
        pz.grid[r][c] = { type: 0 };
        setGameState(s => s ? { ...s, meltMode: false } : s);
      }
      return;
    }

    // Pave sand mode
    if (gs.paveMode) {
      if (pz.grid[r][c].type === 6) {
        pz.grid[r][c] = { type: 0 };
        setGameState(s => s ? { ...s, paveMode: false } : s);
      }
      return;
    }

    const next = addToPath(gs, r, c, pz);
    if (next !== gs) {
      if (next.warpedTo) {
        setWarpFlash(true);
        setTimeout(() => setWarpFlash(false), 1500);
      } else if (next.trapPenalty > gs.trapPenalty && !next.warpedTo) {
        setTrapFlash(true);
        setTimeout(() => setTrapFlash(false), 1500);
      }

      setGameState(next);
      if (next.completed) {
        const finalScore = (next.score ?? 0) + timePenalty;
        const moves = getMoves(next, pz);
        localStorage.setItem(PLAYED_KEY, '1');

        // Save hole result to round
        const holeResult: HoleResult = {
          holeNumber,
          moves,
          par: pz.par,
          score: finalScore,
          path: next.path,
          seed: holeSeed(todaySeed(), holeNumber),
          gridSize: pz.cols,
        };

        setGameState(prev => prev ? { ...prev, score: finalScore } : prev);

        // Replace if replaying, otherwise append
        const existingIdx = round.holes.findIndex(h => h.holeNumber === holeNumber);
        const newHoles = existingIdx >= 0
          ? round.holes.map((h, i) => i === existingIdx ? holeResult : h)
          : [...round.holes, holeResult];
        const updatedRound: DailyRound = {
          ...round,
          holes: newHoles,
          currentHole: holeNumber,
        };
        setRound(updatedRound);
        saveRound(updatedRound);

        setLastHoleScore(finalScore);
        setLastHoleMoves(moves);
        setLastHolePar(pz.par);

        // Earn tickets per hole (with lifetime performance multiplier)
        const baseEarned = finalScore <= -2 ? 5 : finalScore === -1 ? 3 : finalScore === 0 ? 1 : 0;
        if (baseEarned > 0) {
          // Compute lifetime score vs lifetime par from all rounds
          const history = getRoundHistory();
          let lifetimeScore = 0;
          let lifetimePar = 0;
          for (const r of history) {
            for (const h of r.holes) {
              lifetimeScore += h.moves;
              lifetimePar += h.par;
            }
          }
          // Include current hole
          lifetimeScore += moves;
          lifetimePar += pz.par;

          let multiplier = 1;
          if (lifetimeScore < lifetimePar) multiplier = 2;       // under par lifetime = 2x
          else if (lifetimeScore === lifetimePar) multiplier = 1.5; // at par lifetime = 1.5x

          const earned = Math.round(baseEarned * multiplier);
          setTickets(t => t + earned);
          setLocalTickets(getLocalTickets() + earned);
        }

        setTimeout(() => setShowHoleSummary(true), 400);
      }
    }
  }, [isSignedIn, timePenalty, timerStarted, holeNumber, round]);

  const handleNextHole = useCallback(() => {
    setShowHoleSummary(false);
    // Go to next unplayed hole
    const next = nextUnplayedHole(round);
    if (next <= HOLES_PER_ROUND) {
      setHoleNumber(next);
      loadCurrentHole(next);
    }
  }, [round, loadCurrentHole]);

  const handleEndRound = useCallback(() => {
    setShowHoleSummary(false);
    const endedRound: DailyRound = { ...round, ended: true };
    setRound(endedRound);
    saveRound(endedRound);
    setShowRounds(true);
  }, [round]);

  const handlePlayHole = useCallback((holeNum: number) => {
    setShowRounds(false);
    setHoleNumber(holeNum);
    loadCurrentHole(holeNum);
  }, [loadCurrentHole]);

  const handleTriviaTap = useCallback((_r: number, _c: number, question: TriviaQuestion) => {
    setTriviaTarget({ r: _r, c: _c, question });
  }, []);

  const handleTriviaResult = useCallback((correct: boolean | null) => {
    if (triviaTarget && correct !== null) {
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
        setShowArcade(false);
        break;
      }
      case 'puzzle_retry': {
        setGameState({
          ...createGameState(puzzle),
          unlockedCells: gameState.unlockedCells,
          failedCells: gameState.failedCells,
          triviaPenalty: gameState.triviaPenalty,
          trapPenalty: gameState.trapPenalty,
          triggeredTraps: gameState.triggeredTraps,
          backtrackPenalty: gameState.backtrackPenalty,
          powerupsUsed: newUsed,
        });
        setShowArcade(false);
        break;
      }
      case 'melt_ice': {
        setGameState(s => s ? { ...s, meltMode: true, powerupsUsed: newUsed } : s);
        setShowArcade(false);
        break;
      }
      case 'pave_sand': {
        setGameState(s => s ? { ...s, paveMode: true, powerupsUsed: newUsed } : s);
        setShowArcade(false);
        break;
      }
      case 'par_path': {
        const optPath = solvePathWithFeatures(puzzle.grid, puzzle.start, puzzle.end, puzzle.rows, puzzle.cols, puzzle.checkpoints);
        setGameState(s => s ? { ...s, parPath: optPath, powerupsUsed: newUsed } : s);
        setShowArcade(false);
        break;
      }
      case 'mulligan': {
        // Find completed holes the player can replay
        if (round.holes.length === 0) return;
        // Replay current hole from scratch (re-generates the same puzzle)
        // The old score stays; when they finish, keep the better score
        setGameState(s => {
          if (!s) return s;
          return { ...createGameState(puzzle), powerupsUsed: newUsed };
        });
        setElapsed(0);
        setTimerStarted(false);
        setShowArcade(false);
        break;
      }
      case 'stroke_eraser': {
        // Remove 1 stroke from round total by adjusting the worst hole's score
        if (round.holes.length === 0) return;
        const worstIdx = round.holes.reduce((wi, h, i, arr) => h.score > arr[wi].score ? i : wi, 0);
        const updatedHoles = round.holes.map((h, i) =>
          i === worstIdx ? { ...h, score: h.score - 1 } : h
        );
        const updatedRound = { ...round, holes: updatedHoles };
        setRound(updatedRound);
        saveRound(updatedRound);
        setGameState(s => s ? { ...s, powerupsUsed: newUsed } : s);
        setShowArcade(false);
        break;
      }
      case 'time_freeze': {
        // Add 30 seconds by rolling back elapsed time
        setElapsed(e => Math.max(0, e - 30));
        setGameState(s => s ? { ...s, powerupsUsed: newUsed } : s);
        setShowArcade(false);
        break;
      }
      case 'scout': {
        // Temporarily reveal par path for 3 seconds
        const scoutPath = solvePathWithFeatures(puzzle.grid, puzzle.start, puzzle.end, puzzle.rows, puzzle.cols, puzzle.checkpoints);
        setGameState(s => s ? { ...s, parPath: scoutPath, powerupsUsed: newUsed } : s);
        setShowArcade(false);
        setTimeout(() => {
          setGameState(s => s ? { ...s, parPath: null } : s);
        }, 3000);
        break;
      }
    }
  }, [puzzle, gameState, inventory, isSignedIn, round]);

  if (!puzzle || !gameState) return null;

  if (showLanding) {
    return (
      <LandingPage
        dark={dark}
        onPlay={() => {
          localStorage.setItem(LANDING_KEY, '1');
          setShowLanding(false);
        }}
      />
    );
  }

  const roundComplete = isRoundComplete(round);
  const moves = getMoves(gameState, puzzle);
  const penalties = gameState.triviaPenalty + gameState.trapPenalty + (gameState.completed ? 0 : timePenalty);
  const displayScore = gameState.completed
    ? (gameState.score ?? 0)
    : (moves + penalties) - puzzle.par;
  const diff = displayScore;
  const cumScore = totalScore(round);

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
    <div style={{ ...st.container, background: t.bg }}>
      {/* Header */}
      <div style={st.headerRow}>
        <div style={st.headerLeft}>
          <button style={st.iconBtn} onClick={() => isSignedIn ? undefined : setShowLogin(true)}>
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
          <button style={st.iconBtn} onClick={toggleDark}>
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
        <div style={st.headerCenter}>
          {/* Candy Cigar Studios */}
          <div style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            alignItems: 'center', marginBottom: 6, padding: '6px 0',
          }}>
            {/* Pink haze glow behind text */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -55%)',
              width: 160, height: 28, borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(255,105,180,0.25) 0%, rgba(255,105,180,0.08) 50%, transparent 70%)',
              filter: 'blur(6px)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'relative',
              fontSize: 10, fontWeight: 700, letterSpacing: 3.5,
              color: dark ? '#ccc' : '#555', textTransform: 'uppercase',
            }}>
              candy cigar studios
            </div>
            <div style={{
              position: 'relative',
              fontSize: 8, fontWeight: 500, letterSpacing: 2,
              color: dark ? '#666' : '#bbb', marginTop: 2,
            }}>
              presents
            </div>
          </div>
          <div style={{ ...st.title, color: t.text }}>par puzzle</div>
          <div style={{ ...st.day, color: t.sub }}>
            Hole {Math.min(holeNumber, HOLES_PER_ROUND)} of {HOLES_PER_ROUND}
          </div>
        </div>
        <div style={st.headerRight}>
          <button style={st.iconBtn} onClick={() => setShowArcade(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </button>
          <button style={st.iconBtn} onClick={() => setShowRounds(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="9" y1="4" x2="9" y2="22" />
            </svg>
          </button>
          <button style={st.iconBtn} onClick={() => setShowStats(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="12" width="4" height="9" rx="1" />
              <rect x="10" y="7" width="4" height="14" rx="1" />
              <rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={st.strip}>
        <div style={st.col}>
          <div style={{ ...st.num, color: t.text }}>{puzzle.par}</div>
          <div style={{ ...st.lbl, color: t.sub }}>par</div>
        </div>
        <div style={{ ...st.divider, background: t.divider }} />
        <div style={st.col}>
          <div style={{ ...st.num, color: t.text }}>
            {moves}
            {penalties > 0 ? <span style={{ color: '#ef5350', fontSize: 16 }}> +{penalties}</span> : ''}
          </div>
          <div style={{ ...st.lbl, color: t.sub }}>moves{penalties > 0 ? ' + pen' : ''}</div>
        </div>
        <div style={{ ...st.divider, background: t.divider }} />
        <div style={st.col}>
          <div style={{ ...st.num, color: diff <= 0 ? '#4caf50' : '#ff9800' }}>
            {diff <= 0 ? diff : `+${diff}`}
          </div>
          <div style={{ ...st.lbl, color: t.sub }}>+/-</div>
        </div>
        <div style={{ ...st.divider, background: t.divider }} />
        <div style={st.col}>
          <div style={{
            ...st.num,
            color: !timerStarted ? t.text : timeLeft > 15 ? t.text : timeLeft > 0 ? '#ff9800' : '#ef5350',
            fontSize: 22,
          }}>
            {!timerStarted ? fmtTime(timerDuration) :
              timeLeft > 0 ? fmtTime(timeLeft) :
              `+${fmtTime(Math.abs(timeLeft))}`}
          </div>
          <div style={{ ...st.lbl, color: t.sub }}>time</div>
        </div>
      </div>

      {/* Hole navigation strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8,
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {Array.from({ length: HOLES_PER_ROUND }, (_, i) => {
          const hole = getHoleResult(round, i + 1);
          const played = !!hole;
          const s = hole?.score ?? 0;
          const isCurrent = i + 1 === holeNumber;
          const isNext = !played && i + 1 === nextUnplayedHole(round);
          return (
            <div
              key={i}
              onClick={() => handlePlayHole(i + 1)}
              style={{
                width: 30, height: 30, borderRadius: 7,
                background: played
                  ? s <= -2 ? '#1b5e20' : s === -1 ? '#4caf50' : s === 0 ? '#ff9800' : '#ef5350'
                  : isNext
                    ? (dark ? '#2a3a2a' : '#e8f5e9')
                    : (dark ? '#2a2a2a' : '#f0f0f0'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
                color: played ? '#fff' : (dark ? '#666' : '#999'),
                cursor: 'pointer',
                border: isCurrent ? `2px solid ${dark ? '#fff' : '#1a1a2e'}`
                  : isNext ? '1.5px solid #4caf50' : '1.5px solid transparent',
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 0.1s',
              }}
            >
              {played ? (s <= 0 ? s : `+${s}`) : (i + 1)}
            </div>
          );
        })}
        {round.holes.length > 0 && (
          <div style={{
            fontSize: 12, fontWeight: 600, marginLeft: 6,
            color: cumScore <= 0 ? '#4caf50' : '#ff9800',
          }}>
            {cumScore <= 0 ? cumScore : `+${cumScore}`}
          </div>
        )}
      </div>

      {/* Hints */}
      {!gameState.completed && moves === 0 && !gameState.bombMode && (
        <div style={{ ...st.hint, color: t.sub }}>Draw a path from start to goal</div>
      )}
      {gameState.bombMode && (
        <div style={{ ...st.hint, color: '#ff9800', fontWeight: 600 }}>Tap a wall to destroy it</div>
      )}
      {gameState.meltMode && (
        <div style={{ ...st.hint, color: '#0288d1', fontWeight: 600 }}>Tap an ice tile to melt it</div>
      )}
      {gameState.paveMode && (
        <div style={{ ...st.hint, color: '#e65100', fontWeight: 600 }}>Tap a sand tile to pave it</div>
      )}
      {trapFlash && (
        <div style={{ ...st.hint, color: '#c62828', fontWeight: 600 }}>Trap! Back to start (+2)</div>
      )}
      {warpFlash && (
        <div style={{ ...st.hint, color: '#7b1fa2', fontWeight: 600 }}>Warped! Teleported (+1)</div>
      )}
      {gameState.completed && !showHoleSummary && (
        <div style={{ ...st.hint, color: t.sub }}>
          Completed &middot; <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowScore(true)}>view score</span>
        </div>
      )}

      {/* Grid */}
      <div style={{ ...st.gridWrap, boxShadow: t.gridShadow, position: 'relative' }}>
        <Grid
          puzzle={puzzle}
          gameState={gameState}
          onCellEnter={handleCellEnter}
          onDrawStart={() => setGameState(gs => gs ? { ...gs, drawing: true } : gs)}
          onDrawEnd={() => setGameState(gs => gs ? { ...gs, drawing: false } : gs)}
          onTriviaTap={handleTriviaTap}
        />
        {!timerStarted && !gameState.completed && (
          <div
            onClick={() => setTimerStarted(true)}
            style={{
              position: 'absolute', inset: 0, borderRadius: 12,
              background: dark ? 'rgba(18,18,18,0.7)' : 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              cursor: 'pointer', zIndex: 30,
            }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: 40,
              background: '#1a1a2e', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#fff">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: dark ? '#aaa' : '#666', marginTop: 14, letterSpacing: 2, textTransform: 'uppercase' }}>
              Hole {holeNumber}
            </div>
          </div>
        )}
      </div>

      {/* Round complete overlay */}
      {roundComplete && !showRounds && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 14, color: t.sub2, marginBottom: 12 }}>Round complete!</div>
          <button
            onClick={() => setShowRounds(true)}
            style={{
              background: '#1a1a2e', color: '#fff', border: 'none',
              padding: '12px 32px', borderRadius: 100, fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            View Scorecard
          </button>
        </div>
      )}

      {/* Legend */}
      <div style={st.legend}>
        <span style={{ color: t.sub2, fontSize: 11, lineHeight: 1.6, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
          <b style={{ color: t.text }}>?</b> Trivia
          <span style={{ color: t.sub, margin: '0 3px' }}>&middot;</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0288d1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
            <path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18" />
          </svg>
          <span> = free move</span>
          <span style={{ color: t.sub, margin: '0 3px' }}>&middot;</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
            <path d="M4 20h16M6 16h12M8 12h8" /><circle cx="12" cy="6" r="2" />
          </svg>
          <span> = 2x moves</span>
          <span style={{ color: t.sub, margin: '0 3px' }}>&middot;</span>
          <span style={{ color: '#c62828' }}>!</span> Trap = back to start
          <span style={{ color: t.sub, margin: '0 3px' }}>&middot;</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: 'middle' }}>
            <circle cx="12" cy="12" r="8" stroke="#7b1fa2" strokeWidth="2.5" strokeDasharray="4 3" />
            <circle cx="12" cy="12" r="3" fill="#7b1fa2" />
          </svg>
          <span> Warp = teleport</span>
        </span>
      </div>

      {!isSignedIn && (
        <div style={{ ...st.loginHint, color: t.sub2 }}>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowLogin(true)}>
            Sign in
          </span>
          {' '}to save progress & earn tickets
        </div>
      )}

      {/* Modals */}
      {triviaTarget && (
        <TriviaModal
          question={triviaTarget.question}
          onResult={handleTriviaResult}
          canSkip={
            !localStorage.getItem('par_first_trivia_done') ||
            (inventory['trivia_skip'] || 0) > 0
          }
          onUseSkip={() => {
            const owned = inventory['trivia_skip'] || 0;
            if (owned > 0) {
              const newInv = { ...inventory, trivia_skip: owned - 1 };
              setInventory(newInv);
              if (isSignedIn) {
                import('./lib/api').then(({ usePowerupApi }) =>
                  usePowerupApi('trivia_skip', todaySeed())
                );
              } else {
                setLocalInventory(newInv);
              }
            }
          }}
        />
      )}

      {showHoleSummary && (
        <HoleSummary
          round={round}
          holeNumber={holeNumber}
          holeScore={lastHoleScore}
          holeMoves={lastHoleMoves}
          holePar={lastHolePar}
          dark={dark}
          onNextHole={handleNextHole}
          onEndRound={handleEndRound}
          onGoToHole={(h) => { setShowHoleSummary(false); handlePlayHole(h); }}
        />
      )}

      <ScoreModal visible={showScore} gameState={gameState} puzzle={puzzle} round={round} holeNumber={holeNumber} onClose={() => setShowScore(false)} />
      <StatsModal visible={showStats} onClose={() => setShowStats(false)} currentRound={round} dark={dark} />
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
      <RoundScorecard visible={showRounds} onClose={() => setShowRounds(false)} currentRound={round} dark={dark} onPlayHole={handlePlayHole} />
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
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
  strip: { display: 'flex', alignItems: 'center', margin: '16px 0 12px' },
  col: { textAlign: 'center', padding: '0 16px' },
  num: { fontSize: 24, fontWeight: 300 },
  lbl: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  divider: { width: 1, height: 28 },
  hint: { fontSize: 13, marginBottom: 10, letterSpacing: 0.3, textAlign: 'center' },
  gridWrap: { borderRadius: 12 },
  legend: {
    marginTop: 12, padding: '0 20px',
    textAlign: 'center', lineHeight: 1.8,
  },
  loginHint: {
    fontSize: 13, marginTop: 8, marginBottom: 20,
  },
};
