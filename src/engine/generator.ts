import { Cell, CellType, Puzzle, TriviaQuestion } from './types';
import { createRng, todaySeed } from './seed';
import { solve, solveWithOpenCells } from './solver';
import { pickTriviaQuestions } from './trivia';

interface GenConfig {
  rows: number;
  cols: number;
  minPar: number;
  maxPar: number;
  minRatio: number; // par / manhattan — higher = more deceptive
}

function getConfig(): GenConfig {
  const day = new Date().getDay();
  if (day === 0 || day === 1) {
    return { rows: 9, cols: 9, minPar: 28, maxPar: 50, minRatio: 2.0 };
  } else if (day <= 4) {
    return { rows: 10, cols: 10, minPar: 35, maxPar: 60, minRatio: 2.2 };
  } else {
    // Fri-Sat: brutal
    return { rows: 11, cols: 11, minPar: 42, maxPar: 75, minRatio: 2.5 };
  }
}

export function generatePuzzle(seed?: string): Puzzle {
  const s = seed || todaySeed();
  const config = getConfig();
  const rng = createRng(s);

  // Try maze-carved puzzles (best quality, hardest)
  for (let attempt = 0; attempt < 500; attempt++) {
    const puzzle = generateMazePuzzle(rng, config);
    if (puzzle) return placeTriviaWalls(puzzle, rng);
  }

  // Relax ratio slightly and try again
  const relaxed = { ...config, minRatio: config.minRatio * 0.85 };
  for (let attempt = 0; attempt < 300; attempt++) {
    const puzzle = generateMazePuzzle(rng, relaxed);
    if (puzzle) return placeTriviaWalls(puzzle, rng);
  }

  return placeTriviaWalls(fallbackPuzzle(config, rng), rng);
}

// Start with all walls, carve a single-width maze with no 2x2 opens.
// This produces tight corridors with many dead ends and deceptive paths.
function generateMazePuzzle(rng: () => number, config: GenConfig): Puzzle | null {
  const { rows, cols, minPar, maxPar, minRatio } = config;

  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: CellType.Wall }))
  );

  // Place start and end on opposite sides, away from corners
  let start: [number, number];
  let end: [number, number];
  const side = Math.floor(rng() * 4);
  const margin = 2; // keep away from corners

  if (side === 0) {
    start = [Math.floor(rng() * (rows - margin * 2)) + margin, 0];
    end = [Math.floor(rng() * (rows - margin * 2)) + margin, cols - 1];
  } else if (side === 1) {
    start = [0, Math.floor(rng() * (cols - margin * 2)) + margin];
    end = [rows - 1, Math.floor(rng() * (cols - margin * 2)) + margin];
  } else if (side === 2) {
    start = [Math.floor(rng() * (rows - margin * 2)) + margin, cols - 1];
    end = [Math.floor(rng() * (rows - margin * 2)) + margin, 0];
  } else {
    start = [rows - 1, Math.floor(rng() * (cols - margin * 2)) + margin];
    end = [0, Math.floor(rng() * (cols - margin * 2)) + margin];
  }

  grid[start[0]][start[1]] = { type: CellType.Start };
  grid[end[0]][end[1]] = { type: CellType.End };

  // Iterative DFS to carve maze (avoids stack overflow on large grids)
  const visited = new Set<string>();
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const stack: [number, number][] = [[start[0], start[1]]];
  visited.add(`${start[0]},${start[1]}`);

  while (stack.length > 0) {
    const [cr, cc] = stack[stack.length - 1];
    if (grid[cr][cc].type === CellType.Wall) {
      grid[cr][cc] = { type: CellType.Empty };
    }

    // Get unvisited neighbors that won't create 2x2
    const neighbors: [number, number][] = [];
    for (const [dr, dc] of dirs) {
      const nr = cr + dr, nc = cc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited.has(`${nr},${nc}`)) continue;
      if (wouldCreate2x2(grid, nr, nc, rows, cols)) continue;
      neighbors.push([nr, nc]);
    }

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    // Pick random unvisited neighbor
    const [nr, nc] = neighbors[Math.floor(rng() * neighbors.length)];
    visited.add(`${nr},${nc}`);
    stack.push([nr, nc]);
  }

  // Ensure end is reachable
  if (!visited.has(`${end[0]},${end[1]}`)) {
    grid[end[0]][end[1]] = { type: CellType.End };
    let er = end[0], ec = end[1];
    for (let step = 0; step < rows + cols; step++) {
      const best = dirs
        .map(([dr, dc]) => [er + dr, ec + dc] as [number, number])
        .filter(([r, c]) => r >= 0 && r < rows && c >= 0 && c < cols)
        .sort((a, b) => {
          const aOpen = grid[a[0]][a[1]].type !== CellType.Wall ? 0 : 1;
          const bOpen = grid[b[0]][b[1]].type !== CellType.Wall ? 0 : 1;
          return aOpen - bOpen;
        })[0];
      if (!best) break;
      if (grid[best[0]][best[1]].type !== CellType.Wall) break;
      grid[best[0]][best[1]] = { type: CellType.Empty };
      er = best[0];
      ec = best[1];
    }
  }

  // Add a FEW decoy openings to create wrong-looking shortcuts (traps)
  const decoyCount = Math.floor(rows * cols * 0.04);
  for (let i = 0; i < decoyCount; i++) {
    const r = Math.floor(rng() * (rows - 2)) + 1;
    const c = Math.floor(rng() * (cols - 2)) + 1;
    if (grid[r][c].type === CellType.Wall && !wouldCreate2x2(grid, r, c, rows, cols)) {
      grid[r][c] = { type: CellType.Empty };
    }
  }

  const par = solve(grid, start, end, rows, cols);
  if (par === null) return null;

  const manhattan = Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]);
  const ratio = par / Math.max(manhattan, 1);

  // Count dead ends — more dead ends = harder puzzle
  let deadEnds = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === CellType.Wall || grid[r][c].type === CellType.Start || grid[r][c].type === CellType.End) continue;
      let openAdj = 0;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].type !== CellType.Wall) openAdj++;
      }
      if (openAdj === 1) deadEnds++;
    }
  }

  // Require minimum dead ends for difficulty
  const minDeadEnds = Math.floor(rows * cols * 0.04);

  if (par >= minPar && par <= maxPar && ratio >= minRatio && deadEnds >= minDeadEnds) {
    return { grid, rows, cols, start, end, par, triviaQuestions: new Map() };
  }

  return null;
}

function wouldCreate2x2(grid: Cell[][], r: number, c: number, rows: number, cols: number): boolean {
  const offsets: [number, number][][] = [
    [[-1, 0], [-1, -1], [0, -1]],
    [[-1, 0], [-1, 1], [0, 1]],
    [[1, 0], [1, -1], [0, -1]],
    [[1, 0], [1, 1], [0, 1]],
  ];

  for (const trio of offsets) {
    let allOpen = true;
    for (const [dr, dc] of trio) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) { allOpen = false; break; }
      if (grid[nr][nc].type === CellType.Wall) { allOpen = false; break; }
    }
    if (allOpen) return true;
  }
  return false;
}

function fallbackPuzzle(config: GenConfig, _rng: () => number): Puzzle {
  const { rows, cols } = config;
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: CellType.Empty }))
  );

  const start: [number, number] = [0, 0];
  const end: [number, number] = [rows - 1, cols - 1];
  grid[0][0] = { type: CellType.Start };
  grid[rows - 1][cols - 1] = { type: CellType.End };

  for (let r = 2; r < rows - 2; r += 2) {
    const gapSide = r % 4 === 2 ? 0 : cols - 1;
    for (let c = 0; c < cols; c++) {
      if (c !== gapSide && grid[r][c].type === CellType.Empty) {
        grid[r][c] = { type: CellType.Wall };
      }
    }
  }

  const par = solve(grid, start, end, rows, cols) || (rows + cols - 2);
  return { grid, rows, cols, start, end, par, triviaQuestions: new Map() };
}

// Place trivia walls ONLY on genuine shortcut positions.
// Also find chains: adjacent wall pairs that together create even bigger shortcuts.
function placeTriviaWalls(puzzle: Puzzle, rng: () => number): Puzzle {
  const { grid, rows, cols, start, end, par } = puzzle;
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // Find all walls that create shortcuts individually
  const singleShortcuts: { r: number; c: number; savings: number }[] = [];

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
        singleShortcuts.push({ r, c, savings: par - newPar });
      }
    }
  }

  // Find chain pairs: two adjacent walls that together create a bigger shortcut
  const chainPairs: { cells: [number, number][]; savings: number }[] = [];

  for (const s of singleShortcuts) {
    for (const [dr, dc] of dirs) {
      const nr = s.r + dr, nc = s.c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc].type !== CellType.Wall) continue;
      // Avoid duplicates: only check in one direction
      if (nr < s.r || (nr === s.r && nc < s.c)) continue;

      const openSet = new Set([`${s.r},${s.c}`, `${nr},${nc}`]);
      const newPar = solveWithOpenCells(grid, start, end, rows, cols, openSet);
      if (newPar !== null && newPar < par) {
        const chainSavings = par - newPar;
        // Only interesting if the chain saves MORE than either wall alone
        const otherSingle = singleShortcuts.find(x => x.r === nr && x.c === nc);
        if (chainSavings > s.savings && (!otherSingle || chainSavings > otherSingle.savings)) {
          chainPairs.push({ cells: [[s.r, s.c], [nr, nc]], savings: chainSavings });
        }
      }
    }
  }

  // Sort chains by savings (biggest first)
  chainPairs.sort((a, b) => b.savings - a.savings || rng() - 0.5);

  // Sort singles by savings
  singleShortcuts.sort((a, b) => b.savings - a.savings || rng() - 0.5);

  const selected: [number, number][] = [];
  const usedCells = new Set<string>();

  // Place 1 chain if available (2 adjacent trivia walls = big shortcut if you ace both)
  if (chainPairs.length > 0) {
    const chain = chainPairs[0];
    for (const [r, c] of chain.cells) {
      selected.push([r, c]);
      usedCells.add(`${r},${c}`);
    }
  }

  // Fill remaining with individual shortcuts (target 3-5 total)
  const targetCount = Math.floor(rng() * 3) + 3; // 3-5
  for (const s of singleShortcuts) {
    if (selected.length >= targetCount) break;
    const key = `${s.r},${s.c}`;
    if (usedCells.has(key)) continue;
    selected.push([s.r, s.c]);
    usedCells.add(key);
  }

  // If we have nothing at all, the puzzle has no shortcut opportunities
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
