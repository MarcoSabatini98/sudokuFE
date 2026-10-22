import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CrosswordStatsComponent } from './crossword-stats.component';
import { CrosswordService } from '../../core/services/crossword/crossword.service';

const serviceStub = {
  getRecords: () => of([{ difficulty: 'easy', best_time_seconds: 240 }]),
  getHistory: () =>
    of({
      data: [{ id: 1, difficulty: 'easy', time_seconds: 300, played_at: '2026-06-15T10:00:00.000Z' }],
      pagination: { total: 1, page: 1, limit: 15, totalPages: 1 },
    }),
};

describe('CrosswordStatsComponent', () => {
  it('renders records and history from the service', async () => {
    await render(CrosswordStatsComponent, {
      providers: [provideRouter([]), { provide: CrosswordService, useValue: serviceStub }],
    });

    expect(screen.getByText('Record e cronologia partite')).toBeTruthy();
    expect(screen.getByText('04:00')).toBeTruthy(); // best time 240s
    expect(screen.getByText('⏱ 05:00')).toBeTruthy(); // history 300s
  });
});
