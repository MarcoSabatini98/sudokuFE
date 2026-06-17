import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MachiavelliStatsComponent } from './machiavelli-stats.component';
import { MachiavelliApiService } from '../../core/services/machiavelli/machiavelli-api.service';

const apiStub = {
  getRecords: () => of([{ bot_difficulty: 'medium', best_time_seconds: 240 }]),
  getHistory: () =>
    of({
      data: [
        { id: 1, won: true, duration_seconds: 240, bot_difficulty: 'medium', played_at: '2026-06-15T10:00:00.000Z' },
      ],
      pagination: { total: 1, page: 1, limit: 15, totalPages: 1 },
    }),
};

describe('MachiavelliStatsComponent', () => {
  it('renders records and history from the API', async () => {
    await render(MachiavelliStatsComponent, {
      providers: [provideRouter([]), { provide: MachiavelliApiService, useValue: apiStub }],
    });

    expect(screen.getByText('Record e cronologia partite')).toBeTruthy();
    expect(screen.getByText('04:00')).toBeTruthy(); // best time 240s
    expect(screen.getByText('✓ Vinta')).toBeTruthy();
  });
});
