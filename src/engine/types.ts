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

export interface GameState {
  path: [number, number][];
  drawing: boolean;
  completed: boolean;
  score: number | null;
  unlockedCells: Set<string>; // "r,c" of trivia walls answered correctly
  failedCells: Set<string>; // "r,c" of trivia walls answered wrong
  triviaPenalty: number; // +1 per wrong trivia answer
}

export interface DailyRecord {
  date: string;
  moves: number;
  par: number;
  score: number;
  completed: boolean;
}
