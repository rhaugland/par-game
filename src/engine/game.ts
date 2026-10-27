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
  unlockedCells?: Set<string>
): boolean {
  if (r < 0 || r >= puzzle.rows || c < 0 || c >= puzzle.cols) return false;
  const cellType = puzzle.grid[r][c].type;
  if (cellType === CellType.Wall) return false;
  if (cellType === CellType.TriviaWall && !(unlockedCells?.has(`${r},${c}`))) return false;
  // Can't revisit cells already in the path
  if (path.some(([pr, pc]) => pr === r && pc === c)) return false;
  return true;
}

export function addToPath(
  state: GameState,
  r: number,
  c: number,
  puzzle: Puzzle
): GameState {
  if (state.completed) return state;

  const last = state.path[state.path.length - 1];

  // Allow backtracking — if the cell is the second-to-last in path, pop the last
  if (state.path.length >= 2) {
    const prev = state.path[state.path.length - 2];
    if (prev[0] === r && prev[1] === c) {
      const newPath = state.path.slice(0, -1);
      return { ...state, path: newPath };
    }
  }

  if (!isAdjacent(last, [r, c])) return state;
  if (!canMoveTo(r, c, puzzle, state.path, state.unlockedCells)) return state;

  const newPath: [number, number][] = [...state.path, [r, c]];
  const completed = r === puzzle.end[0] && c === puzzle.end[1];
  const moves = newPath.length - 1; // don't count start cell
  const score = completed ? (moves + state.triviaPenalty) - puzzle.par : null;

  return {
    path: newPath,
    drawing: !completed,
    completed,
    score,
    unlockedCells: state.unlockedCells,
    failedCells: state.failedCells,
    triviaPenalty: state.triviaPenalty,
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

export function getMoves(state: GameState): number {
  return Math.max(0, state.path.length - 1);
}

export function generateShareCard(
  state: GameState,
  puzzle: Puzzle,
  dayNum: number
): string {
  const moves = getMoves(state);
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
        row += '🟢';
      } else if (r === puzzle.end[0] && c === puzzle.end[1]) {
        row += '🏁';
      } else if (cell.type === CellType.Wall || cell.type === CellType.TriviaWall) {
        row += cell.type === CellType.TriviaWall && isPath ? '❓' : '⬛';
      } else if (isPath) {
        row += '🟩';
      } else {
        row += '⬜';
      }
    }
    card += row + '\n';
  }

  return card;
}
