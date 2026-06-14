import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
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

describe('GameComponent', () => {
  const mockSudokuService = { generate: vi.fn(() => of(MOCK_PUZZLE)) };
  const mockGameService = { save: vi.fn(() => of({ id: 1 })) };

  beforeEach(() => {
    mockSudokuService.generate.mockReturnValue(of(MOCK_PUZZLE));
  });

  it('should show loading spinner on init', async () => {
    await render(GameComponent, {
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: SudokuService, useValue: mockSudokuService },
        { provide: GameService, useValue: mockGameService },
      ],
    });

    expect(screen.getByText('Nuovo Puzzle')).toBeTruthy();
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
});
