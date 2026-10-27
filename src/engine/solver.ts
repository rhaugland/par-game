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
      if (cellType === CellType.Wall) continue;
      if (cellType === CellType.TriviaWall && !openCells.has(key)) continue;

      if (!visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc, moves + 1]);
      }
    }
  }

  return null;
}
