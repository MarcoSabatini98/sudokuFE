import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';

import { HistoryComponent } from './history.component';
import { GameService } from '../../core/services/game/game.service';
import { PaginatedData } from '../../shared/models/api-response.model';
import { Game } from '../../shared/models/game.model';

const mockGame: Game = {
  id: 1,
  difficulty: 'easy',
  time_seconds: 120,
  completed: true,
  played_at: '2026-06-14T10:00:00.000Z',
};

const mockPaginated: PaginatedData<Game> = {
  data: [mockGame],
  pagination: { total: 1, page: 1, limit: 15, totalPages: 1 },
};

describe('HistoryComponent', () => {
  const mockGameService = { getAll: vi.fn(() => of(mockPaginated)) };

  it('should render game history table', async () => {
    await render(HistoryComponent, {
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: GameService, useValue: mockGameService },
      ],
    });

    expect(screen.getByText('Cronologia partite')).toBeTruthy();
    expect(screen.getByText('Facile')).toBeTruthy();
    expect(screen.getByText(/02:00/)).toBeTruthy();
  });

  it('should show empty message when no games', async () => {
    mockGameService.getAll.mockReturnValue(
      of({ data: [], pagination: { total: 0, page: 1, limit: 15, totalPages: 0 } })
    );

    await render(HistoryComponent, {
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: GameService, useValue: mockGameService },
      ],
    });

    expect(screen.getByText('Nessuna partita registrata.')).toBeTruthy();
  });
});
