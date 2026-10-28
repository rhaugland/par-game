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
  };
}

export function isAdjacent(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

function isPassable(type: CellType): boolean {
  return type !== CellType.Wall && type !== CellType.TriviaWall;
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
    moves += puzzle.grid[r][c].type === CellType.Sand ? 2 : 1;
  }
  return moves;
}

export function addToPath(
  state: GameState,
  r: number,
  c: number,
  puzzle: Puzzle
): GameState {
  if (state.completed) return state;

  const last = state.path[state.path.length - 1];

  // Backtracking — if target is second-to-last, pop last
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
      return { ...state, path: newPath, checkpointsVisited: newCpVisited };
    }
  }

  if (!isAdjacent(last, [r, c])) return state;

  // Ice direction lock: if current cell is ice, must continue in entry direction
  if (puzzle.grid[last[0]][last[1]].type === CellType.Ice && state.path.length >= 2) {
    const prev = state.path[state.path.length - 2];
    const slideDir: [number, number] = [last[0] - prev[0], last[1] - prev[1]];
    const nextInSlide: [number, number] = [last[0] + slideDir[0], last[1] + slideDir[1]];

    // Check if can continue sliding
    const canSlide =
      nextInSlide[0] >= 0 && nextInSlide[0] < puzzle.rows &&
      nextInSlide[1] >= 0 && nextInSlide[1] < puzzle.cols &&
      isPassable(puzzle.grid[nextInSlide[0]][nextInSlide[1]].type) &&
      !state.path.some(([pr, pc]) => pr === nextInSlide[0] && pc === nextInSlide[1]);

    if (canSlide) {
      const moveDir: [number, number] = [r - last[0], c - last[1]];
      if (moveDir[0] !== slideDir[0] || moveDir[1] !== slideDir[1]) {
        return state; // Can't change direction on ice
      }
    }
  }

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
      // Keep checkpoints, unlocked cells, etc.
    };
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
      moveCount += puzzle.grid[pr][pc].type === CellType.Sand ? 2 : 1;
    }
    score = (moveCount + state.triviaPenalty + state.trapPenalty) - puzzle.par;
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
  card += `${moves} moves | Par ${puzzle.par}\n\n`;

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
