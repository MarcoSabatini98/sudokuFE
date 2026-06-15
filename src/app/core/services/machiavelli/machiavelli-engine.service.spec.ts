import {
  MachiavelliEngineService,
  isValidSet,
  isValidRun,
  isValidMeld,
  isTableValid,
  orderMeldCards,
  splitRunWithCard,
  splitRunAtGaps,
} from './machiavelli-engine.service';
import { Card } from '../../../shared/models/card.model';
import { GameState } from '../../../shared/models/machiavelli.model';
import { card, joker, aceToSixHearts } from '../../../shared/testing/card-fixtures';

describe('MachiavelliEngine — validazione set', () => {
  it('accetta tris di semi distinti', () => {
    expect(isValidSet([card('H', 7), card('D', 7), card('S', 7)])).toBe(true);
  });
  it('accetta poker (4 semi)', () => {
    expect(isValidSet([card('H', 7), card('D', 7), card('S', 7), card('C', 7)])).toBe(true);
  });
  it('accetta set con jolly', () => {
    expect(isValidSet([card('H', 7), card('D', 7), joker()])).toBe(true);
  });
  it('rifiuta seme ripetuto', () => {
    expect(isValidSet([card('H', 7), card('H', 7, 1), card('S', 7)])).toBe(false);
  });
  it('rifiuta ranghi diversi', () => {
    expect(isValidSet([card('H', 7), card('D', 8), card('S', 7)])).toBe(false);
  });
  it('rifiuta meno di 3 carte', () => {
    expect(isValidSet([card('H', 7), card('D', 7)])).toBe(false);
  });
  it('rifiuta più di 4 carte', () => {
    expect(isValidSet([card('H', 7), card('D', 7), card('S', 7), card('C', 7), joker()])).toBe(false);
  });
});

describe('MachiavelliEngine — validazione scala', () => {
  it('accetta scala semplice', () => {
    expect(isValidRun([card('H', 5), card('H', 6), card('H', 7)])).toBe(true);
  });
  it('accetta scala con jolly nel mezzo', () => {
    expect(isValidRun([card('H', 5), joker(), card('H', 7)])).toBe(true);
  });
  it('accetta asso basso A-2-3', () => {
    expect(isValidRun([card('H', 1), card('H', 2), card('H', 3)])).toBe(true);
  });
  it('accetta asso alto Q-K-A', () => {
    expect(isValidRun([card('H', 12), card('H', 13), card('H', 1)])).toBe(true);
  });
  it('rifiuta semi misti', () => {
    expect(isValidRun([card('H', 5), card('D', 6), card('H', 7)])).toBe(false);
  });
  it('rifiuta buco troppo grande senza jolly sufficienti', () => {
    expect(isValidRun([card('H', 5), card('H', 9), card('H', 10)])).toBe(false);
  });
  it('rifiuta rango duplicato nello stesso seme', () => {
    expect(isValidRun([card('H', 5), card('H', 5, 1), card('H', 6)])).toBe(false);
  });
  it('rifiuta meno di 3 carte', () => {
    expect(isValidRun([card('H', 5), card('H', 6)])).toBe(false);
  });
  it('rifiuta più di un jolly nella stessa scala', () => {
    expect(isValidRun([card('H', 5), joker(0), joker(1)])).toBe(false);
  });
});

describe('MachiavelliEngine — regola max 1 jolly', () => {
  it('rifiuta più di un jolly nello stesso set', () => {
    expect(isValidSet([card('H', 7), joker(0), joker(1)])).toBe(false);
  });
});

describe('MachiavelliEngine — orderMeldCards', () => {
  it('ordina una scala per rango crescente', () => {
    const out = orderMeldCards([card('H', 7), card('H', 5), card('H', 6)]);
    expect(out.map((c) => c.rank)).toEqual([5, 6, 7]);
  });
  it('inserisce il jolly nel buco della scala', () => {
    const out = orderMeldCards([card('H', 7), joker(), card('H', 5)]);
    expect(out.map((c) => (c.isJoker ? 'J' : c.rank))).toEqual([5, 'J', 7]);
  });
  it('mantiene l’asso alto in coda (Q-K-A)', () => {
    const out = orderMeldCards([card('H', 1), card('H', 13), card('H', 12)]);
    expect(out.map((c) => c.rank)).toEqual([12, 13, 1]);
  });
  it('tiene l’asso basso in testa (A-2-3)', () => {
    const out = orderMeldCards([card('H', 3), card('H', 1), card('H', 2)]);
    expect(out.map((c) => c.rank)).toEqual([1, 2, 3]);
  });
  it('usa il jolly come Re tra Q e A in una scala alta (9-10-J-Q-jolly-A)', () => {
    const out = orderMeldCards([
      card('C', 1),
      card('C', 9),
      card('C', 10),
      card('C', 11),
      card('C', 12),
      joker(),
    ]);
    expect(out.map((c) => (c.isJoker ? 'J' : c.rank))).toEqual([9, 10, 11, 12, 'J', 1]);
  });
  it('mette il jolly come Regina davanti a K-A (jolly-K-A, non K-A-jolly)', () => {
    const out = orderMeldCards([card('S', 13), card('S', 1), joker()]);
    expect(out.map((c) => (c.isJoker ? 'J' : c.rank))).toEqual(['J', 13, 1]);
  });
});

describe('MachiavelliEngine — isValidMeld / isTableValid', () => {
  it('isValidMeld vale per set e per scala', () => {
    expect(isValidMeld([card('H', 7), card('D', 7), card('S', 7)])).toBe(true);
    expect(isValidMeld([card('H', 5), card('H', 6), card('H', 7)])).toBe(true);
    expect(isValidMeld([card('H', 7), card('D', 8), card('S', 9)])).toBe(false);
  });
  it('isTableValid richiede tutte le combinazioni valide', () => {
    const ok = [{ id: 'a', cards: [card('H', 7), card('D', 7), card('S', 7)] }];
    const ko = [{ id: 'b', cards: [card('H', 7), card('D', 8), card('S', 9)] }];
    expect(isTableValid(ok)).toBe(true);
    expect(isTableValid(ko)).toBe(false);
  });
});

describe('MachiavelliEngine — splitRunWithCard', () => {
  const run = aceToSixHearts();

  it('spezza A-2-3-4-5-6 aggiungendo un 4 → [A-2-3-4] e [4-5-6]', () => {
    const split = splitRunWithCard(run, card('H', 4, 1));
    expect(split).not.toBeNull();
    expect(split![0].map((c) => c.rank)).toEqual([1, 2, 3, 4]);
    expect(split![1].map((c) => c.rank)).toEqual([4, 5, 6]);
  });

  it('non spezza se una metà resterebbe sotto 3 carte', () => {
    // aggiungere un 2 lascerebbe [A-2] da 2 carte
    expect(splitRunWithCard(run, card('H', 2, 1))).toBeNull();
  });

  it('non spezza con carta di seme diverso', () => {
    expect(splitRunWithCard(run, card('S', 4))).toBeNull();
  });

  it('non spezza una carta che estende soltanto la scala', () => {
    expect(splitRunWithCard(run, card('H', 7))).toBeNull();
  });
});

describe('MachiavelliEngine — splitRunAtGaps', () => {
  it('separa i segmenti dopo aver tolto una carta centrale', () => {
    // 4-5-6-7-9-10-J di picche (manca l’8)
    const gapped = [
      card('S', 4),
      card('S', 5),
      card('S', 6),
      card('S', 7),
      card('S', 9),
      card('S', 10),
      card('S', 11),
    ];
    const segs = splitRunAtGaps(gapped);
    expect(segs).toHaveLength(2);
    expect(segs[0].map((c) => c.rank)).toEqual([4, 5, 6, 7]);
    expect(segs[1].map((c) => c.rank)).toEqual([9, 10, 11]);
  });

  it('lascia intatta una scala contigua', () => {
    const run = [card('S', 4), card('S', 5), card('S', 6)];
    expect(splitRunAtGaps(run)).toHaveLength(1);
  });

  it('non spezza un tris', () => {
    const set = [card('H', 7), card('D', 7), card('S', 7)];
    expect(splitRunAtGaps(set)).toHaveLength(1);
  });
});

describe('MachiavelliEngine — setup partita', () => {
  const engine = new MachiavelliEngineService();

  it('buildDeck produce 108 carte con 4 jolly', () => {
    const deck = engine.buildDeck();
    expect(deck).toHaveLength(108);
    expect(deck.filter((c) => c.isJoker)).toHaveLength(4);
  });

  it('newGame distribuisce 13 carte a 4 giocatori', () => {
    const s = engine.newGame();
    expect(s.players).toHaveLength(4);
    s.players.forEach((p) => expect(p.hand).toHaveLength(13));
    expect(s.stock).toHaveLength(108 - 52);
    expect(s.table).toHaveLength(0);
    expect(s.players[0].isAI).toBe(false);
    expect(s.players[1].isAI).toBe(true);
  });
});

describe('MachiavelliEngine — commitHumanTurn', () => {
  const engine = new MachiavelliEngineService();

  function stateWith(hand: Card[], table: GameState['table'] = []): GameState {
    return {
      players: [
        { id: 0, name: 'Tu', hand, isAI: false },
        { id: 1, name: 'Bot', hand: [], isAI: true },
        { id: 2, name: 'Bot', hand: [], isAI: true },
        { id: 3, name: 'Bot', hand: [], isAI: true },
      ],
      table,
      stock: [],
      currentPlayer: 0,
      phase: 'playing',
      winner: null,
    };
  }

  it('vince svuotando la mano con una mossa valida', () => {
    const hand = [card('H', 5), card('H', 6), card('H', 7)];
    const s = stateWith(hand);
    const res = engine.commitHumanTurn(s, [{ id: 'm1', cards: hand }], []);
    expect(res.ok).toBe(true);
    expect(res.state!.phase).toBe('won');
    expect(res.state!.winner).toBe(0);
  });

  it('rifiuta se non viene calata nessuna carta dalla mano', () => {
    const set = [card('C', 5), card('D', 5), card('S', 5)];
    const hand = [card('H', 9), card('H', 10), card('H', 11)];
    const s = stateWith(hand, [{ id: 't1', cards: set }]);
    const res = engine.commitHumanTurn(s, [{ id: 't1', cards: set }], hand);
    expect(res.ok).toBe(false);
  });

  it('rifiuta se le carte non si conservano', () => {
    const hand = [card('H', 5), card('H', 6), card('H', 7)];
    const s = stateWith(hand);
    const res = engine.commitHumanTurn(s, [{ id: 'm1', cards: [card('H', 5), card('H', 6)] }], []);
    expect(res.ok).toBe(false);
  });

  it('rifiuta combinazioni non valide', () => {
    const hand = [card('H', 5), card('D', 8), card('S', 11)];
    const s = stateWith(hand);
    const res = engine.commitHumanTurn(s, [{ id: 'm1', cards: hand }], []);
    expect(res.ok).toBe(false);
  });

  it('vieta di prendere in mano una carta dal tavolo', () => {
    const set = [card('C', 5), card('D', 5), card('S', 5), card('H', 5)];
    const hand = [card('H', 9), card('H', 10), card('H', 11)];
    const s = stateWith(hand, [{ id: 't1', cards: set }]);
    const res = engine.commitHumanTurn(
      s,
      [
        { id: 't1', cards: [card('C', 5), card('D', 5), card('S', 5)] },
        { id: 'm1', cards: hand },
      ],
      [card('H', 5)] // carta del tavolo finita in mano
    );
    expect(res.ok).toBe(false);
  });

  it('mossa valida senza vittoria passa il turno', () => {
    const hand = [card('H', 5), card('H', 6), card('H', 7), card('S', 2)];
    const s = stateWith(hand);
    const res = engine.commitHumanTurn(
      s,
      [{ id: 'm1', cards: [card('H', 5), card('H', 6), card('H', 7)] }],
      [card('S', 2)]
    );
    expect(res.ok).toBe(true);
    expect(res.state!.phase).toBe('playing');
    expect(res.state!.currentPlayer).toBe(1);
  });
});

describe('MachiavelliEngine — drawFromStock', () => {
  const engine = new MachiavelliEngineService();

  it('pesca dallo stock e passa il turno', () => {
    const s = engine.newGame();
    const before = s.players[0].hand.length;
    const stockBefore = s.stock.length;
    const next = engine.drawFromStock(s, 0);
    expect(next.players[0].hand).toHaveLength(before + 1);
    expect(next.stock).toHaveLength(stockBefore - 1);
    expect(next.currentPlayer).toBe(1);
  });
});
