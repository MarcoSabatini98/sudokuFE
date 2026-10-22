import { BotDifficulty } from '../../core/constants/machiavelli.constants';

export interface MachiavelliGameResult {
  won: boolean;
  duration_seconds: number;
  bot_difficulty: BotDifficulty;
}

export interface MachiavelliGame extends MachiavelliGameResult {
  id: number;
  played_at: string;
}

/** Miglior tempo di vittoria per una difficoltà bot. */
export interface MachiavelliRecord {
  bot_difficulty: BotDifficulty;
  best_time_seconds: number;
}
