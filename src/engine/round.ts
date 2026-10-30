export interface HoleResult {
  holeNumber: number; // 1-9
  moves: number;
  par: number;
  score: number; // moves - par (with penalties)
  path: [number, number][];
  seed: string;
  gridSize: number;
}

export interface DailyRound {
  date: string; // "2026-10-30"
  holes: HoleResult[];
  currentHole: number; // which hole the user is currently on
  ended: boolean; // manually ended early
}

export const HOLES_PER_ROUND = 9;

// Grid size per hole: 1-3 small, 4-6 medium, 7-9 large
export function gridSizeForHole(hole: number): number {
  if (hole <= 3) return 11;
  if (hole <= 6) return 13;
  return 15;
}

// Generate a unique seed for each hole of the day
export function holeSeed(daySeed: string, holeNumber: number): string {
  return `${daySeed}-H${holeNumber}`;
}

// Look up a hole result by its number (1-9)
export function getHoleResult(round: DailyRound, holeNum: number): HoleResult | undefined {
  return round.holes.find(h => h.holeNumber === holeNum);
}

// Find the smallest unplayed hole number, or HOLES_PER_ROUND + 1 if all played
export function nextUnplayedHole(round: DailyRound): number {
  const played = new Set(round.holes.map(h => h.holeNumber));
  for (let i = 1; i <= HOLES_PER_ROUND; i++) {
    if (!played.has(i)) return i;
  }
  return HOLES_PER_ROUND + 1;
}

export function totalScore(round: DailyRound): number {
  return round.holes.reduce((sum, h) => sum + h.score, 0);
}

export function totalMoves(round: DailyRound): number {
  return round.holes.reduce((sum, h) => sum + h.moves, 0);
}

export function totalPar(round: DailyRound): number {
  return round.holes.reduce((sum, h) => sum + h.par, 0);
}

export function isRoundComplete(round: DailyRound): boolean {
  return round.ended || round.holes.length >= HOLES_PER_ROUND;
}
