import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';

import { RecordsComponent } from './records.component';
import { RecordService } from '../../core/services/record/record.service';
import { Record } from '../../shared/models/record.model';

const mockRecords: Record[] = [
  { id: 1, difficulty: 'easy', best_time_seconds: 90, game_id: 1, updated_at: '2026-06-14T10:00:00.000Z' },
  { id: 2, difficulty: 'hard', best_time_seconds: 360, game_id: 2, updated_at: '2026-06-14T11:00:00.000Z' },
];

describe('RecordsComponent', () => {
  const mockRecordService = { getAll: vi.fn(() => of(mockRecords)) };

  it('should show record times for difficulties that have records', async () => {
    await render(RecordsComponent, {
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: RecordService, useValue: mockRecordService },
      ],
    });

    expect(screen.getByText('01:30')).toBeTruthy();
    expect(screen.getByText('06:00')).toBeTruthy();
  });

  it('should show "Nessun record" for difficulties without records', async () => {
    await render(RecordsComponent, {
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: RecordService, useValue: mockRecordService },
      ],
    });

    const noRecordEls = screen.getAllByText('Nessun record');
    expect(noRecordEls.length).toBe(2);
  });

  it('should show all four difficulty sections', async () => {
    await render(RecordsComponent, {
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: RecordService, useValue: mockRecordService },
      ],
    });

    expect(screen.getByText('Facile')).toBeTruthy();
    expect(screen.getByText('Medio')).toBeTruthy();
    expect(screen.getByText('Difficile')).toBeTruthy();
    expect(screen.getByText('Estremo')).toBeTruthy();
  });
});
