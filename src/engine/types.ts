export enum CellType {
  Empty = 0,
  Wall = 1,
  Start = 2,
  End = 3,
}

export interface Cell {
  type: CellType;
}

export interface Puzzle {
  grid: Cell[][];
  rows: number;
  cols: number;
  start: [number, number];
  end: [number, number];
  par: number;
}

export interface GameState {
  path: [number, number][];
  drawing: boolean;
  completed: boolean;
  score: number | null;
}

export interface DailyRecord {
  date: string;
  moves: number;
  par: number;
  score: number;
  completed: boolean;
}
