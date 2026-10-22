import { Injectable } from '@angular/core';

import { Card, SUITS } from '../../../shared/models/card.model';
import { MIN_MELD_SIZE } from '../../constants/machiavelli.constants';
import { isValidMeld } from './machiavelli-engine.service';

const ACE_HIGH = 14;
const MAX_RUN = 13;

interface Slot {
  card: Card;
  hand: boolean;
}

/**
 * Solver di riarrangiamento del tavolo (stile Rummikub): dato tutto il tavolo +
 * la mano, cerca una ripartizione valida che usi TUTTE le carte del tavolo e il
 * massimo numero di carte della mano (≥1). Backtracking a copertura con MRV e
 * budget di tempo; ogni combinazione è validata dall'engine. Se non trova nulla
 * (≥1 carta calata) ritorna null e il chiamante ripiega sull'euristica.
 */
@Injectable({ providedIn: 'root' })
export class MachiavelliSolverService {
  solve(tableCards: Card[], hand: Card[], budgetMs: number): { melds: Card[][] } | null {
    if (budgetMs <= 0) return null;
    const slots: Slot[] = [
      ...tableCards.map((card) => ({ card, hand: false })),
      ...hand.map((card) => ({ card, hand: true })),
    ];
    const used = new Array(slots.length).fill(false);
    const tableIdx = slots.map((_, i) => i).filter((i) => !slots[i].hand);
    const deadline = Date.now() + budgetMs;

    const ctx = { slots, used, deadline };

    // Pre-check: se nessuna carta della mano entra in alcuna combinazione possibile,
    // non c'è niente da calare → esci subito (evita di esaurire il budget pescando).
    if (!this.anyHandPlaceable(ctx)) return null;
    const chosen: number[][] = [];
    let best: number[][] | null = null;
    let bestHand = 0;

    const handCount = (melds: number[][]) => melds.flat().filter((i) => slots[i].hand).length;

    const onComplete = () => {
      const extra = this.greedyHandMelds(ctx);
      const total = handCount(chosen) + handCount(extra);
      if (total > bestHand) {
        bestHand = total;
        best = [...chosen.map((m) => [...m]), ...extra];
      }
      for (const m of extra) for (const j of m) used[j] = false; // ripristina
    };

    const dfs = (coveredTable: number): void => {
      if (Date.now() > deadline) return;
      if (coveredTable === tableIdx.length) {
        onComplete();
        return;
      }
      const pick = this.pickUncovered(ctx, tableIdx);
      if (!pick || pick.melds.length === 0) return; // carta del tavolo non copribile

      for (const meld of pick.melds) {
        for (const j of meld) used[j] = true;
        chosen.push(meld);
        dfs(coveredTable + meld.filter((j) => !slots[j].hand).length);
        chosen.pop();
        for (const j of meld) used[j] = false;
        if (Date.now() > deadline) return;
      }
    };

    dfs(0);
    if (!best || bestHand < 1) return null;
    return { melds: (best as number[][]).map((m) => m.map((i) => slots[i].card)) };
  }

  /** Almeno una carta della mano può entrare in una combinazione (col pool iniziale). */
  private anyHandPlaceable(ctx: SolveCtx): boolean {
    for (let i = 0; i < ctx.slots.length; i++) {
      if (ctx.slots[i].hand && this.meldsForIndex(ctx, i).length > 0) return true;
    }
    return false;
  }

  /** Carta del tavolo ancora scoperta con meno opzioni di meld (MRV). */
  private pickUncovered(ctx: SolveCtx, tableIdx: number[]): { idx: number; melds: number[][] } | null {
    let bestPick: { idx: number; melds: number[][] } | null = null;
    for (const i of tableIdx) {
      if (ctx.used[i]) continue;
      const melds = this.meldsForIndex(ctx, i);
      if (!bestPick || melds.length < bestPick.melds.length) {
        bestPick = { idx: i, melds };
        if (melds.length === 0) break;
      }
    }
    return bestPick;
  }

  /** Tutte le combinazioni valide (insiemi di indici) che contengono lo slot i. */
  private meldsForIndex(ctx: SolveCtx, i: number): number[][] {
    const out = new Map<string, number[]>();
    const add = (idxs: number[]) => {
      if (idxs.length < MIN_MELD_SIZE) return;
      if (!isValidMeld(idxs.map((x) => ctx.slots[x].card))) return;
      const key = [...idxs].sort((a, b) => a - b).join(',');
      if (!out.has(key)) out.set(key, idxs);
    };
    if (ctx.slots[i].card.isJoker) this.jokerMelds(ctx, i, add);
    else {
      this.runsForNatural(ctx, i, add);
      this.setsForNatural(ctx, i, add);
    }
    return [...out.values()];
  }

  // -- Scale e tris attorno a una carta naturale ------------------------------

  private runsForNatural(ctx: SolveCtx, i: number, add: (idxs: number[]) => void): void {
    const { suit, rank } = ctx.slots[i].card;
    const effs = rank === 1 ? [1, ACE_HIGH] : [rank as number];
    for (const eff of effs) {
      for (let start = Math.max(1, eff - MAX_RUN + 1); start <= eff; start++) {
        for (let end = eff; end <= ACE_HIGH && end - start + 1 <= MAX_RUN; end++) {
          if (end - start + 1 < MIN_MELD_SIZE) continue;
          const run = this.buildRun(ctx, suit as string, start, end, eff, i);
          if (run) add(run);
        }
      }
    }
  }

  private buildRun(ctx: SolveCtx, suit: string, start: number, end: number, effPos: number, iIdx: number): number[] | null {
    const idxs: number[] = [];
    const here = new Set<number>([iIdx]);
    let jokerUsed = false;
    for (let e = start; e <= end; e++) {
      if (e === effPos) {
        idxs.push(iIdx);
        continue;
      }
      const nat = this.findNatural(ctx, suit, e === ACE_HIGH ? 1 : e, here);
      if (nat !== -1) {
        idxs.push(nat);
        here.add(nat);
      } else if (!jokerUsed) {
        const j = this.firstJoker(ctx, here);
        if (j === -1) return null;
        idxs.push(j);
        here.add(j);
        jokerUsed = true;
      } else {
        return null;
      }
    }
    return idxs;
  }

  private setsForNatural(ctx: SolveCtx, i: number, add: (idxs: number[]) => void): void {
    const rank = ctx.slots[i].card.rank as number;
    const here = new Set<number>([i]);
    const others: number[] = [];
    for (const su of SUITS) {
      if (su === ctx.slots[i].card.suit) continue;
      const idx = this.findNatural(ctx, su, rank, here);
      if (idx !== -1) others.push(idx);
    }
    const joker = this.firstJoker(ctx, here);
    for (const sub of subsetsUpTo(others, 3)) {
      if (sub.length >= 2) add([i, ...sub]);
      if (joker !== -1 && sub.length >= 1 && sub.length <= 2) add([i, ...sub, joker]);
    }
  }

  // -- Combinazioni che impiegano un jolly del tavolo (deve essere ricollocato) -

  private jokerMelds(ctx: SolveCtx, jIdx: number, add: (idxs: number[]) => void): void {
    for (const suit of SUITS) {
      for (let start = 1; start <= ACE_HIGH; start++) {
        for (let end = start + MIN_MELD_SIZE - 1; end <= ACE_HIGH; end++) {
          this.runsWithJokerAt(ctx, suit, start, end, jIdx, add);
        }
      }
    }
    for (let rank = 1; rank <= 13; rank++) {
      const here = new Set<number>([jIdx]);
      const naturals: number[] = [];
      for (const su of SUITS) {
        const idx = this.findNatural(ctx, su, rank, here);
        if (idx !== -1) naturals.push(idx);
      }
      for (const sub of subsetsUpTo(naturals, 3)) {
        if (sub.length >= 2) add([...sub, jIdx]);
      }
    }
  }

  private runsWithJokerAt(ctx: SolveCtx, suit: string, start: number, end: number, jIdx: number, add: (idxs: number[]) => void): void {
    for (let p = start; p <= end; p++) {
      const idxs: number[] = [];
      const here = new Set<number>([jIdx]);
      let ok = true;
      for (let e = start; e <= end; e++) {
        if (e === p) {
          idxs.push(jIdx);
          continue;
        }
        const nat = this.findNatural(ctx, suit, e === ACE_HIGH ? 1 : e, here);
        if (nat === -1) {
          ok = false;
          break;
        }
        idxs.push(nat);
        here.add(nat);
      }
      if (ok) add(idxs);
    }
  }

  // -- Mano libera: forma altre combinazioni dalle carte rimaste --------------

  private greedyHandMelds(ctx: SolveCtx): number[][] {
    const extra: number[][] = [];
    let progress = true;
    while (progress) {
      progress = false;
      for (let i = 0; i < ctx.slots.length; i++) {
        if (ctx.used[i] || !ctx.slots[i].hand) continue;
        const melds = this.meldsForIndex(ctx, i);
        if (melds.length === 0) continue;
        const meld = melds[0];
        for (const j of meld) ctx.used[j] = true;
        extra.push(meld);
        progress = true;
        break;
      }
    }
    return extra;
  }

  // -- Lookup -----------------------------------------------------------------

  private findNatural(ctx: SolveCtx, suit: string, rank: number, here: Set<number>): number {
    for (let i = 0; i < ctx.slots.length; i++) {
      const c = ctx.slots[i].card;
      if (ctx.used[i] || here.has(i) || c.isJoker) continue;
      if (c.suit === suit && c.rank === rank) return i;
    }
    return -1;
  }

  private firstJoker(ctx: SolveCtx, here: Set<number>): number {
    for (let i = 0; i < ctx.slots.length; i++) {
      if (!ctx.used[i] && !here.has(i) && ctx.slots[i].card.isJoker) return i;
    }
    return -1;
  }
}

interface SolveCtx {
  slots: Slot[];
  used: boolean[];
  deadline: number;
}

/** Tutti i sottoinsiemi non vuoti di `arr` fino a dimensione `max`. */
function subsetsUpTo(arr: number[], max: number): number[][] {
  const result: number[][] = [];
  const recurse = (start: number, acc: number[]) => {
    if (acc.length > 0) result.push([...acc]);
    if (acc.length === max) return;
    for (let i = start; i < arr.length; i++) {
      acc.push(arr[i]);
      recurse(i + 1, acc);
      acc.pop();
    }
  };
  recurse(0, []);
  return result;
}
