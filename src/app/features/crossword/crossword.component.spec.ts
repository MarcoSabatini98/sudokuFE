import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CrosswordComponent } from './crossword.component';
import { CrosswordService } from '../../core/services/crossword/crossword.service';
import { mockCrossword } from '../../shared/testing/crossword-fixtures';

async function renderCrossword(): Promise<CrosswordComponent> {
  const { fixture } = await render(CrosswordComponent, {
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      { provide: CrosswordService, useValue: { generate: () => of(mockCrossword()) } },
    ],
  });
  return fixture.componentInstance;
}

function press(comp: CrosswordComponent, key: string): void {
  comp.onKeydown(new KeyboardEvent('keydown', { key }));
}

describe('CrosswordComponent', () => {
  it('carica lo schema e mostra le definizioni', async () => {
    await renderCrossword();
    expect(screen.getByText('Orizzontali')).toBeTruthy();
    expect(screen.getByText('Verticali')).toBeTruthy();
    expect(screen.getAllByText('Animale che abbaia').length).toBeGreaterThan(0);
  });

  it('seleziona la prima casella bianca all’avvio', async () => {
    const comp = await renderCrossword();
    expect(comp.selected()).toEqual({ row: 0, col: 0 });
  });

  it('digitare una lettera riempie la casella e avanza in orizzontale', async () => {
    const comp = await renderCrossword();
    press(comp, 'c');
    expect(comp.letterAt(0, 0)).toBe('C');
    expect(comp.selected()).toEqual({ row: 0, col: 1 });
  });

  it('le frecce spostano la selezione e cambiano direzione', async () => {
    const comp = await renderCrossword();
    press(comp, 'ArrowDown');
    expect(comp.direction()).toBe('down');
    expect(comp.selected()).toEqual({ row: 1, col: 0 });
  });

  it('Backspace cancella e torna indietro', async () => {
    const comp = await renderCrossword();
    press(comp, 'c'); // (0,0)=C, selezione → (0,1)
    press(comp, 'a'); // (0,1)=A, selezione → (0,2)
    press(comp, 'Backspace'); // (0,2) vuota → torna a (0,1) e la svuota
    expect(comp.selected()).toEqual({ row: 0, col: 1 });
    expect(comp.letterAt(0, 1)).toBe('');
  });

  it('cliccare due volte la stessa casella inverte la direzione', async () => {
    const comp = await renderCrossword();
    comp.onCellClick(0, 1); // seleziona una casella diversa da quella iniziale
    comp.onCellClick(0, 1); // stessa casella → inverte la direzione
    expect(comp.direction()).toBe('down');
  });

  it('cliccare una definizione seleziona la sua casella e direzione', async () => {
    const comp = await renderCrossword();
    const down = comp.downEntries()[0];
    comp.onClueClick(down);
    expect(comp.direction()).toBe('down');
    expect(comp.selected()).toEqual({ row: 0, col: 0 });
    expect(comp.isClueActive(down)).toBe(true);
  });

  it('Cancella svuota la griglia', async () => {
    const comp = await renderCrossword();
    comp.reveal();
    expect(comp.solved()).toBe(true);
    comp.clear();
    expect(comp.solved()).toBe(false);
    expect(comp.letterAt(0, 0)).toBe('');
  });

  it('Verifica evidenzia le lettere sbagliate della parola selezionata', async () => {
    const comp = await renderCrossword();
    press(comp, 'x'); // sbagliata in (0,0)
    comp.check();
    expect(comp.isWrong(0, 0)).toBe(true);
  });

  it('Verifica controlla SOLO la parola selezionata, non le altre', async () => {
    const comp = await renderCrossword();
    comp.onCellClick(0, 1); // CANE (orizzontale)
    press(comp, 'z'); // (0,1) sbagliata in CANE
    comp.onClueClick(comp.downEntries()[0]); // seleziona CASA (verticale)
    comp.onCellClick(1, 0);
    press(comp, 'z'); // (1,0) sbagliata in CASA

    comp.onClueClick(comp.acrossEntries()[0]); // riseleziona CANE
    comp.check();

    expect(comp.isWrong(0, 1)).toBe(true); // CANE selezionata → segnalata
    expect(comp.isWrong(1, 0)).toBe(false); // CASA non selezionata → NON segnalata
  });

  it('riscrivere una casella sbagliata ne toglie l’evidenziazione', async () => {
    const comp = await renderCrossword();
    press(comp, 'x'); // (0,0) sbagliata
    comp.check();
    expect(comp.isWrong(0, 0)).toBe(true);
    comp.onCellClick(0, 0);
    press(comp, 'c'); // riscrive (0,0)
    expect(comp.isWrong(0, 0)).toBe(false);
  });

  it('completa con la soluzione e risulta risolto', async () => {
    const comp = await renderCrossword();
    expect(comp.solved()).toBe(false);
    comp.reveal();
    expect(comp.solved()).toBe(true);
  });

  it('cambiare difficoltà la imposta e rigenera lo schema', async () => {
    const generateSpy = vi.fn(() => of(mockCrossword()));
    const { fixture } = await render(CrosswordComponent, {
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: CrosswordService, useValue: { generate: generateSpy } },
      ],
    });
    const comp = fixture.componentInstance;
    generateSpy.mockClear(); // ignora la generazione iniziale

    comp.setDifficulty('hard');

    expect(comp.difficulty()).toBe('hard');
    expect(generateSpy).toHaveBeenCalledWith('hard');
  });
});
