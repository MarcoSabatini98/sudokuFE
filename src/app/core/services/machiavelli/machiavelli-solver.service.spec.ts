import { MachiavelliSolverService } from './machiavelli-solver.service';
import { Card, Rank, Suit } from '../../../shared/models/card.model';
import { isTableValid } from './machiavelli-engine.service';

function card(suit: Suit, rank: Rank, deckId = 0): Card {
  return { id: `${suit}${rank}-${deckId}`, suit, rank, isJoker: false, deckId };
}
function joker(n = 0): Card {
  return { id: `JOKER-0-${n}`, suit: null, rank: null, isJoker: true, deckId: 0 };
}

describe('MachiavelliSolverService', () => {
  const solver = new MachiavelliSolverService();

  it('riarrangia il tavolo: rompe un tris per alimentare una scala', () => {
    // Tavolo: tris di 7 (H/D/S). Mano: 7C + 5H 6H 8H.
    // Mossa ottima: tris 7D-7S-7C  +  scala 5H-6H-7H-8H → cala tutte e 4 le carte.
    const table = [card('H', 7), card('D', 7), card('S', 7)];
    const hand = [card('C', 7), card('H', 5), card('H', 6), card('H', 8)];

    const res = solver.solve(table, hand, 2000);
    expect(res).not.toBeNull();

    const placed = new Set(res!.melds.flat().map((c) => c.id));
    for (const c of [...table, ...hand]) expect(placed.has(c.id)).toBe(true);
    expect(isTableValid(res!.melds.map((cards, i) => ({ id: `m${i}`, cards })))).toBe(true);
  });

  it('usa un jolly del tavolo riarrangiando', () => {
    // Tavolo: scala con jolly 4H-jolly-6H. Mano: 5H (la carta esatta) + 2C 3C.
    // Il jolly liberato + 2C 3C 4C? No: meglio 5H rimpiazza il jolly, jolly usato altrove.
    const table = [card('H', 4), joker(), card('H', 6)];
    const hand = [card('H', 5), card('C', 2), card('C', 3)];

    const res = solver.solve(table, hand, 2000);
    expect(res).not.toBeNull();
    const placed = new Set(res!.melds.flat().map((c) => c.id));
    for (const c of table) expect(placed.has(c.id)).toBe(true); // tutte le carte del tavolo riusate
    expect([...placed].some((id) => id.startsWith('H5'))).toBe(true); // almeno il 5H calato
  });

  it('ritorna null quando nessuna carta della mano è componibile', () => {
    const table = [card('H', 7), card('D', 7), card('S', 7)];
    const hand = [card('C', 2), card('D', 9), card('S', 11)];
    expect(solver.solve(table, hand, 500)).toBeNull();
  });

  it('non fa nulla con budget 0', () => {
    expect(solver.solve([card('H', 7)], [card('H', 8)], 0)).toBeNull();
  });
});
