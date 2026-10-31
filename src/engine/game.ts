import { CellType, Puzzle, GameState } from './types';

export function createGameState(puzzle: Puzzle): GameState {
  return {
    path: [[...puzzle.start]],
    drawing: false,
    completed: false,
    score: null,
    unlockedCells: new Set(),
    failedCells: new Set(),
    triviaPenalty: 0,
    powerupsUsed: {},
    bombMode: false,
    meltMode: false,
    paveMode: false,
    parPath: null,
    checkpointsVisited: new Set(),
    triggeredTraps: new Set(),
    trapPenalty: 0,
    backtrackPenalty: 0,
    triggeredWarps: new Set(),
    warpedTo: null,
  };
}

export function isAdjacent(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

export function canMoveTo(
  r: number,
  c: number,
  puzzle: Puzzle,
  path: [number, number][],
  unlockedCells?: Set<string>,
  checkpointsVisited?: Set<number>
): boolean {
  if (r < 0 || r >= puzzle.rows || c < 0 || c >= puzzle.cols) return false;
  const cellType = puzzle.grid[r][c].type;
  if (cellType === CellType.Wall) return false;
  if (cellType === CellType.TriviaWall && !(unlockedCells?.has(`${r},${c}`))) return false;
  // Can't reach end without all checkpoints
  if (cellType === CellType.End && puzzle.checkpoints.length > 0) {
    const visited = checkpointsVisited || new Set();
    if (visited.size < puzzle.checkpoints.length) return false;
  }
  if (path.some(([pr, pc]) => pr === r && pc === c)) return false;
  return true;
}

export function getMoves(state: GameState, puzzle: Puzzle): number {
  let moves = 0;
  for (let i = 1; i < state.path.length; i++) {
    const [r, c] = state.path[i];
    const t = puzzle.grid[r][c].type;
    if (t === CellType.Ice) moves += 0; // ice is free
    else if (t === CellType.Sand) moves += 2;
    else moves += 1;
  }
  return moves + state.backtrackPenalty;
}

export function addToPath(
  state: GameState,
  r: number,
  c: number,
  puzzle: Puzzle
): GameState {
  if (state.completed) return state;

  const last = state.path[state.path.length - 1];

  // Backtracking — if target is second-to-last, pop last (costs +1 penalty)
  if (state.path.length >= 2) {
    const prev = state.path[state.path.length - 2];
    if (prev[0] === r && prev[1] === c) {
      const newPath = state.path.slice(0, -1);
      // Recalculate checkpoints for shortened path
      const newCpVisited = new Set<number>();
      for (const [pr, pc] of newPath) {
        const cell = puzzle.grid[pr][pc];
        if (cell.type === CellType.Checkpoint && cell.checkpointIndex !== undefined) {
          newCpVisited.add(cell.checkpointIndex);
        }
      }
      return { ...state, path: newPath, checkpointsVisited: newCpVisited, backtrackPenalty: state.backtrackPenalty + 1 };
    }
  }

  if (!isAdjacent(last, [r, c])) return state;

  if (!canMoveTo(r, c, puzzle, state.path, state.unlockedCells, state.checkpointsVisited)) return state;

  // Handle trap — reset to start with penalty
  const cellType = puzzle.grid[r][c].type;
  if (cellType === CellType.Trap && !state.triggeredTraps.has(`${r},${c}`)) {
    const newTriggered = new Set(state.triggeredTraps);
    newTriggered.add(`${r},${c}`);
    return {
      ...state,
      path: [[...puzzle.start]],
      drawing: false,
      triggeredTraps: newTriggered,
      trapPenalty: state.trapPenalty + 2,
      warpedTo: null,
    };
  }

  // Handle warp — teleport to a random empty cell with +1 penalty
  if (cellType === CellType.Warp && !state.triggeredWarps.has(`${r},${c}`)) {
    const newTriggeredWarps = new Set(state.triggeredWarps);
    newTriggeredWarps.add(`${r},${c}`);
    // Find all empty cells not on current path
    const pathSet = new Set(state.path.map(([pr, pc]) => `${pr},${pc}`));
    const candidates: [number, number][] = [];
    for (let wr = 0; wr < puzzle.rows; wr++) {
      for (let wc = 0; wc < puzzle.cols; wc++) {
        const t = puzzle.grid[wr][wc].type;
        if ((t === CellType.Empty || t === CellType.Ice || t === CellType.Sand) &&
            !pathSet.has(`${wr},${wc}`) && !(wr === r && wc === c)) {
          candidates.push([wr, wc]);
        }
      }
    }
    if (candidates.length === 0) {
      // No valid warp destination — just step on it normally
    } else {
      // Deterministic "random" pick based on path length
      const dest = candidates[state.path.length % candidates.length];
      return {
        ...state,
        path: [dest],
        drawing: false,
        triggeredWarps: newTriggeredWarps,
        trapPenalty: state.trapPenalty + 1,
        warpedTo: dest,
      };
    }
  }

  const newPath: [number, number][] = [...state.path, [r, c]];

  // Collect checkpoints
  let newCpVisited = state.checkpointsVisited;
  if (cellType === CellType.Checkpoint && puzzle.grid[r][c].checkpointIndex !== undefined) {
    newCpVisited = new Set(state.checkpointsVisited);
    newCpVisited.add(puzzle.grid[r][c].checkpointIndex!);
  }

  // Check completion
  const allCheckpoints = puzzle.checkpoints.length === 0 || newCpVisited.size >= puzzle.checkpoints.length;
  const completed = r === puzzle.end[0] && c === puzzle.end[1] && allCheckpoints;

  let score: number | null = null;
  if (completed) {
    let moveCount = 0;
    for (let i = 1; i < newPath.length; i++) {
      const [pr, pc] = newPath[i];
      const t = puzzle.grid[pr][pc].type;
      if (t === CellType.Ice) moveCount += 0; // ice is free
      else if (t === CellType.Sand) moveCount += 2;
      else moveCount += 1;
    }
    score = (moveCount + state.backtrackPenalty + state.triviaPenalty + state.trapPenalty) - puzzle.par;
  }

  return {
    path: newPath,
    drawing: !completed,
    completed,
    score,
    unlockedCells: state.unlockedCells,
    failedCells: state.failedCells,
    triviaPenalty: state.triviaPenalty,
    powerupsUsed: state.powerupsUsed,
    bombMode: false,
    meltMode: false,
    paveMode: false,
    parPath: state.parPath,
    checkpointsVisited: newCpVisited,
    triggeredTraps: state.triggeredTraps,
    trapPenalty: state.trapPenalty,
    backtrackPenalty: state.backtrackPenalty,
    triggeredWarps: state.triggeredWarps,
    warpedTo: null,
  };
}

export function getScoreLabel(score: number): string {
  if (score <= -3) return 'Albatross';
  if (score === -2) return 'Eagle';
  if (score === -1) return 'Birdie';
  if (score === 0) return 'Par';
  if (score === 1) return 'Bogey';
  if (score === 2) return 'Double Bogey';
  if (score === 3) return 'Triple Bogey';
  return `+${score}`;
}

export function generateShareCard(
  state: GameState,
  puzzle: Puzzle,
  dayNum: number
): string {
  const moves = getMoves(state, puzzle);
  const score = state.score ?? 0;
  const scoreLabel = getScoreLabel(score);
  const scoreStr = score <= 0 ? `${score}` : `+${score}`;

  let card = `Par #${dayNum} ${scoreStr} (${scoreLabel})\n`;
  card += `${moves} moves | Par ${puzzle.par}\n`;
  card += `par-web.vercel.app\n\n`;

  const pathSet = new Set(state.path.map(([r, c]) => `${r},${c}`));
  for (let r = 0; r < puzzle.rows; r++) {
    let row = '';
    for (let c = 0; c < puzzle.cols; c++) {
      const cell = puzzle.grid[r][c];
      const isPath = pathSet.has(`${r},${c}`);
      if (r === puzzle.start[0] && c === puzzle.start[1]) {
        row += String.fromCodePoint(0x1F7E2); // green circle
      } else if (r === puzzle.end[0] && c === puzzle.end[1]) {
        row += String.fromCodePoint(0x1F3C1); // checkered flag
      } else if (cell.type === CellType.Wall || cell.type === CellType.TriviaWall) {
        row += String.fromCodePoint(0x2B1B); // black square
      } else if (cell.type === CellType.Ice) {
        row += isPath ? String.fromCodePoint(0x1F7E6) : String.fromCodePoint(0x1F7E6); // blue
      } else if (cell.type === CellType.Sand) {
        row += isPath ? String.fromCodePoint(0x1F7E8) : String.fromCodePoint(0x1F7E8); // yellow
      } else if (isPath) {
        row += String.fromCodePoint(0x1F7E9); // green square
      } else {
        row += String.fromCodePoint(0x2B1C); // white square
      }
    }
    card += row + '\n';
  }

  return card;
}
