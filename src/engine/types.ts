export enum CellType {
  Empty = 0,
  Wall = 1,
  Start = 2,
  End = 3,
  TriviaWall = 4,
  Ice = 5,
  Sand = 6,
  Trap = 7,
  Checkpoint = 8,
}

export interface Cell {
  type: CellType;
  checkpointIndex?: number;
}

export type TriviaCategory = 'entertainment' | 'world' | 'history' | 'sports' | 'science';

export interface TriviaQuestion {
  category: TriviaCategory;
  question: string;
  choices: string[];
  answer: number; // index into choices
}

export interface Puzzle {
  grid: Cell[][];
  rows: number;
  cols: number;
  start: [number, number];
  end: [number, number];
  par: number;
  triviaQuestions: Map<string, TriviaQuestion>;
  checkpoints: [number, number][];
}

export type PowerupType = 'backspace' | 'trivia_retry' | 'bomb' | 'puzzle_retry' | 'par_path';

export const POWERUP_COSTS: Record<PowerupType, number> = {
  backspace: 1,
  trivia_retry: 2,
  bomb: 3,
  puzzle_retry: 5,
  par_path: 8,
};

export const POWERUP_LIMITS: Record<PowerupType, number> = {
  backspace: 3,
  trivia_retry: 1,
  bomb: 1,
  puzzle_retry: 1,
  par_path: 1,
};

export interface GameState {
  path: [number, number][];
  drawing: boolean;
  completed: boolean;
  score: number | null;
  unlockedCells: Set<string>;
  failedCells: Set<string>;
  triviaPenalty: number;
  powerupsUsed: Record<string, number>;
  bombMode: boolean;
  parPath: [number, number][] | null;
  checkpointsVisited: Set<number>;
  triggeredTraps: Set<string>;
  trapPenalty: number;
}

export interface DailyRecord {
  date: string;
  moves: number;
  par: number;
  score: number;
  completed: boolean;
  path?: [number, number][];
  powerups_used?: Record<string, number>;
}
