import { Cell, CellType } from './types';

const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function isBlocking(type: CellType): boolean {
  return type === CellType.Wall || type === CellType.TriviaWall;
}

// Basic BFS solver (used before special tiles are placed)
export function solve(
  grid: Cell[][],
  start: [number, number],
  end: [number, number],
  rows: number,
  cols: number
): number | null {
  const visited = new Set<string>();
  const queue: [number, number, number][] = [[start[0], start[1], 0]];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c, moves] = queue.shift()!;
    if (r === end[0] && c === end[1]) return moves;

    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (isBlocking(grid[nr][nc].type)) continue;
      const key = `${nr},${nc}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc, moves + 1]);
      }
    }
  }
  return null;
}

// Basic path reconstruction (for par path powerup)
export function solvePath(
  grid: Cell[][],
  start: [number, number],
  end: [number, number],
  rows: number,
  cols: number
): [number, number][] | null {
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: [number, number][] = [[start[0], start[1]]];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === end[0] && c === end[1]) {
      const path: [number, number][] = [];
      let key = `${r},${c}`;
      while (key) {
        const [pr, pc] = key.split(',').map(Number);
        path.unshift([pr, pc]);
        key = parent.get(key)!;
      }
      return path;
    }

    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (isBlocking(grid[nr][nc].type)) continue;
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

// BFS with open cells (for trivia wall placement)
export function solveWithOpenCells(
  grid: Cell[][],
  start: [number, number],
  end: [number, number],
  rows: number,
  cols: number,
  openCells: Set<string>
): number | null {
  const visited = new Set<string>();
  const queue: [number, number, number][] = [[start[0], start[1], 0]];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c, moves] = queue.shift()!;
    if (r === end[0] && c === end[1]) return moves;

    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
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

// Dijkstra solver with ice, sand, traps, and checkpoints.
// Ice costs 0 moves (free slide). Sand costs 2 moves. Traps are avoided.
// End only reachable when all checkpoints visited.
export function solveWithFeatures(
  grid: Cell[][],
  start: [number, number],
  end: [number, number],
  rows: number,
  cols: number,
  checkpoints: [number, number][]
): number | null {
  const numCp = checkpoints.length;
  const fullMask = (1 << numCp) - 1;

  const checkpointAt = new Map<string, number>();
  checkpoints.forEach(([r, c], i) => checkpointAt.set(`${r},${c}`, i));

  const maskCount = fullMask + 1;
  const dist: number[][][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => new Array(maskCount).fill(Infinity))
  );

  let startMask = 0;
  const scp = checkpointAt.get(`${start[0]},${start[1]}`);
  if (scp !== undefined) startMask |= (1 << scp);

  dist[start[0]][start[1]][startMask] = 0;
  const pq: [number, number, number, number][] = [[0, start[0], start[1], startMask]];

  while (pq.length > 0) {
    let minIdx = 0;
    for (let i = 1; i < pq.length; i++) {
      if (pq[i][0] < pq[minIdx][0]) minIdx = i;
    }
    const [cost, r, c, mask] = pq[minIdx];
    pq.splice(minIdx, 1);

    if (r === end[0] && c === end[1] && mask === fullMask) return cost;

    if (cost > dist[r][c][mask]) continue;

    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

      const ct = grid[nr][nc].type;
      if (isBlocking(ct) || ct === CellType.Trap) continue;

      const moveCost = ct === CellType.Ice ? 0 : ct === CellType.Sand ? 2 : 1;
      let newMask = mask;
      const cpIdx = checkpointAt.get(`${nr},${nc}`);
      if (cpIdx !== undefined) newMask |= (1 << cpIdx);

      if (ct === CellType.End && newMask !== fullMask) continue;

      const newCost = cost + moveCost;

      if (newCost < dist[nr][nc][newMask]) {
        dist[nr][nc][newMask] = newCost;
        pq.push([newCost, nr, nc, newMask]);
      }
    }
  }

  return null;
}
