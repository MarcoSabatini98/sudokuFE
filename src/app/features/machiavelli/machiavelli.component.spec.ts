import { render } from '@testing-library/angular';
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
      providers: [provideNoopAnimations(), { provide: MachiavelliApiService, useValue: apiStub }],
    });
    comp = r.fixture.componentInstance;
  });

  it('parte a riposo: partita non avviata e log vuoto', () => {
    expect(comp.started()).toBe(false);
    expect(comp.gameLog().length).toBe(0);
  });

  it('newGame avvia la partita, pulisce il log e resetta i popup', () => {
    vi.useFakeTimers();
    comp.newGame();
    expect(comp.started()).toBe(true);
    expect(comp.winDismissed()).toBe(false);
    const log = comp.gameLog();
    expect(log.length).toBeGreaterThanOrEqual(1);
    expect(log[log.length - 1].who).toBe('system'); // riga più vecchia = "Nuova partita"
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('annulla turno conserva l’ordine ordinato della mano', () => {
    const c1 = card('H', 1);
    const c2 = card('H', 2);
    const c3 = card('H', 3);
    comp.state.set(humanState([c3, c1, c2]));
    comp.started.set(true);
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
    comp.started.set(true);
    comp.workingHand.set([c3, c1, c2]);
    comp.sortHand(); // handOrder [c1, c2, c3]

    comp.draw();
    await vi.runAllTimersAsync();

    expect(comp.workingHand().map((c) => c.id)).toEqual([c1.id, c2.id, c3.id, top.id]);
    vi.useRealTimers();
  });

  /** Tris 7 H/D/S nella mano dell'umano, partita avviata; ritorna le 3 carte. */
  function setupTrisInHand(): { h7: Card; d7: Card; s7: Card } {
    const h7 = card('H', 7);
    const d7 = card('D', 7);
    const s7 = card('S', 7);
    comp.state.set(humanState([h7, d7, s7]));
    comp.started.set(true);
    return { h7, d7, s7 };
  }

  it('calando l’ultima carta con tavolo valido vince senza confermare', () => {
    const { h7, d7, s7 } = setupTrisInHand();
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

  it('il popup di vittoria è chiudibile senza rigiocare', () => {
    const { h7, d7, s7 } = setupTrisInHand();
    comp.workingTable.set([{ id: 'm1', cards: [h7, d7, s7] }]);
    comp.workingHand.set([]);

    comp.confirmTurn();
    expect(comp.isWon()).toBe(true);
    // la giocata umana e la vittoria finiscono nel log
    expect(comp.gameLog().some((e) => e.who === 'human' && e.text.startsWith('Tu cali'))).toBe(true);
    expect(comp.gameLog().some((e) => e.who === 'system' && e.text.includes('ha vinto'))).toBe(true);

    comp.winDismissed.set(true);
    expect(comp.winDismissed()).toBe(true);
  });

  it('il popup iniziale è chiudibile per navigare altrove', () => {
    expect(comp.started()).toBe(false);
    comp.idleDismissed.set(true);
    expect(comp.idleDismissed()).toBe(true); // overlay "Pronto a giocare?" nascosto
  });
});
