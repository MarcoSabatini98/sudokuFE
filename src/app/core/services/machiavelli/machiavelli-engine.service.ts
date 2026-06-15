import { Injectable } from '@angular/core';

import { Card, Meld, Rank, Suit, SUITS, RANKS } from '../../../shared/models/card.model';
import { GameState, Player } from '../../../shared/models/machiavelli.model';
import {
  BOT_NAMES,
  DECK_COUNT,
  HAND_SIZE,
  HUMAN_NAME,
  JOKERS_PER_DECK,
  MIN_MELD_SIZE,
  PLAYER_COUNT,
} from '../../constants/machiavelli.constants';

export interface CommitResult {
  ok: boolean;
  error?: string;
  state?: GameState;
}

const ACE_HIGH = 14;

// ---------------------------------------------------------------------------
// Validazione combinazioni (funzioni pure, riusate da engine e AI)
// ---------------------------------------------------------------------------

export const MAX_JOKERS_PER_MELD = 1;

/** Asso alto se la scala contiene il Re ma non il 2. */
export function runIsAceHigh(naturalRanks: number[]): boolean {
  return naturalRanks.includes(1) && naturalRanks.includes(13) && !naturalRanks.includes(2);
}

/** Rango effettivo di una carta in una scala (asso = 14 quando è alto). */
export function effectiveRank(card: Card, aceHigh: boolean): number {
  return card.rank === 1 && aceHigh ? ACE_HIGH : (card.rank as number);
}

/** Tris/Poker: stesso rango, semi distinti, 3 o 4 carte, jolly come jolly. */
export function isValidSet(cards: Card[]): boolean {
  if (cards.length < MIN_MELD_SIZE || cards.length > SUITS.length) return false;

  const naturals = cards.filter((c) => !c.isJoker);
  if (naturals.length === 0) return false;
  if (cards.length - naturals.length > MAX_JOKERS_PER_MELD) return false;

  const rank = naturals[0].rank;
  const suitsSeen = new Set<Suit>();
  for (const c of naturals) {
    if (c.rank !== rank) return false; // ranghi diversi
    if (suitsSeen.has(c.suit as Suit)) return false; // seme ripetuto
    suitsSeen.add(c.suit as Suit);
  }
  // jolly riempiono i semi mancanti: con length <= 4 e naturali distinti è sempre ok
  return true;
}

/** Scala: stesso seme, ranghi consecutivi, jolly come jolly, asso basso o alto. */
export function isValidRun(cards: Card[]): boolean {
  if (cards.length < MIN_MELD_SIZE) return false;

  const naturals = cards.filter((c) => !c.isJoker);
  if (naturals.length === 0) return false;

  const suit = naturals[0].suit;
  if (naturals.some((c) => c.suit !== suit)) return false;

  const jokerCount = cards.length - naturals.length;
  if (jokerCount > MAX_JOKERS_PER_MELD) return false;
  const baseRanks = naturals.map((c) => c.rank as number);

  // Asso ambiguo: prova sia basso (1) sia alto (14)
  const candidates: number[][] = [baseRanks];
  if (baseRanks.includes(1)) {
    candidates.push(baseRanks.map((r) => (r === 1 ? ACE_HIGH : r)));
  }

  return candidates.some((ranks) => runFits(ranks, jokerCount, cards.length));
}

/** Verifica che i ranghi naturali + i jolly formino una finestra di N posizioni consecutive. */
function runFits(naturalRanks: number[], jokerCount: number, total: number): boolean {
  const unique = new Set(naturalRanks);
  if (unique.size !== naturalRanks.length) return false; // rango duplicato nello stesso seme

  const min = Math.min(...naturalRanks);
  const max = Math.max(...naturalRanks);
  const span = max - min + 1;

  if (span > total) return false; // i naturali non entrano in N posizioni
  if (total > ACE_HIGH) return false;
  if (jokerCount < span - naturalRanks.length) return false; // jolly insufficienti a tappare i buchi

  // Esiste una finestra lunga `total` dentro [1..14] che contiene [min..max]?
  const lower = Math.max(1, max - total + 1);
  const upper = Math.min(min, ACE_HIGH - total + 1);
  return lower <= upper;
}

export function isValidMeld(cards: Card[]): boolean {
  return isValidSet(cards) || isValidRun(cards);
}

/**
 * Riordina le carte di una combinazione per la visualizzazione:
 * le scale per rango crescente (asso alto in coda se la scala è verso il K),
 * con i jolly inseriti nei buchi. I tris/poker restano (naturali + jolly).
 */
export function orderMeldCards(cards: Card[]): Card[] {
  const naturals = cards.filter((c) => !c.isJoker);
  const jokers = cards.filter((c) => c.isJoker);
  if (naturals.length <= 1) return [...naturals, ...jokers];

  // Tris/poker: stesso rango → nessun ordinamento utile
  const sameRank = naturals.every((c) => c.rank === naturals[0].rank);
  if (sameRank) return [...naturals, ...jokers];

  // Scala: asso alto se c'è il Re ma non il 2
  const aceHigh = runIsAceHigh(naturals.map((c) => c.rank as number));
  const eff = (c: Card) => effectiveRank(c, aceHigh);

  const sorted = [...naturals].sort((a, b) => eff(a) - eff(b));
  const result: Card[] = [];
  let ji = 0;
  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1) {
      let gap = eff(sorted[i + 1]) - eff(sorted[i]) - 1;
      while (gap > 0 && ji < jokers.length) {
        result.push(jokers[ji++]);
        gap--;
      }
    }
  }
  while (ji < jokers.length) result.push(jokers[ji++]); // jolly di estensione in coda
  return result;
}

/**
 * Spezza una scala inserendo una carta che duplica un rango interno.
 * Es. A-2-3-4-5-6 + 4 → [A-2-3-4] e [4-5-6]. Ritorna le due scale, oppure
 * null se non è uno spezzamento legale (entrambe le metà devono avere ≥3 carte).
 */
export function splitRunWithCard(cards: Card[], card: Card): [Card[], Card[]] | null {
  if (card.isJoker || card.suit === null) return null;
  if (!isValidRun(cards)) return null;

  const naturals = cards.filter((c) => !c.isJoker);
  if (card.suit !== naturals[0].suit) return null;

  const aceHigh = runIsAceHigh(naturals.map((c) => c.rank as number));
  const ordered = orderMeldCards(cards);
  const anchor = ordered.findIndex((c) => !c.isJoker);
  const start = effectiveRank(ordered[anchor], aceHigh) - anchor;
  const end = start + ordered.length - 1;

  const r = effectiveRank(card, aceHigh);
  if (r < start + 2 || r > end - 2) return null; // entrambe le metà devono restare ≥3

  const splitIdx = r - start;
  const left = ordered.slice(0, splitIdx + 1);
  const right = [card, ...ordered.slice(splitIdx + 1)];
  if (left.length < MIN_MELD_SIZE || right.length < MIN_MELD_SIZE) return null;

  return [left, right];
}

/**
 * Divide una scala in segmenti contigui quando rimuovere una carta lascia un buco.
 * Es. togliendo l'8 da 4-5-6-7-8-9-10-J → [4-5-6-7] e [9-10-J].
 * I tris/poker (stesso rango) non vengono mai spezzati. Ritorna ≥1 segmento.
 */
export function splitRunAtGaps(cards: Card[]): Card[][] {
  const naturals = cards.filter((c) => !c.isJoker);
  const jokers = cards.filter((c) => c.isJoker);
  if (naturals.length === 0) return [cards];

  const sameRank = naturals.every((c) => c.rank === naturals[0].rank);
  if (sameRank) return [cards];

  const aceHigh = runIsAceHigh(naturals.map((c) => c.rank as number));
  const eff = (c: Card) => effectiveRank(c, aceHigh);
  const sorted = [...naturals].sort((a, b) => eff(a) - eff(b));

  const jokersLeft = [...jokers];
  const segments: Card[][] = [];
  let cur: Card[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const gap = eff(sorted[i]) - eff(sorted[i - 1]) - 1;
    if (gap === 0) {
      cur.push(sorted[i]);
    } else if (gap >= 1 && jokersLeft.length >= gap) {
      for (let g = 0; g < gap; g++) cur.push(jokersLeft.shift() as Card);
      cur.push(sorted[i]);
    } else {
      segments.push(cur);
      cur = [sorted[i]];
    }
  }
  segments.push(cur);
  while (jokersLeft.length) segments[segments.length - 1].push(jokersLeft.shift() as Card);

  return segments;
}

export function isTableValid(table: Meld[]): boolean {
  return table.every((m) => isValidMeld(m.cards));
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class MachiavelliEngineService {
  /** Crea una nuova partita: mazzo mescolato, mani distribuite, stock col resto. */
  newGame(): GameState {
    const deck = this.shuffle(this.buildDeck());

    const players: Player[] = [];
    for (let i = 0; i < PLAYER_COUNT; i++) {
      players.push({
        id: i,
        name: i === 0 ? HUMAN_NAME : BOT_NAMES[i - 1],
        hand: deck.splice(0, HAND_SIZE),
        isAI: i !== 0,
      });
    }

    return {
      players,
      table: [],
      stock: deck,
      currentPlayer: 0,
      phase: 'playing',
      winner: null,
    };
  }

  buildDeck(): Card[] {
    const cards: Card[] = [];
    for (let deckId = 0; deckId < DECK_COUNT; deckId++) {
      for (const suit of SUITS) {
        for (const rank of RANKS) {
          cards.push({ id: `${suit}${rank}-${deckId}`, suit, rank: rank as Rank, isJoker: false, deckId });
        }
      }
      for (let j = 0; j < JOKERS_PER_DECK; j++) {
        cards.push({ id: `JOKER-${deckId}-${j}`, suit: null, rank: null, isJoker: true, deckId });
      }
    }
    return cards;
  }

  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      [a[i], a[k]] = [a[k], a[i]];
    }
    return a;
  }

  /**
   * Applica il turno dell'umano: nuovo tavolo proposto + mano residua.
   * Verifica conservazione delle carte, almeno una carta calata e tavolo valido.
   */
  commitHumanTurn(state: GameState, newTable: Meld[], newHand: Card[]): CommitResult {
    const human = state.players[0];
    const pool = new Set<string>([
      ...state.table.flatMap((m) => m.cards.map((c) => c.id)),
      ...human.hand.map((c) => c.id),
    ]);

    const tableIds = newTable.flatMap((m) => m.cards.map((c) => c.id));
    const handIds = newHand.map((c) => c.id);
    const allIds = [...tableIds, ...handIds];

    // Conservazione: nessuna carta inventata, persa o duplicata
    if (allIds.length !== pool.size || new Set(allIds).size !== allIds.length) {
      return { ok: false, error: 'Le carte sul tavolo non corrispondono.' };
    }
    if (!allIds.every((id) => pool.has(id))) {
      return { ok: false, error: 'Le carte sul tavolo non corrispondono.' };
    }

    // Non si possono prendere carte dal tavolo e tenerle in mano
    const handIdSet = new Set(human.hand.map((c) => c.id));
    if (!newHand.every((c) => handIdSet.has(c.id))) {
      return { ok: false, error: 'Non puoi tenere in mano carte prese dal tavolo.' };
    }

    // Almeno una carta dalla mano deve essere stata calata
    const placed = tableIds.filter((id) => handIdSet.has(id)).length;
    if (placed < 1) {
      return { ok: false, error: 'Devi calare almeno una carta dalla tua mano.' };
    }

    if (!isTableValid(newTable)) {
      return { ok: false, error: 'Ci sono combinazioni non valide sul tavolo.' };
    }

    const next = this.cloneState(state);
    next.table = newTable.map((m) => ({ id: m.id, cards: orderMeldCards(m.cards) }));
    next.players[0] = { ...human, hand: newHand };

    if (newHand.length === 0) {
      next.phase = 'won';
      next.winner = 0;
      return { ok: true, state: next };
    }

    return { ok: true, state: this.advanceTurn(next) };
  }

  /** Pesca una carta dallo stock per il giocatore indicato e passa il turno. */
  drawFromStock(state: GameState, playerIndex: number): GameState {
    const next = this.cloneState(state);
    const card = next.stock.shift();
    if (card) next.players[playerIndex].hand.push(card);
    return this.advanceTurn(next);
  }

  advanceTurn(state: GameState): GameState {
    if (state.phase === 'won') return state;
    const next = this.cloneState(state);
    next.currentPlayer = (state.currentPlayer + 1) % PLAYER_COUNT;
    return next;
  }

  cloneState(state: GameState): GameState {
    return {
      players: state.players.map((p) => ({ ...p, hand: [...p.hand] })),
      table: state.table.map((m) => ({ id: m.id, cards: [...m.cards] })),
      stock: [...state.stock],
      currentPlayer: state.currentPlayer,
      phase: state.phase,
      winner: state.winner,
    };
  }
}
