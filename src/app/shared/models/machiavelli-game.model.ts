export interface MachiavelliGameResult {
  won: boolean;
  duration_seconds: number;
}

export interface MachiavelliGame extends MachiavelliGameResult {
  id: number;
  played_at: string;
}

export interface MachiavelliRecord {
  best_time_seconds: number | null;
  best_game: MachiavelliGame | null;
}
