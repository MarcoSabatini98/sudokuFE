import { TestBed } from '@angular/core/testing';

import { MachiavelliAiService } from './machiavelli-ai.service';
import { isTableValid } from './machiavelli-engine.service';
import { Card } from '../../../shared/models/card.model';
import { GameState } from '../../../shared/models/machiavelli.model';
import { card, joker, aceToSixHearts } from '../../../shared/testing/card-fixtures';

function stateWith(botHand: Card[], table: GameState['table'] = [], stock: Card[] = []): GameState {
  return {
    players: [
      { id: 0, name: 'Tu', hand: [], isAI: false },
      { id: 1, name: 'Bot', hand: botHand, isAI: true },
      { id: 2, name: 'Bot', hand: [], isAI: true },
      { id: 3, name: 'Bot', hand: [], isAI: true },
    ],
    table,
    stock,
    currentPlayer: 1,
    phase: 'playing',
    winner: null,
  };
}

describe('MachiavelliAiService', () => {
  let ai: MachiavelliAiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    ai = TestBed.inject(MachiavelliAiService);
  });

  it('forma un tris dalla mano', () => {
    const s = stateWith([card('H', 7), card('D', 7), card('S', 7), card('C', 2)]);
    const plan = ai.planTurn(s, 1);
    expect(plan).not.toBeNull();
    expect(plan!.table).toHaveLength(1);
    expect(plan!.hand).toHaveLength(1); // resta il 2 di fiori
  });

  it('forma una scala alta Q-K-A dalla mano', () => {
    const s = stateWith([card('H', 12), card('H', 13), card('H', 1), card('C', 2)]);
    const plan = ai.planTurn(s, 1);
    expect(plan).not.toBeNull();
    expect(plan!.hand.map((c) => c.id)).toEqual(['C2-0']); // calate Q-K-A, resta il 2 di fiori
  });

  it('usa un jolly per colmare il buco di una scala (5-6-_-8)', () => {
    const s = stateWith([card('H', 5), card('H', 6), card('H', 8), joker(), card('C', 2)]);
    const plan = ai.planTurn(s, 1);
    expect(plan).not.toBeNull();
    expect(plan!.hand.some((c) => c.isJoker)).toBe(false); // jolly usato nella scala
    expect(plan!.table.some((m) => m.cards.length >= 4)).toBe(true);
  });

  it('forma la scala più lunga disponibile (4-5-6-7, non si ferma a 3)', () => {
    const s = stateWith([card('H', 4), card('H', 5), card('H', 6), card('H', 7)]);
    const plan = ai.planTurn(s, 1);
    expect(plan).not.toBeNull();
    expect(plan!.hand).toHaveLength(0);
    expect(plan!.table[0].cards).toHaveLength(4);
  });

  it('estende una combinazione esistente sul tavolo', () => {
    const table = [{ id: 't1', cards: [card('H', 5), card('H', 6), card('H', 7)] }];
    const s = stateWith([card('H', 8), card('C', 2), card('D', 11)], table);
    const plan = ai.planTurn(s, 1);
    expect(plan).not.toBeNull();
    expect(plan!.table[0].cards.some((c) => c.id === 'H8-0')).toBe(true);
  });

  it('ritorna null quando non può calare nulla', () => {
    const s = stateWith([card('H', 2), card('D', 5), card('S', 8), card('C', 11)]);
    expect(ai.planTurn(s, 1)).toBeNull();
  });

  it('takeTurn pesca e passa il turno se bloccato', () => {
    const stock = [card('S', 9)];
    const s = stateWith([card('H', 2), card('D', 5), card('S', 8)], [], stock);
    const next = ai.takeTurn(s, 1);
    expect(next.players[1].hand).toHaveLength(4);
    expect(next.stock).toHaveLength(0);
    expect(next.currentPlayer).toBe(2);
  });

  it('takeTurn produce sempre un tavolo valido', () => {
    const s = stateWith([card('H', 7), card('D', 7), card('S', 7), card('H', 9), card('H', 10), card('H', 11)]);
    const next = ai.takeTurn(s, 1);
    expect(isTableValid(next.table)).toBe(true);
  });

  it('il bot vince se svuota la mano', () => {
    const s = stateWith([card('H', 5), card('H', 6), card('H', 7)]);
    const next = ai.takeTurn(s, 1);
    expect(next.phase).toBe('won');
    expect(next.winner).toBe(1);
  });

  it('Medio riusa un jolly dal tavolo (calando più del Facile)', () => {
    // set 7 H/D/S + jolly (rappresenta il 7 di fiori); il bot ha il 7 di fiori
    const table = [{ id: 't1', cards: [card('H', 7), card('D', 7), card('S', 7), joker()] }];
    const hand = [card('C', 7), card('H', 8), card('H', 9), card('H', 10)];
    const s = stateWith(hand, table);

    const easy = ai.planTurn(s, 1, 'easy');
    const medium = ai.planTurn(s, 1, 'medium');

    expect(medium).not.toBeNull();
    expect(medium!.hand.length).toBeLessThan(easy!.hand.length);
    const tableIds = medium!.table.flatMap((m) => m.cards.map((c) => c.id));
    expect(tableIds).toContain('C7-0'); // il 7 di fiori ha rimpiazzato il jolly
  });

  it('Difficile spezza una scala per calare una carta duplicata', () => {
    const run = aceToSixHearts();
    const s = stateWith([card('H', 4, 1)], [{ id: 't1', cards: run }]);

    expect(ai.planTurn(s, 1, 'easy')).toBeNull(); // Facile non sa spezzare
    const hard = ai.planTurn(s, 1, 'hard');
    expect(hard).not.toBeNull();
    expect(hard!.hand).toHaveLength(0);
    expect(hard!.table.length).toBeGreaterThanOrEqual(2);
  });
});
