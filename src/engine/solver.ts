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
// State: (row, col, checkpointBitmask, iceDirection)
// Ice direction lock: on ice, must continue in entry direction unless blocked.
// Sand costs 2 moves. Traps are avoided (infinite cost).
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

  // dist[r][c][mask][dirState] where dirState: 0=free, 1-4=locked in DIRS[0-3]
  const maskCount = fullMask + 1;
  const dirCount = 5;
  const dist: number[][][][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () =>
      Array.from({ length: maskCount }, () => new Array(dirCount).fill(Infinity))
    )
  );

  let startMask = 0;
  const scp = checkpointAt.get(`${start[0]},${start[1]}`);
  if (scp !== undefined) startMask |= (1 << scp);

  dist[start[0]][start[1]][startMask][0] = 0;
  // pq: [cost, r, c, mask, iceDir] where iceDir: -1=free, 0-3=DIRS index
  const pq: [number, number, number, number, number][] = [[0, start[0], start[1], startMask, -1]];

  while (pq.length > 0) {
    let minIdx = 0;
    for (let i = 1; i < pq.length; i++) {
      if (pq[i][0] < pq[minIdx][0]) minIdx = i;
    }
    const [cost, r, c, mask, iceDir] = pq[minIdx];
    pq.splice(minIdx, 1);

    if (r === end[0] && c === end[1] && mask === fullMask) return cost;

    const dIdx = iceDir + 1;
    if (cost > dist[r][c][mask][dIdx]) continue;

    // Determine available directions
    let exploreDirs: number[];
    if (iceDir >= 0) {
      // Locked on ice — check if can continue in locked direction
      const [ldr, ldc] = DIRS[iceDir];
      const nr = r + ldr, nc = c + ldc;
      const canContinue = nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
        !isBlocking(grid[nr][nc].type) && grid[nr][nc].type !== CellType.Trap;
      exploreDirs = canContinue ? [iceDir] : [0, 1, 2, 3];
    } else {
      exploreDirs = [0, 1, 2, 3];
    }

    for (const di of exploreDirs) {
      const [dr, dc] = DIRS[di];
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

      const ct = grid[nr][nc].type;
      if (isBlocking(ct) || ct === CellType.Trap) continue;

      const moveCost = ct === CellType.Sand ? 2 : 1;
      let newMask = mask;
      const cpIdx = checkpointAt.get(`${nr},${nc}`);
      if (cpIdx !== undefined) newMask |= (1 << cpIdx);

      if (ct === CellType.End && newMask !== fullMask) continue;

      const newIceDir = ct === CellType.Ice ? di : -1;
      const newCost = cost + moveCost;
      const newDIdx = newIceDir + 1;

      if (newCost < dist[nr][nc][newMask][newDIdx]) {
        dist[nr][nc][newMask][newDIdx] = newCost;
        pq.push([newCost, nr, nc, newMask, newIceDir]);
      }
    }
  }

  return null;
}
