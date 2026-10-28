import { Cell, CellType } from './types';

export function solve(
  grid: Cell[][],
  start: [number, number],
  end: [number, number],
  rows: number,
  cols: number
): number | null {
  const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const visited = new Set<string>();
  const queue: [number, number, number][] = [[start[0], start[1], 0]];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c, moves] = queue.shift()!;
    if (r === end[0] && c === end[1]) return moves;

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc].type === CellType.Wall || grid[nr][nc].type === CellType.TriviaWall) continue;

      const key = `${nr},${nc}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc, moves + 1]);
      }
    }
  }

  return null;
}

// Returns the actual optimal path (for par path powerup)
export function solvePath(
  grid: Cell[][],
  start: [number, number],
  end: [number, number],
  rows: number,
  cols: number
): [number, number][] | null {
  const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: [number, number][] = [[start[0], start[1]]];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === end[0] && c === end[1]) {
      // Reconstruct path
      const path: [number, number][] = [];
      let key = `${r},${c}`;
      while (key) {
        const [pr, pc] = key.split(',').map(Number);
        path.unshift([pr, pc]);
        key = parent.get(key)!;
      }
      return path;
    }

    for (const [dr, dc] of directions) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc].type === CellType.Wall || grid[nr][nc].type === CellType.TriviaWall) continue;
      const key = `${nr},${nc}`;
      if (!visited.has(key)) {
        visited.add(key);
        parent.set(key, `${r},${c}`);
        queue.push([nr, nc]);
      }
    }
  }

  return null;
}

export function solveWithOpenCells(
  grid: Cell[][],
  start: [number, number],
  end: [number, number],
  rows: number,
  cols: number,
  openCells: Set<string>
): number | null {
  const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const visited = new Set<string>();
  const queue: [number, number, number][] = [[start[0], start[1], 0]];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c, moves] = queue.shift()!;
    if (r === end[0] && c === end[1]) return moves;

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const key = `${nr},${nc}`;
      const cellType = grid[nr][nc].type;
      if (cellType === CellType.Wall && !openCells.has(key)) continue;
      if (cellType === CellType.TriviaWall && !openCells.has(key)) continue;

      if (!visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc, moves + 1]);
      }
    }
  }

  return null;
}
