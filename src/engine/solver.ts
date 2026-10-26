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
      if (grid[nr][nc].type === CellType.Wall) continue;

      const key = `${nr},${nc}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc, moves + 1]);
      }
    }
  }

  return null;
}
