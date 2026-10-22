import { Card, Rank, Suit } from '../models/card.model';

/** Carta naturale per i test: id deterministico "<seme><rango>-<deckId>". */
export function card(suit: Suit, rank: Rank, deckId = 0): Card {
  return { id: `${suit}${rank}-${deckId}`, suit, rank, isJoker: false, deckId };
}

/** Jolly per i test: id "JOKER-0-<n>". */
export function joker(n = 0): Card {
  return { id: `JOKER-0-${n}`, suit: null, rank: null, isJoker: true, deckId: 0 };
}

/** Scala di cuori A-2-3-4-5-6 (riusata da più suite). */
export function aceToSixHearts(): Card[] {
  return [1, 2, 3, 4, 5, 6].map((r) => card('H', r as Rank));
}
