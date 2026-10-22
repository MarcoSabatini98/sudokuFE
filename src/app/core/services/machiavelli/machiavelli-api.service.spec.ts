import { MachiavelliApiService } from './machiavelli-api.service';
import {
  MachiavelliGame,
  MachiavelliRecord,
} from '../../../shared/models/machiavelli-game.model';
import { setupHttpServiceTest } from '../../../core/utils/testing/http-service-test';

describe('MachiavelliApiService', () => {
  const { service, mock } = setupHttpServiceTest(MachiavelliApiService);

  it('should be created', () => {
    expect(service()).toBeTruthy();
  });

  it('POSTs a game result with bot difficulty', () => {
    const saved: MachiavelliGame = {
      id: 1,
      won: true,
      duration_seconds: 300,
      bot_difficulty: 'medium',
      played_at: '2026-06-15T10:00:00.000Z',
    };

    service()
      .saveGame({ won: true, duration_seconds: 300, bot_difficulty: 'medium' })
      .subscribe((res) => {
        expect(res).toEqual(saved);
      });

    const req = mock().expectOne((r) => r.url.endsWith('/machiavelli') && r.method === 'POST');
    expect(req.request.body).toEqual({ won: true, duration_seconds: 300, bot_difficulty: 'medium' });
    req.flush({ status: 'success', success: true, data: saved });
  });

  it('GETs the records per difficulty', () => {
    const records: MachiavelliRecord[] = [
      { bot_difficulty: 'easy', best_time_seconds: 180 },
      { bot_difficulty: 'medium', best_time_seconds: 240 },
    ];

    service().getRecords().subscribe((res) => {
      expect(res).toEqual(records);
    });

    const req = mock().expectOne((r) => r.url.endsWith('/machiavelli/records'));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: records });
  });

  it('GETs the paginated history with optional filter', () => {
    service().getHistory({ bot_difficulty: 'hard', page: 2, limit: 10 }).subscribe();

    const req = mock().expectOne((r) => r.url.endsWith('/machiavelli') && r.method === 'GET');
    expect(req.request.params.get('bot_difficulty')).toBe('hard');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({
      status: 'success',
      success: true,
      data: { data: [], pagination: { total: 0, page: 2, limit: 10, totalPages: 0 } },
    });
  });
});
