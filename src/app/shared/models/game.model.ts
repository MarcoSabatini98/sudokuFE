export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  medium: 'Medio',
  hard: 'Difficile',
  extreme: 'Estremo',
};

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'extreme'];

export interface Game {
  id: number;
  difficulty: Difficulty;
  time_seconds: number;
  completed: boolean;
  played_at: string;
}

export interface SaveGamePayload {
  difficulty: Difficulty;
  time_seconds: number;
  completed: boolean;
}

export interface SudokuPuzzle {
  difficulty: Difficulty;
  puzzle: number[][];
  solution: number[][];
}
