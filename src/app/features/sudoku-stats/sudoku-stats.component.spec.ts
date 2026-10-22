import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SudokuStatsComponent } from './sudoku-stats.component';
import { GameService } from '../../core/services/game/game.service';
import { RecordService } from '../../core/services/record/record.service';

const gameStub = {
  getAll: () =>
    of({
      data: [
        { id: 1, difficulty: 'easy', time_seconds: 300, completed: true, played_at: '2026-06-15T10:00:00.000Z' },
      ],
      pagination: { total: 1, page: 1, limit: 15, totalPages: 1 },
    }),
};

const recordStub = {
  getAll: () =>
    of([{ id: 1, difficulty: 'easy', best_time_seconds: 240, game_id: 1, updated_at: '2026-06-15T10:00:00.000Z' }]),
};

describe('SudokuStatsComponent', () => {
  it('renders records and history', async () => {
    await render(SudokuStatsComponent, {
      providers: [
        provideRouter([]),
        { provide: GameService, useValue: gameStub },
        { provide: RecordService, useValue: recordStub },
      ],
    });

    expect(screen.getByText('Record e cronologia partite')).toBeTruthy();
    expect(screen.getByText('04:00')).toBeTruthy(); // record 240s
    expect(screen.getByText('✓ Completata')).toBeTruthy();
  });
});
