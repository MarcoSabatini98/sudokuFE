export type CrosswordDirection = 'across' | 'down';

export type CrosswordDifficulty = 'easy' | 'medium' | 'hard';

export const CROSSWORD_DIFFICULTIES: CrosswordDifficulty[] = ['easy', 'medium', 'hard'];

export const CROSSWORD_DIFFICULTY_LABELS: Record<CrosswordDifficulty, string> = {
  easy: 'Facile',
  medium: 'Medio',
  hard: 'Difficile',
};

export interface CrosswordCell {
  /** Lettera soluzione della cella (A-Z). */
  solution: string;
  /** Numero della casella se inizia una definizione, altrimenti null. */
  number: number | null;
}

export interface CrosswordEntry {
  number: number;
  direction: CrosswordDirection;
  row: number;
  col: number;
  length: number;
  clue: string;
  answer: string;
}

export interface Crossword {
  rows: number;
  cols: number;
  /** Griglia ritagliata: null = casella nera. */
  cells: (CrosswordCell | null)[][];
  entries: CrosswordEntry[];
}

export interface CrosswordGameResult {
  difficulty: CrosswordDifficulty;
  time_seconds: number;
}

export interface CrosswordRecord {
  difficulty: CrosswordDifficulty;
  best_time_seconds: number;
}
