import { Cell, CellType, Puzzle, TriviaQuestion } from './types';
import { createRng, todaySeed } from './seed';
import { solve, solveWithOpenCells } from './solver';
import { pickTriviaQuestions } from './trivia';

// Traditional recursive backtracker maze with 2-cell jumps.
// Grid uses odd indices for passages, even indices for walls.
// This guarantees long winding paths with many dead ends.

const GRID_SIZE = 15; // 15x15 display grid = 7x7 logical maze

export function generatePuzzle(seed?: string): Puzzle {
  const s = seed || todaySeed();
  const rng = createRng(s);

  // Try multiple mazes and pick the best one
  let best: Puzzle | null = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 50; attempt++) {
    const puzzle = buildMaze(rng);
    if (!puzzle) continue;

    // Score: higher par + more dead ends = harder = better
    const score = puzzle.par * 2 + countDeadEnds(puzzle);
    if (score > bestScore) {
      bestScore = score;
      best = puzzle;
    }
  }

  if (best) return placeTriviaWalls(best, rng);

  // Should never happen, but just in case
  return placeTriviaWalls(buildMaze(rng, true)!, rng);
}

function buildMaze(rng: () => number, force = false): Puzzle | null {
  const rows = GRID_SIZE;
  const cols = GRID_SIZE;
  const logicalRows = Math.floor((rows - 1) / 2); // 7
  const logicalCols = Math.floor((cols - 1) / 2); // 7

  // Start with all walls
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: CellType.Wall }))
  );

  // Open all passage cells (odd indices)
  for (let lr = 0; lr < logicalRows; lr++) {
    for (let lc = 0; lc < logicalCols; lc++) {
      grid[lr * 2 + 1][lc * 2 + 1] = { type: CellType.Empty };
    }
  }

  // Recursive backtracker: carve connections between passage cells
  const visited = new Set<string>();
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function carve(lr: number, lc: number) {
    visited.add(`${lr},${lc}`);

    // Shuffle directions
    const shuffled = [...dirs].sort(() => rng() - 0.5);

    for (const [dr, dc] of shuffled) {
      const nlr = lr + dr, nlc = lc + dc;
      if (nlr < 0 || nlr >= logicalRows || nlc < 0 || nlc >= logicalCols) continue;
      if (visited.has(`${nlr},${nlc}`)) continue;

      // Remove wall between current and neighbor
      const wallR = lr * 2 + 1 + dr;
      const wallC = lc * 2 + 1 + dc;
      grid[wallR][wallC] = { type: CellType.Empty };

      carve(nlr, nlc);
    }
  }

  // Start carving from a random corner
  const startCorner = Math.floor(rng() * 4);
  const corners: [number, number][] = [
    [0, 0], [0, logicalCols - 1],
    [logicalRows - 1, 0], [logicalRows - 1, logicalCols - 1],
  ];
  carve(corners[startCorner][0], corners[startCorner][1]);

  // Place start and end at opposite logical corners
  const startIdx = Math.floor(rng() * 4);
  const endIdx = (startIdx + 2) % 4; // opposite corner
  const startLogical = corners[startIdx];
  const endLogical = corners[endIdx];

  const start: [number, number] = [startLogical[0] * 2 + 1, startLogical[1] * 2 + 1];
  const end: [number, number] = [endLogical[0] * 2 + 1, endLogical[1] * 2 + 1];

  grid[start[0]][start[1]] = { type: CellType.Start };
  grid[end[0]][end[1]] = { type: CellType.End };

  // Find all walls between two open cells — these are potential shortcuts/loops
  const bridgeWalls: [number, number][] = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c].type !== CellType.Wall) continue;
      const hOpen = grid[r][c - 1].type !== CellType.Wall && grid[r][c + 1].type !== CellType.Wall;
      const vOpen = grid[r - 1][c].type !== CellType.Wall && grid[r + 1][c].type !== CellType.Wall;
      if (hOpen || vOpen) bridgeWalls.push([r, c]);
    }
  }

  // Shuffle and split: some become loops (open), rest stay as walls (trivia candidates)
  bridgeWalls.sort(() => rng() - 0.5);
  const loopCount = Math.min(Math.floor(rng() * 3) + 2, bridgeWalls.length); // 2-4 loops
  for (let i = 0; i < loopCount; i++) {
    const [wr, wc] = bridgeWalls[i];
    grid[wr][wc] = { type: CellType.Empty };
  }

  const par = solve(grid, start, end, rows, cols);
  if (par === null) return null;

  // Quality filter (relaxed — the maze algorithm naturally produces good puzzles)
  if (!force && par < 20) return null;

  return { grid, rows, cols, start, end, par, triviaQuestions: new Map() };
}

function countDeadEnds(puzzle: Puzzle): number {
  const { grid, rows, cols } = puzzle;
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = grid[r][c].type;
      if (t === CellType.Wall) continue;
      let openAdj = 0;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].type !== CellType.Wall) openAdj++;
      }
      if (openAdj === 1) count++;
    }
  }
  return count;
}

// Place trivia walls ONLY on genuine shortcut positions.
function placeTriviaWalls(puzzle: Puzzle, rng: () => number): Puzzle {
  const { grid, rows, cols, start, end, par } = puzzle;
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  const shortcuts: { r: number; c: number; savings: number }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type !== CellType.Wall) continue;

      // Must have at least 2 adjacent open cells
      let openNeighbors = 0;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].type !== CellType.Wall) {
          openNeighbors++;
        }
      }
      if (openNeighbors < 2) continue;

      const openSet = new Set([`${r},${c}`]);
      const newPar = solveWithOpenCells(grid, start, end, rows, cols, openSet);
      if (newPar !== null && newPar < par) {
        shortcuts.push({ r, c, savings: par - newPar });
      }
    }
  }

  // Sort by savings (best shortcuts first)
  shortcuts.sort((a, b) => b.savings - a.savings);

  // Also find chain pairs
  const chainPairs: { cells: [number, number][]; savings: number }[] = [];
  for (const s of shortcuts) {
    for (const [dr, dc] of dirs) {
      const nr = s.r + dr, nc = s.c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc].type !== CellType.Wall) continue;
      if (nr < s.r || (nr === s.r && nc < s.c)) continue;

      const openSet = new Set([`${s.r},${s.c}`, `${nr},${nc}`]);
      const newPar = solveWithOpenCells(grid, start, end, rows, cols, openSet);
      if (newPar !== null && newPar < par) {
        const chainSavings = par - newPar;
        const otherSingle = shortcuts.find(x => x.r === nr && x.c === nc);
        if (chainSavings > s.savings && (!otherSingle || chainSavings > otherSingle.savings)) {
          chainPairs.push({ cells: [[s.r, s.c], [nr, nc]], savings: chainSavings });
        }
      }
    }
  }

  chainPairs.sort((a, b) => b.savings - a.savings);

  const selected: [number, number][] = [];
  const usedCells = new Set<string>();

  // Place 1 chain if available
  if (chainPairs.length > 0) {
    for (const [r, c] of chainPairs[0].cells) {
      selected.push([r, c]);
      usedCells.add(`${r},${c}`);
    }
  }

  // Fill with individual shortcuts (target 3-5 total)
  const targetCount = Math.floor(rng() * 3) + 3;
  for (const s of shortcuts) {
    if (selected.length >= targetCount) break;
    const key = `${s.r},${s.c}`;
    if (usedCells.has(key)) continue;
    selected.push([s.r, s.c]);
    usedCells.add(key);
  }

  if (selected.length === 0) return puzzle;

  const questions = pickTriviaQuestions(rng, selected.length);
  const triviaQuestions = new Map<string, TriviaQuestion>();

  for (let i = 0; i < selected.length; i++) {
    const [r, c] = selected[i];
    grid[r][c] = { type: CellType.TriviaWall };
    triviaQuestions.set(`${r},${c}`, questions[i]);
  }

  return { ...puzzle, triviaQuestions };
}
