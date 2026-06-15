import { Card, Meld } from './card.model';

export interface Player {
  id: number;
  name: string;
  hand: Card[];
  isAI: boolean;
}

export type GamePhase = 'playing' | 'won';

export interface GameState {
  players: Player[];
  table: Meld[];
  stock: Card[];
  /** Indice del giocatore di turno in players[] */
  currentPlayer: number;
  phase: GamePhase;
  /** Indice del vincitore, null finché la partita è in corso */
  winner: number | null;
}
