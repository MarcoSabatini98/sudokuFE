import { Difficulty } from './game.model';

export interface Record {
  id: number;
  difficulty: Difficulty;
  best_time_seconds: number;
  game_id: number;
  updated_at: string;
  best_game?: { played_at: string };
}
