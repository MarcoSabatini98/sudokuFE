export type CrosswordDirection = 'across' | 'down';

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
