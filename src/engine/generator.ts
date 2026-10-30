import { Cell, CellType, Puzzle, TriviaQuestion } from './types';
import { createRng, todaySeed } from './seed';
import { solve, solvePath, solveWithOpenCells, solveWithFeatures } from './solver';
import { pickTriviaQuestions } from './trivia';

const DEFAULT_GRID_SIZE = 15;

export function generatePuzzle(seed?: string, gridSize?: number): Puzzle {
  const s = seed || todaySeed();
  const rng = createRng(s);
  const size = gridSize || DEFAULT_GRID_SIZE;
  // Smaller grids need lower par threshold
  const minPar = size <= 11 ? 10 : size <= 13 ? 14 : 20;

  let best: Puzzle | null = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 50; attempt++) {
    const puzzle = buildMaze(rng, false, size, minPar);
    if (!puzzle) continue;
    const score = puzzle.par * 2 + countDeadEnds(puzzle);
    if (score > bestScore) {
      bestScore = score;
      best = puzzle;
    }
  }

  if (best) {
    const withTrivia = placeTriviaWalls(best, rng);
    return placeSpecialTiles(withTrivia, rng);
  }

  const fallback = placeTriviaWalls(buildMaze(rng, true, size, 0)!, rng);
  return placeSpecialTiles(fallback, rng);
}

function buildMaze(rng: () => number, force = false, gridSize = DEFAULT_GRID_SIZE, minPar = 20): Puzzle | null {
  const rows = gridSize;
  const cols = gridSize;
  const logicalRows = Math.floor((rows - 1) / 2);
  const logicalCols = Math.floor((cols - 1) / 2);

  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: CellType.Wall }))
  );

  for (let lr = 0; lr < logicalRows; lr++) {
    for (let lc = 0; lc < logicalCols; lc++) {
      grid[lr * 2 + 1][lc * 2 + 1] = { type: CellType.Empty };
    }
  }

  const visited = new Set<string>();
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function carve(lr: number, lc: number) {
    visited.add(`${lr},${lc}`);
    const shuffled = [...dirs].sort(() => rng() - 0.5);
    for (const [dr, dc] of shuffled) {
      const nlr = lr + dr, nlc = lc + dc;
      if (nlr < 0 || nlr >= logicalRows || nlc < 0 || nlc >= logicalCols) continue;
      if (visited.has(`${nlr},${nlc}`)) continue;
      grid[lr * 2 + 1 + dr][lc * 2 + 1 + dc] = { type: CellType.Empty };
      carve(nlr, nlc);
    }
  }

  const startCorner = Math.floor(rng() * 4);
  const corners: [number, number][] = [
    [0, 0], [0, logicalCols - 1],
    [logicalRows - 1, 0], [logicalRows - 1, logicalCols - 1],
  ];
  carve(corners[startCorner][0], corners[startCorner][1]);

  const startIdx = Math.floor(rng() * 4);
  const endIdx = (startIdx + 2) % 4;
  const start: [number, number] = [corners[startIdx][0] * 2 + 1, corners[startIdx][1] * 2 + 1];
  const end: [number, number] = [corners[endIdx][0] * 2 + 1, corners[endIdx][1] * 2 + 1];

  grid[start[0]][start[1]] = { type: CellType.Start };
  grid[end[0]][end[1]] = { type: CellType.End };

  const bridgeWalls: [number, number][] = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c].type !== CellType.Wall) continue;
      const hOpen = grid[r][c - 1].type !== CellType.Wall && grid[r][c + 1].type !== CellType.Wall;
      const vOpen = grid[r - 1][c].type !== CellType.Wall && grid[r + 1][c].type !== CellType.Wall;
      if (hOpen || vOpen) bridgeWalls.push([r, c]);
    }
  }

  bridgeWalls.sort(() => rng() - 0.5);
  const loopCount = Math.min(Math.floor(rng() * 3) + 2, bridgeWalls.length);
  for (let i = 0; i < loopCount; i++) {
    const [wr, wc] = bridgeWalls[i];
    grid[wr][wc] = { type: CellType.Empty };
  }

  const par = solve(grid, start, end, rows, cols);
  if (par === null) return null;
  if (!force && par < minPar) return null;

  return { grid, rows, cols, start, end, par, triviaQuestions: new Map(), checkpoints: [] };
}

function countDeadEnds(puzzle: Puzzle): number {
  const { grid, rows, cols } = puzzle;
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === CellType.Wall) continue;
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

function placeTriviaWalls(puzzle: Puzzle, rng: () => number): Puzzle {
  const { grid, rows, cols, start, end, par } = puzzle;
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  const shortcuts: { r: number; c: number; savings: number }[] = [];
  // Minimum distance from start/end for trivia placement — prevents trivial shortcuts
  const minDistFromEdge = Math.floor(Math.min(rows, cols) * 0.25);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type !== CellType.Wall) continue;
      // Skip walls too close to start or end
      const distStart = Math.abs(r - start[0]) + Math.abs(c - start[1]);
      const distEnd = Math.abs(r - end[0]) + Math.abs(c - end[1]);
      if (distStart < minDistFromEdge || distEnd < minDistFromEdge) continue;
      let openNeighbors = 0;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].type !== CellType.Wall) openNeighbors++;
      }
      if (openNeighbors < 2) continue;
      const openSet = new Set([`${r},${c}`]);
      const newPar = solveWithOpenCells(grid, start, end, rows, cols, openSet);
      if (newPar !== null && newPar < par) {
        shortcuts.push({ r, c, savings: par - newPar });
      }
    }
  }

  shortcuts.sort((a, b) => b.savings - a.savings);

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

  if (chainPairs.length > 0) {
    for (const [r, c] of chainPairs[0].cells) {
      selected.push([r, c]);
      usedCells.add(`${r},${c}`);
    }
  }

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

// Place ice, sand, traps, and checkpoints after trivia walls
function placeSpecialTiles(puzzle: Puzzle, rng: () => number): Puzzle {
  const { grid, rows, cols, start, end } = puzzle;
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // Find all empty cells (not start/end/wall/trivia)
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === CellType.Empty) emptyCells.push([r, c]);
    }
  }

  // Get optimal path for placement decisions
  const optPath = solvePath(grid, start, end, rows, cols);
  const pathSet = new Set(optPath?.map(([r, c]) => `${r},${c}`) || []);
  const offPath = emptyCells.filter(([r, c]) => !pathSet.has(`${r},${c}`));

  // --- CHECKPOINTS (2, near optimal path but not on it — small detours, not dead ends) ---
  const checkpoints: [number, number][] = [];

  // Score off-path cells by distance to the optimal path — prefer cells 1-3 steps off
  const offPathScored = offPath
    .filter(([r, c]) => grid[r][c].type === CellType.Empty)
    .map(([r, c]) => {
      // Manhattan distance to nearest path cell
      let minDist = Infinity;
      for (const pk of pathSet) {
        const [pr, pc] = pk.split(',').map(Number);
        const d = Math.abs(r - pr) + Math.abs(c - pc);
        if (d < minDist) minDist = d;
      }
      return { r, c, dist: minDist };
    })
    .filter(({ r, c, dist }) => {
      if (dist > 4) return false; // too far — would create huge detour
      const nearStart = Math.abs(r - start[0]) + Math.abs(c - start[1]) < 3;
      const nearEnd = Math.abs(r - end[0]) + Math.abs(c - end[1]) < 3;
      if (nearStart || nearEnd) return false;
      // Must have at least 2 open neighbors (not a dead end)
      let openN = 0;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].type !== CellType.Wall) openN++;
      }
      return openN >= 2;
    })
    .sort((a, b) => {
      // Prefer 1-2 steps off path, with some randomness
      const scoreA = Math.abs(a.dist - 2) + rng() * 2;
      const scoreB = Math.abs(b.dist - 2) + rng() * 2;
      return scoreA - scoreB;
    });

  for (const { r, c } of offPathScored) {
    if (checkpoints.length >= 2) break;
    const tooClose = checkpoints.some(([cr, cc]) =>
      Math.abs(cr - r) + Math.abs(cc - c) < 5
    );
    if (tooClose) continue;
    checkpoints.push([r, c]);
    grid[r][c] = { type: CellType.Checkpoint, checkpointIndex: checkpoints.length - 1 };
  }
  const shuffledOff = [...offPath].sort(() => rng() - 0.5);

  // --- ICE PATCHES (find corridors of 3+ empty cells in a line) ---
  const corridors: { cells: [number, number][]; }[] = [];

  // Horizontal corridors
  for (let r = 0; r < rows; r++) {
    let run: [number, number][] = [];
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === CellType.Empty) {
        run.push([r, c]);
      } else {
        if (run.length >= 3) corridors.push({ cells: [...run] });
        run = [];
      }
    }
    if (run.length >= 3) corridors.push({ cells: [...run] });
  }

  // Vertical corridors
  for (let c = 0; c < cols; c++) {
    let run: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      if (grid[r][c].type === CellType.Empty) {
        run.push([r, c]);
      } else {
        if (run.length >= 3) corridors.push({ cells: [...run] });
        run = [];
      }
    }
    if (run.length >= 3) corridors.push({ cells: [...run] });
  }

  corridors.sort(() => rng() - 0.5);
  let icePatches = 0;
  for (const corridor of corridors) {
    if (icePatches >= 2) break;
    // Ice the middle cells (leave ends as entry/exit)
    const inner = corridor.cells.slice(1, -1);
    if (inner.length < 2) continue;
    let anyUsed = false;
    for (const [ir, ic] of inner) {
      if (grid[ir][ic].type !== CellType.Empty) { anyUsed = true; break; }
    }
    if (anyUsed) continue;
    for (const [ir, ic] of inner) {
      grid[ir][ic] = { type: CellType.Ice };
    }
    icePatches++;
  }

  // --- SAND CELLS (2-3, preferably on the optimal path) ---
  const onPath = emptyCells.filter(([r, c]) =>
    pathSet.has(`${r},${c}`) && grid[r][c].type === CellType.Empty
  );
  const shuffledOnPath = [...onPath].sort(() => rng() - 0.5);
  let sandPlaced = 0;
  const sandTarget = Math.floor(rng() * 2) + 2;
  for (const [r, c] of shuffledOnPath) {
    if (sandPlaced >= sandTarget) break;
    grid[r][c] = { type: CellType.Sand };
    sandPlaced++;
  }

  // --- TRAP CELLS (1-2, visible, off the optimal path) ---
  let trapPlaced = 0;
  const trapTarget = Math.floor(rng() * 2) + 1;
  for (const [r, c] of shuffledOff) {
    if (trapPlaced >= trapTarget) break;
    if (grid[r][c].type !== CellType.Empty) continue;
    let openN = 0;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
        grid[nr][nc].type !== CellType.Wall && grid[nr][nc].type !== CellType.TriviaWall) openN++;
    }
    if (openN < 2) continue;
    grid[r][c] = { type: CellType.Trap };
    trapPlaced++;
  }

  // --- RECALCULATE PAR with features ---
  const basePar = solveWithFeatures(grid, start, end, rows, cols, []);
  let finalCheckpoints = checkpoints;
  let newPar = solveWithFeatures(grid, start, end, rows, cols, checkpoints);

  if (newPar === null || (basePar !== null && newPar > basePar * 1.6)) {
    // Checkpoints inflate par too much or make puzzle unsolvable
    // Try with just 1 checkpoint
    if (checkpoints.length > 1) {
      grid[checkpoints[1][0]][checkpoints[1][1]] = { type: CellType.Empty };
      const oneCp = [checkpoints[0]];
      const onepar = solveWithFeatures(grid, start, end, rows, cols, oneCp);
      if (onepar !== null && (basePar === null || onepar <= basePar * 1.6)) {
        finalCheckpoints = oneCp;
        newPar = onepar;
      } else {
        // Drop all checkpoints
        grid[checkpoints[0][0]][checkpoints[0][1]] = { type: CellType.Empty };
        finalCheckpoints = [];
        newPar = basePar;
      }
    } else {
      // Drop single checkpoint
      if (checkpoints.length > 0) {
        grid[checkpoints[0][0]][checkpoints[0][1]] = { type: CellType.Empty };
      }
      finalCheckpoints = [];
      newPar = basePar;
    }
  }

  return { ...puzzle, par: newPar ?? puzzle.par, checkpoints: finalCheckpoints };
}
