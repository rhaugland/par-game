import { Cell, CellType, Puzzle } from './types';
import { createRng, todaySeed } from './seed';
import { solve } from './solver';

interface GenConfig {
  rows: number;
  cols: number;
  wallDensity: number;
  minPar: number;
  maxPar: number;
}

function getConfig(): GenConfig {
  const day = new Date().getDay();
  if (day === 0 || day === 1) {
    return { rows: 7, cols: 7, wallDensity: 0.30, minPar: 10, maxPar: 18 };
  } else if (day <= 4) {
    return { rows: 8, cols: 8, wallDensity: 0.32, minPar: 14, maxPar: 24 };
  } else {
    return { rows: 9, cols: 9, wallDensity: 0.33, minPar: 18, maxPar: 30 };
  }
}

export function generatePuzzle(seed?: string): Puzzle {
  const s = seed || todaySeed();
  const config = getConfig();
  const rng = createRng(s);

  for (let attempt = 0; attempt < 500; attempt++) {
    const puzzle = tryGenerate(rng, config);
    if (puzzle && puzzle.par >= config.minPar && puzzle.par <= config.maxPar) {
      return puzzle;
    }
  }

  for (let attempt = 0; attempt < 500; attempt++) {
    const puzzle = tryGenerate(rng, config);
    if (puzzle && puzzle.par >= 6) {
      return puzzle;
    }
  }

  return fallbackPuzzle(config);
}

function tryGenerate(rng: () => number, config: GenConfig): Puzzle | null {
  const { rows, cols, wallDensity } = config;
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: CellType.Empty }))
  );

  // Place start and end far apart
  const corners: [number, number][] = [
    [0, 0], [0, cols - 1], [rows - 1, 0], [rows - 1, cols - 1],
  ];
  const startIdx = Math.floor(rng() * 4);
  const endIdx = (startIdx + 2) % 4; // opposite corner
  const start = corners[startIdx] as [number, number];
  const end = corners[endIdx] as [number, number];

  grid[start[0]][start[1]] = { type: CellType.Start };
  grid[end[0]][end[1]] = { type: CellType.End };

  // Place walls — keep a buffer around start and end
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type !== CellType.Empty) continue;
      const distToStart = Math.abs(r - start[0]) + Math.abs(c - start[1]);
      const distToEnd = Math.abs(r - end[0]) + Math.abs(c - end[1]);
      if (distToStart <= 1 || distToEnd <= 1) continue;
      if (rng() < wallDensity) {
        grid[r][c] = { type: CellType.Wall };
      }
    }
  }

  const par = solve(grid, start, end, rows, cols);
  if (par === null) return null;

  return { grid, rows, cols, start, end, par };
}

function fallbackPuzzle(config: GenConfig): Puzzle {
  const { rows, cols } = config;
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: CellType.Empty }))
  );
  grid[0][0] = { type: CellType.Start };
  grid[rows - 1][cols - 1] = { type: CellType.End };
  grid[2][2] = { type: CellType.Wall };
  grid[rows - 3][cols - 3] = { type: CellType.Wall };
  grid[Math.floor(rows / 2)][Math.floor(cols / 2)] = { type: CellType.Wall };

  const start: [number, number] = [0, 0];
  const end: [number, number] = [rows - 1, cols - 1];
  const par = solve(grid, start, end, rows, cols) || (rows + cols - 2);

  return { grid, rows, cols, start, end, par };
}
