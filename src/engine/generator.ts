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
    // "Easy" — still challenging
    return { rows: 8, cols: 8, minPar: 18, maxPar: 30, minRatio: 1.5 };
  } else if (day <= 4) {
    return { rows: 9, cols: 9, minPar: 24, maxPar: 40, minRatio: 1.7 };
  } else {
    // Fri-Sat: brutal
    return { rows: 10, cols: 10, minPar: 30, maxPar: 50, minRatio: 1.8 };
  }
}

export function generatePuzzle(seed?: string): Puzzle {
  const s = seed || todaySeed();
  const config = getConfig();
  const rng = createRng(s);

  // Try maze-carved puzzles first (best quality)
  for (let attempt = 0; attempt < 300; attempt++) {
    const puzzle = generateMazePuzzle(rng, config);
    if (puzzle) return placeTriviaWalls(puzzle, rng);
  }

  // Fallback to corridor-based
  for (let attempt = 0; attempt < 300; attempt++) {
    const puzzle = generateCorridorPuzzle(rng, config);
    if (puzzle) return placeTriviaWalls(puzzle, rng);
  }

  return placeTriviaWalls(fallbackPuzzle(config, rng), rng);
}

// Start with all walls, carve paths — creates natural maze corridors
function generateMazePuzzle(rng: () => number, config: GenConfig): Puzzle | null {
  const { rows, cols, minPar, maxPar, minRatio } = config;

  // Start filled with walls
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: CellType.Wall }))
  );

  // Pick start and end on opposite edges (not corners — harder)
  let start: [number, number];
  let end: [number, number];
  const side = Math.floor(rng() * 4);

  if (side === 0) {
    start = [Math.floor(rng() * rows), 0];
    end = [Math.floor(rng() * rows), cols - 1];
  } else if (side === 1) {
    start = [0, Math.floor(rng() * cols)];
    end = [rows - 1, Math.floor(rng() * cols)];
  } else if (side === 2) {
    start = [Math.floor(rng() * rows), cols - 1];
    end = [Math.floor(rng() * rows), 0];
  } else {
    start = [rows - 1, Math.floor(rng() * cols)];
    end = [0, Math.floor(rng() * cols)];
  }

  grid[start[0]][start[1]] = { type: CellType.Start };
  grid[end[0]][end[1]] = { type: CellType.End };

  // Randomized DFS to carve passages (step by 1, not 2 — denser maze)
  const visited = new Set<string>();
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function carve(r: number, c: number) {
    visited.add(`${r},${c}`);
    grid[r][c] = grid[r][c].type === CellType.Wall ? { type: CellType.Empty } : grid[r][c];

    // Shuffle directions
    const shuffled = dirs.slice().sort(() => rng() - 0.5);

    for (const [dr, dc] of shuffled) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited.has(`${nr},${nc}`)) continue;

      // Don't carve if it would create a 2x2 open area (keeps corridors tight)
      if (wouldCreate2x2(grid, nr, nc, rows, cols)) continue;

      carve(nr, nc);
    }
  }

  carve(start[0], start[1]);

  // Make sure end is reachable — carve toward it if not
  if (grid[end[0]][end[1]].type === CellType.Wall || !visited.has(`${end[0]},${end[1]}`)) {
    grid[end[0]][end[1]] = { type: CellType.End };
    // Carve from end toward nearest open cell
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

  // Punch some extra openings to create alternate (suboptimal) routes
  const openCount = Math.floor(rows * cols * 0.08);
  for (let i = 0; i < openCount; i++) {
    const r = Math.floor(rng() * rows);
    const c = Math.floor(rng() * cols);
    if (grid[r][c].type === CellType.Wall) {
      grid[r][c] = { type: CellType.Empty };
    }
  }

  const par = solve(grid, start, end, rows, cols);
  if (par === null) return null;

  const manhattan = Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]);
  const ratio = par / Math.max(manhattan, 1);

  if (par >= minPar && par <= maxPar && ratio >= minRatio) {
    return { grid, rows, cols, start, end, par, triviaQuestions: new Map() };
  }

  return null;
}

// Alternative: place walls to create forced corridors
function generateCorridorPuzzle(rng: () => number, config: GenConfig): Puzzle | null {
  const { rows, cols, minPar, maxPar, minRatio } = config;
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: CellType.Empty }))
  );

  // Opposite edges
  const start: [number, number] = [0, Math.floor(rng() * cols)];
  const end: [number, number] = [rows - 1, Math.floor(rng() * cols)];

  grid[start[0]][start[1]] = { type: CellType.Start };
  grid[end[0]][end[1]] = { type: CellType.End };

  // Create horizontal wall barriers with gaps, forcing zigzag paths
  const barrierRows: number[] = [];
  for (let r = 2; r < rows - 2; r += 2) {
    if (rng() < 0.7) barrierRows.push(r);
  }

  for (const br of barrierRows) {
    // Fill row with walls
    for (let c = 0; c < cols; c++) {
      if (grid[br][c].type === CellType.Empty) {
        grid[br][c] = { type: CellType.Wall };
      }
    }
    // Punch 1-2 gaps
    const gapCount = rng() < 0.6 ? 1 : 2;
    for (let g = 0; g < gapCount; g++) {
      const gc = Math.floor(rng() * cols);
      grid[br][gc] = { type: CellType.Empty };
    }
  }

  // Add some vertical walls too
  const barrierCols: number[] = [];
  for (let c = 2; c < cols - 2; c += 3) {
    if (rng() < 0.5) barrierCols.push(c);
  }

  for (const bc of barrierCols) {
    const startR = Math.floor(rng() * (rows - 4)) + 1;
    const len = Math.floor(rng() * 4) + 2;
    for (let r = startR; r < Math.min(startR + len, rows - 1); r++) {
      if (grid[r][bc].type === CellType.Empty) {
        grid[r][bc] = { type: CellType.Wall };
      }
    }
  }

  // Scatter extra walls
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type !== CellType.Empty) continue;
      const dist = Math.abs(r - start[0]) + Math.abs(c - start[1]);
      const distEnd = Math.abs(r - end[0]) + Math.abs(c - end[1]);
      if (dist <= 1 || distEnd <= 1) continue;
      if (rng() < 0.12) grid[r][c] = { type: CellType.Wall };
    }
  }

  const par = solve(grid, start, end, rows, cols);
  if (par === null) return null;

  const manhattan = Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]);
  const ratio = par / Math.max(manhattan, 1);

  if (par >= minPar && par <= maxPar && ratio >= minRatio) {
    return { grid, rows, cols, start, end, par, triviaQuestions: new Map() };
  }

  return null;
}

function wouldCreate2x2(grid: Cell[][], r: number, c: number, rows: number, cols: number): boolean {
  // Check if opening (r,c) would create a 2x2 open block
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

  // Create zigzag barriers
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

// Place 2-4 trivia walls. Prioritize walls that create shortcuts (below par),
// but also include walls that just connect to the path network as fallbacks.
// Every puzzle is guaranteed at least 1 trivia wall.
function placeTriviaWalls(puzzle: Puzzle, rng: () => number): Puzzle {
  const { grid, rows, cols, start, end, par } = puzzle;
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  const shortcuts: [number, number, number][] = []; // walls that create shorter paths
  const connectors: [number, number, number][] = []; // walls adjacent to 2+ open cells

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type !== CellType.Wall) continue;

      // Count adjacent open cells
      let openNeighbors = 0;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const t = grid[nr][nc].type;
          if (t !== CellType.Wall) openNeighbors++;
        }
      }
      if (openNeighbors < 2) continue;

      // Test: if this wall were open, what's the new shortest path?
      const openSet = new Set([`${r},${c}`]);
      const newPar = solveWithOpenCells(grid, start, end, rows, cols, openSet);
      if (newPar === null) continue;

      if (newPar < par) {
        shortcuts.push([r, c, newPar]);
      } else {
        connectors.push([r, c, newPar]);
      }
    }
  }

  // Sort shortcuts by savings (biggest first)
  shortcuts.sort((a, b) => a[2] - b[2] || rng() - 0.5);
  // Shuffle connectors
  connectors.sort(() => rng() - 0.5);

  // Pick: prioritize shortcuts, fill with connectors to reach 2-4
  const targetCount = Math.floor(rng() * 3) + 2; // 2-4
  const selected: [number, number, number][] = [];

  // Take shortcuts first (at least 1 if available)
  for (const s of shortcuts) {
    if (selected.length >= targetCount) break;
    selected.push(s);
  }

  // Fill with connectors
  for (const c of connectors) {
    if (selected.length >= targetCount) break;
    selected.push(c);
  }

  // Guarantee at least 1 — if we still have nothing, pick any wall with 1+ open neighbor
  if (selected.length === 0) {
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r][c].type !== CellType.Wall) continue;
        let hasOpen = false;
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].type !== CellType.Wall) {
            hasOpen = true;
            break;
          }
        }
        if (hasOpen) {
          selected.push([r, c, par]);
          break;
        }
      }
      if (selected.length > 0) break;
    }
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
