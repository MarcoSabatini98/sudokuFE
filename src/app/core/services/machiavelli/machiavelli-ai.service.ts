import { inject, Injectable } from '@angular/core';

import { Card, Meld, Suit, SUITS } from '../../../shared/models/card.model';
import { GameState } from '../../../shared/models/machiavelli.model';
import { BotDifficulty, MIN_MELD_SIZE } from '../../constants/machiavelli.constants';
import {
  effectiveRank,
  isTableValid,
  isValidMeld,
  isValidRun,
  isValidSet,
  orderMeldCards,
  resolveAceHigh,
  splitRunWithCard,
  MachiavelliEngineService,
} from './machiavelli-engine.service';

interface TurnPlan {
  table: Meld[];
  hand: Card[];
}

interface GreedyResult {
  table: Meld[];
  hand: Card[];
  placedAny: boolean;
}

let meldCounterSeed = 0;
function meldId(): string {
  meldCounterSeed += 1;
  return `m-${Date.now().toString(36)}-${meldCounterSeed}`;
}

const ACE_HIGH = 14;

/**
 * AI a tre livelli:
 * - Facile: estende le combinazioni e ne forma di nuove dalla mano (greedy).
 * - Medio: + riusa i jolly già sul tavolo, rimpiazzandoli con la carta corretta
 *   dalla mano e reimpiegando il jolly liberato.
 * - Difficile: + spezza le scale per calare carte che duplicano un rango interno.
 * In ogni caso il tavolo prodotto è valido e il bot non trattiene carte del tavolo.
 */
@Injectable({ providedIn: 'root' })
export class MachiavelliAiService {
  private readonly engine = inject(MachiavelliEngineService);

  /** Esegue il turno del bot: cala se può, altrimenti pesca. */
  takeTurn(state: GameState, playerIndex: number, difficulty: BotDifficulty = 'easy'): GameState {
    const plan = this.planTurn(state, playerIndex, difficulty);
    if (!plan) return this.engine.drawFromStock(state, playerIndex);

    const next = this.engine.cloneState(state);
    next.table = plan.table.map((m) => ({ id: m.id, cards: orderMeldCards(m.cards) }));
    next.players[playerIndex] = { ...next.players[playerIndex], hand: plan.hand };

    if (plan.hand.length === 0) {
      next.phase = 'won';
      next.winner = playerIndex;
      return next;
    }
    return this.engine.advanceTurn(next);
  }

  planTurn(state: GameState, playerIndex: number, difficulty: BotDifficulty = 'easy'): TurnPlan | null {
    const original = state.players[playerIndex].hand;

    const easy = this.greedyFrom(this.cloneTable(state.table), [...original]);
    const easyPlan = easy.placedAny ? { table: easy.table, hand: easy.hand } : null;
    if (difficulty === 'easy') return easyPlan;

    // Livelli superiori: parti da una copia pulita e applica le tattiche extra
    const table = this.cloneTable(state.table);
    const hand = [...original];

    this.reclaimJokers(table, hand); // medio+
    if (difficulty === 'hard') this.placeBySplitting(table, hand);

    const res = this.greedyFrom(table, hand);

    // Sicurezza: almeno una carta calata, niente carte del tavolo trattenute in mano, tavolo valido
    const handIds = new Set(original.map((c) => c.id));
    const placed = res.hand.length < original.length;
    const handOk = res.hand.every((c) => handIds.has(c.id));
    if (placed && handOk && isTableValid(res.table)) {
      return { table: res.table, hand: res.hand };
    }
    return easyPlan;
  }

  // -- Greedy di base --------------------------------------------------------

  private greedyFrom(table: Meld[], hand: Card[]): GreedyResult {
    let placedAny = false;
    let progress = true;

    // Ripete estensione + formazione finché c'è progresso: così una carta calata
    // (o un jolly liberato) può estendere combinazioni create nello stesso turno.
    while (progress) {
      progress = false;

      for (const meld of table) {
        for (let i = 0; i < hand.length; i++) {
          if (isValidMeld([...meld.cards, hand[i]])) {
            meld.cards.push(hand[i]);
            hand.splice(i, 1);
            progress = true;
            break;
          }
        }
      }

      const set = this.findSet(hand);
      if (set) {
        table.push({ id: meldId(), cards: set });
        this.removeCards(hand, set);
        progress = true;
      }

      const run = this.findRun(hand);
      if (run) {
        table.push({ id: meldId(), cards: run });
        this.removeCards(hand, run);
        progress = true;
      }

      if (progress) placedAny = true;
    }

    return { table, hand, placedAny };
  }

  // -- Medio: riuso dei jolly sul tavolo -------------------------------------

  private reclaimJokers(table: Meld[], hand: Card[]): void {
    for (const meld of table) {
      if (meld.cards.filter((c) => c.isJoker).length !== 1) continue;
      const match = this.jokerMatcher(meld);
      if (!match) continue;

      const i = hand.findIndex(
        (c) => !c.isJoker && c.rank === match.rank && match.suits.includes(c.suit as Suit)
      );
      if (i === -1) continue;

      const natural = hand.splice(i, 1)[0];
      const jIdx = meld.cards.findIndex((c) => c.isJoker);
      const joker = meld.cards[jIdx];
      meld.cards[jIdx] = natural; // la carta corretta sostituisce il jolly
      hand.push(joker); // il jolly liberato torna utilizzabile (verrà ripiazzato dal greedy)
    }
  }

  /** Quale carta (rango + semi ammessi) rappresenta il jolly nella combinazione. */
  private jokerMatcher(meld: Meld): { rank: number; suits: Suit[] } | null {
    const naturals = meld.cards.filter((c) => !c.isJoker);
    if (naturals.length === 0) return null;

    if (isValidSet(meld.cards) && naturals.every((c) => c.rank === naturals[0].rank)) {
      const rank = naturals[0].rank as number;
      const present = new Set(naturals.map((c) => c.suit as Suit));
      const missing = SUITS.filter((s) => !present.has(s));
      return missing.length ? { rank, suits: missing } : null;
    }

    if (isValidRun(meld.cards)) {
      const suit = naturals[0].suit as Suit;
      const aceHigh = resolveAceHigh(meld.cards);

      const ordered = orderMeldCards(meld.cards);
      const anchor = ordered.findIndex((c) => !c.isJoker);
      const start = effectiveRank(ordered[anchor], aceHigh) - anchor;
      const jIdx = ordered.findIndex((c) => c.isJoker);
      if (jIdx === -1) return null;

      const effRank = start + jIdx;
      const rank = effRank === ACE_HIGH ? 1 : effRank;
      if (rank < 1 || rank > 13) return null;
      return { rank, suits: [suit] };
    }

    return null;
  }

  // -- Difficile: spezzamento scale ------------------------------------------

  private placeBySplitting(table: Meld[], hand: Card[]): void {
    let changed = true;
    while (changed) {
      changed = false;
      for (let h = 0; h < hand.length && !changed; h++) {
        for (let t = 0; t < table.length; t++) {
          const split = splitRunWithCard(table[t].cards, hand[h]);
          if (split) {
            table.splice(t, 1, { id: table[t].id, cards: split[0] }, { id: meldId(), cards: split[1] });
            hand.splice(h, 1);
            changed = true;
            break;
          }
        }
      }
    }
  }

  // -- Ricerca combinazioni nella mano ---------------------------------------

  private findSet(hand: Card[]): Card[] | null {
    const jokers = hand.filter((c) => c.isJoker);
    const byRank = new Map<number, Card[]>();
    for (const c of hand) {
      if (c.isJoker) continue;
      const list = byRank.get(c.rank as number) ?? [];
      if (!list.some((x) => x.suit === c.suit)) list.push(c);
      byRank.set(c.rank as number, list);
    }
    for (const cards of byRank.values()) {
      if (cards.length >= MIN_MELD_SIZE) return cards.slice(0, MIN_MELD_SIZE);
      if (cards.length === 2 && jokers.length > 0) {
        const candidate = [...cards, jokers[0]];
        if (isValidSet(candidate)) return candidate;
      }
    }
    return null;
  }

  private findRun(hand: Card[]): Card[] | null {
    const joker = hand.find((c) => c.isJoker) ?? null;
    const bySuit = new Map<Suit, Map<number, Card>>();
    for (const c of hand) {
      if (c.isJoker) continue;
      const byRank = bySuit.get(c.suit as Suit) ?? new Map<number, Card>();
      if (!byRank.has(c.rank as number)) byRank.set(c.rank as number, c);
      bySuit.set(c.suit as Suit, byRank);
    }
    for (const byRank of bySuit.values()) {
      const run = this.bestRunInSuit(byRank, joker);
      if (run) return run;
    }
    return null;
  }

  /** Migliore scala in un seme, considerando asso basso e asso alto (Q-K-A). */
  private bestRunInSuit(byRank: Map<number, Card>, joker: Card | null): Card[] | null {
    const base = [...byRank.keys()].sort((a, b) => a - b);
    const views = [base];
    if (byRank.has(1)) {
      views.push([...base.filter((r) => r !== 1), ACE_HIGH].sort((a, b) => a - b)); // asso alto
    }
    let best: Card[] | null = null;
    for (const ranks of views) {
      const run = this.scanRun(ranks, byRank, joker);
      if (run && (!best || run.length > best.length)) best = run;
    }
    return best;
  }

  /**
   * Scorre i ranghi (già ordinati) di un seme e costruisce la scala più lunga,
   * usando al massimo un jolly per colmare un singolo buco. ACE_HIGH (14) mappa
   * sulla carta dell'asso.
   */
  private scanRun(ranks: number[], byRank: Map<number, Card>, joker: Card | null): Card[] | null {
    const cardAt = (r: number) => byRank.get(r === ACE_HIGH ? 1 : r) as Card;
    let best: Card[] | null = null;
    for (let i = 0; i < ranks.length; i++) {
      const seq: Card[] = [cardAt(ranks[i])];
      let jokerUsed = false;
      let prev = ranks[i];
      for (let j = i + 1; j < ranks.length; j++) {
        const gap = ranks[j] - prev;
        if (gap === 1) {
          seq.push(cardAt(ranks[j]));
        } else if (gap === 2 && joker && !jokerUsed) {
          jokerUsed = true;
          seq.push(joker, cardAt(ranks[j]));
        } else {
          break;
        }
        prev = ranks[j];
      }
      if (seq.length >= MIN_MELD_SIZE && (!best || seq.length > best.length)) best = seq;
    }
    return best;
  }

  private cloneTable(table: Meld[]): Meld[] {
    return table.map((m) => ({ id: m.id, cards: [...m.cards] }));
  }

  private removeCards(hand: Card[], toRemove: Card[]): void {
    for (const card of toRemove) {
      const idx = hand.findIndex((c) => c.id === card.id);
      if (idx !== -1) hand.splice(idx, 1);
    }
  }
}
