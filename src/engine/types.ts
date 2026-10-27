export enum CellType {
  Empty = 0,
  Wall = 1,
  Start = 2,
  End = 3,
  TriviaWall = 4,
}

export interface Cell {
  type: CellType;
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
  triviaQuestions: Map<string, TriviaQuestion>; // "r,c" -> question
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
  unlockedCells: Set<string>; // "r,c" of trivia walls answered correctly
  failedCells: Set<string>; // "r,c" of trivia walls answered wrong
  triviaPenalty: number; // +1 per wrong trivia answer
  powerupsUsed: Record<string, number>; // e.g. { bomb: 1, backspace: 2 }
  bombMode: boolean; // true when selecting a wall to bomb
  parPath: [number, number][] | null; // optimal path to show as ghost
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
