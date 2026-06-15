import { Rank, Suit } from '../../shared/models/card.model';

export const DECK_COUNT = 2;
export const JOKERS_PER_DECK = 2; // totale 4 jolly
export const PLAYER_COUNT = 4; // 1 umano + 3 bot
export const HAND_SIZE = 13;
export const MIN_MELD_SIZE = 3;

export const HUMAN_NAME = 'Tu';
export const BOT_NAMES = ['Bot Anna', 'Bot Bruno', 'Bot Carla'];

export type BotDifficulty = 'easy' | 'medium' | 'hard';
export const BOT_DIFFICULTIES: BotDifficulty[] = ['easy', 'medium', 'hard'];
export const BOT_DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  easy: 'Facile',
  medium: 'Medio',
  hard: 'Difficile',
};

/** Tempo di "pensiero" del bot per livello (ms): più alto = ragiona più a lungo. */
export const BOT_THINK_DELAY_MS: Record<BotDifficulty, number> = {
  easy: 450,
  medium: 950,
  hard: 1600,
};

/** Ordine semi per "Ordina mano" per seme: rosso/nero alternati per leggibilità. */
export const HAND_SORT_SUIT_ORDER: Suit[] = ['H', 'S', 'D', 'C'];

export const SUIT_SYMBOL: Record<Suit, string> = {
  H: '♥',
  D: '♦',
  C: '♣',
  S: '♠',
};

export const SUIT_COLOR: Record<Suit, 'red' | 'black'> = {
  H: 'red',
  D: 'red',
  C: 'black',
  S: 'black',
};

export const RANK_LABEL: Record<Rank, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};
