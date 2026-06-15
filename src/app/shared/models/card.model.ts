export type Suit = 'H' | 'D' | 'C' | 'S';

export const SUITS: Suit[] = ['H', 'D', 'C', 'S'];

/** A = 1, J = 11, Q = 12, K = 13 */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export interface Card {
  /** Unique within a game, es. "H7-0" oppure "JOKER-2" */
  id: string;
  suit: Suit | null;
  rank: Rank | null;
  isJoker: boolean;
  /** 0 o 1: a quale dei due mazzi appartiene */
  deckId: number;
}

export interface Meld {
  id: string;
  cards: Card[];
}
