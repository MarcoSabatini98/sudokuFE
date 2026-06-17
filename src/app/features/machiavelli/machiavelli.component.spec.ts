import { render } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { of } from 'rxjs';

import { MachiavelliComponent } from './machiavelli.component';
import { MachiavelliApiService } from '../../core/services/machiavelli/machiavelli-api.service';
import { Card, Meld } from '../../shared/models/card.model';
import { GameState } from '../../shared/models/machiavelli.model';
import { card } from '../../shared/testing/card-fixtures';

function humanState(hand: Card[], table: Meld[] = [], stock: Card[] = []): GameState {
  return {
    players: [
      { id: 0, name: 'Tu', hand, isAI: false },
      { id: 1, name: 'Bot Anna', hand: [], isAI: true },
      { id: 2, name: 'Bot Bruno', hand: [], isAI: true },
      { id: 3, name: 'Bot Carla', hand: [], isAI: true },
    ],
    table,
    stock,
    currentPlayer: 0,
    phase: 'playing',
    winner: null,
  };
}

describe('MachiavelliComponent', () => {
  let comp: MachiavelliComponent;

  const apiStub = {
    saveGame: () => of({}),
    getRecord: () => of({ best_time_seconds: null }),
  };

  beforeEach(async () => {
    const r = await render(MachiavelliComponent, {
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: MachiavelliApiService, useValue: apiStub },
      ],
    });
    comp = r.fixture.componentInstance;
  });

  it('all’apertura la partita è pronta ed è il turno dell’umano (nessun popup)', () => {
    expect(comp.isHumanTurn()).toBe(true);
    const log = comp.gameLog();
    expect(log.length).toBeGreaterThanOrEqual(1);
    expect(log[log.length - 1].who).toBe('system'); // riga più vecchia = "Nuova partita"
  });

  it('newGame ripulisce il log e riavvia col turno all’umano', () => {
    comp.newGame();
    expect(comp.isHumanTurn()).toBe(true);
    const log = comp.gameLog();
    expect(log.length).toBeGreaterThanOrEqual(1);
    expect(log[log.length - 1].who).toBe('system');
  });

  it('annulla turno conserva l’ordine ordinato della mano', () => {
    const c1 = card('H', 1);
    const c2 = card('H', 2);
    const c3 = card('H', 3);
    comp.state.set(humanState([c3, c1, c2]));
    comp.workingHand.set([c3, c1, c2]);
    comp.sortHand(); // ordina → handOrder [c1, c2, c3]
    comp.workingHand.set([c1]); // come se avessi calato c2 e c3

    comp.undoTurn();

    expect(comp.workingHand().map((c) => c.id)).toEqual([c1.id, c2.id, c3.id]);
  });

  it('pescare mantiene l’ordine: la carta nuova va in coda', async () => {
    vi.useFakeTimers();
    const c1 = card('H', 1);
    const c2 = card('H', 2);
    const c3 = card('H', 3);
    const top = card('S', 9);
    comp.state.set(humanState([c3, c1, c2], [], [top]));
    comp.workingHand.set([c3, c1, c2]);
    comp.sortHand(); // handOrder [c1, c2, c3]

    comp.draw();
    await vi.runAllTimersAsync();

    expect(comp.workingHand().map((c) => c.id)).toEqual([c1.id, c2.id, c3.id, top.id]);
    vi.useRealTimers();
  });

  it('blocca la pesca se hai già calato carte in questo turno', () => {
    const h7 = card('H', 7);
    const d7 = card('D', 7);
    const s7 = card('S', 7);
    const top = card('S', 9);
    comp.state.set(humanState([h7, d7, s7], [], [top]));
    comp.workingHand.set([h7, d7, s7]);
    comp.workingTable.set([]);

    // cala una carta (drop nella zona "nuova combinazione") → mossa in sospeso
    comp.drop({
      previousContainer: { id: comp.HAND_ID },
      container: { id: comp.NEW_MELD_ID },
      item: { data: h7 },
    } as unknown as CdkDragDrop<Card[]>);

    expect(comp.canUndoMove()).toBe(true);
    expect(comp.canDraw()).toBe(false);

    const stockBefore = comp.state().stock.length;
    comp.draw();
    expect(comp.state().stock.length).toBe(stockBefore); // pesca bloccata: stock invariato
  });

  it('calando l’ultima carta con tavolo valido vince senza confermare', () => {
    const h7 = card('H', 7);
    const d7 = card('D', 7);
    const s7 = card('S', 7);
    comp.state.set(humanState([h7, d7, s7]));
    comp.workingTable.set([{ id: 'm1', cards: [h7, d7] }]);
    comp.workingHand.set([s7]);

    comp.drop({
      previousContainer: { id: comp.HAND_ID },
      container: { id: 'm1' },
      item: { data: s7 },
    } as unknown as CdkDragDrop<Card[]>);

    expect(comp.isWon()).toBe(true);
    expect(comp.state().winner).toBe(0);
  });

  it('la vittoria finisce nel log', () => {
    const h7 = card('H', 7);
    const d7 = card('D', 7);
    const s7 = card('S', 7);
    comp.state.set(humanState([h7, d7, s7]));
    comp.workingTable.set([{ id: 'm1', cards: [h7, d7, s7] }]);
    comp.workingHand.set([]);

    comp.confirmTurn();

    expect(comp.isWon()).toBe(true);
    expect(comp.gameLog().some((e) => e.who === 'human' && e.text.startsWith('Tu cali'))).toBe(true);
    expect(comp.gameLog().some((e) => e.who === 'system' && e.text.includes('ha vinto'))).toBe(true);
  });
});
