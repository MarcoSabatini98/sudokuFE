import { render, screen } from '@testing-library/angular';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';

import { GameComponent } from './game.component';
import { SudokuService } from '../../core/services/sudoku/sudoku.service';
import { GameService } from '../../core/services/game/game.service';
import { SudokuPuzzle } from '../../shared/models/game.model';

const MOCK_PUZZLE: SudokuPuzzle = {
  difficulty: 'easy',
  puzzle: Array.from({ length: 9 }, () => Array(9).fill(0)),
  solution: Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => ((r + c) % 9) + 1)),
};

const defaultProviders = () => [
  provideRouter([]),
  provideAnimationsAsync(),
  { provide: SudokuService, useValue: { generate: vi.fn(() => of(MOCK_PUZZLE)) } },
  { provide: GameService, useValue: { save: vi.fn(() => of({ id: 1 })) } },
];

const hardProviders = () => [
  provideAnimationsAsync(),
  { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => 'hard' } } } },
  { provide: SudokuService, useValue: { generate: vi.fn(() => of(MOCK_PUZZLE)) } },
  { provide: GameService, useValue: { save: vi.fn(() => of({ id: 1 })) } },
];

function triggerThreeErrors(comp: GameComponent): void {
  comp.onErrorOccurred();
  comp.onErrorOccurred();
  comp.onErrorOccurred();
}

describe('GameComponent', () => {
  const mockSudokuService = { generate: vi.fn(() => of(MOCK_PUZZLE)) };
  const mockGameService = { save: vi.fn(() => of({ id: 1 })) };

  beforeEach(() => {
    mockSudokuService.generate.mockReturnValue(of(MOCK_PUZZLE));
  });

  it('should render the difficulty header on init', async () => {
    await render(GameComponent, {
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: SudokuService, useValue: mockSudokuService },
        { provide: GameService, useValue: mockGameService },
      ],
    });

    expect(screen.getByText('Facile')).toBeTruthy();
  });

  it('should render board after puzzle loads', async () => {
    await render(GameComponent, {
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: SudokuService, useValue: mockSudokuService },
        { provide: GameService, useValue: mockGameService },
      ],
    });

    const cells = document.querySelectorAll('.cell');
    expect(cells.length).toBe(81);
  });

  it('should show error snackbar when generate fails', async () => {
    mockSudokuService.generate.mockReturnValue(throwError(() => new Error('Network error')));

    await render(GameComponent, {
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: SudokuService, useValue: mockSudokuService },
        { provide: GameService, useValue: mockGameService },
      ],
    });

    expect(screen.getByText('Errore nel caricamento del puzzle')).toBeTruthy();
  });

  it('should start with errorCount 0', async () => {
    const { fixture } = await render(GameComponent, { providers: defaultProviders() });
    expect(fixture.componentInstance.errorCount()).toBe(0);
  });

  it('should increment errorCount on onErrorOccurred', async () => {
    const { fixture } = await render(GameComponent, { providers: defaultProviders() });
    const comp = fixture.componentInstance;
    comp.onErrorOccurred();
    expect(comp.errorCount()).toBe(1);
  });

  it('should activate gameOverActive and boardDisabled when errorCount reaches 3', async () => {
    const { fixture } = await render(GameComponent, { providers: defaultProviders() });
    const comp = fixture.componentInstance;
    triggerThreeErrors(comp);
    expect(comp.gameOverActive()).toBe(true);
    expect(comp.boardDisabled()).toBe(true);
  });

  it('should reset to 2 errors and activate penalty on continue', async () => {
    const { fixture } = await render(GameComponent, { providers: defaultProviders() });
    const comp = fixture.componentInstance;
    triggerThreeErrors(comp);
    comp.onContinueAfterErrors();
    expect(comp.errorCount()).toBe(2);
    expect(comp.penaltyActive()).toBe(true);
    expect(comp.gameOverActive()).toBe(false);
    if (comp['penaltyInterval']) clearInterval(comp['penaltyInterval']);
  });

  it('should reset errorCount to 0 on restart after errors', async () => {
    const { fixture } = await render(GameComponent, { providers: defaultProviders() });
    const comp = fixture.componentInstance;
    triggerThreeErrors(comp);
    comp.onRestartAfterErrors();
    expect(comp.errorCount()).toBe(0);
    expect(comp.gameOverActive()).toBe(false);
  });

  it('should unlock notes for easy/medium immediately', async () => {
    const { fixture } = await render(GameComponent, { providers: defaultProviders() });
    const comp = fixture.componentInstance;
    comp.difficulty = 'easy';
    expect(comp.notesUnlocked()).toBe(true);
  });

  it('should not unlock notes for hard until 3 clicks', async () => {
    const { fixture } = await render(GameComponent, { providers: hardProviders() });
    const comp = fixture.componentInstance;
    expect(comp.notesUnlocked()).toBe(false);
    comp.notesUnlockClicks.set(2);
    expect(comp.notesUnlocked()).toBe(false);
    comp.notesUnlockClicks.set(3);
    expect(comp.notesUnlocked()).toBe(true);
  });

  it('should increment notesUnlockClicks when notes not yet unlocked on hard', async () => {
    const { fixture } = await render(GameComponent, { providers: hardProviders() });
    const comp = fixture.componentInstance;
    comp.onNotesClick();
    expect(comp.notesUnlockClicks()).toBe(1);
    comp.onNotesClick();
    expect(comp.notesUnlockClicks()).toBe(2);
  });

  it('should reset notesUnlockClicks on restart', async () => {
    const { fixture } = await render(GameComponent, { providers: defaultProviders() });
    const comp = fixture.componentInstance;
    comp.notesUnlockClicks.set(2);
    comp.onRestart();
    expect(comp.notesUnlockClicks()).toBe(0);
  });
});
