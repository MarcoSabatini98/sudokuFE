import { MachiavelliApiService } from './machiavelli-api.service';
import { MachiavelliGame, MachiavelliRecord } from '../../../shared/models/machiavelli-game.model';
import { setupHttpServiceTest } from '../../../core/utils/testing/http-service-test';

describe('MachiavelliApiService', () => {
  const { service, mock } = setupHttpServiceTest(MachiavelliApiService);

  it('should be created', () => {
    expect(service()).toBeTruthy();
  });

  it('POSTs a game result', () => {
    const saved: MachiavelliGame = {
      id: 1,
      won: true,
      duration_seconds: 300,
      played_at: '2026-06-15T10:00:00.000Z',
    };

    service().saveGame({ won: true, duration_seconds: 300 }).subscribe((res) => {
      expect(res).toEqual(saved);
    });

    const req = mock().expectOne((r) => r.url.endsWith('/machiavelli') && r.method === 'POST');
    expect(req.request.body).toEqual({ won: true, duration_seconds: 300 });
    req.flush({ status: 'success', success: true, data: saved });
  });

  it('GETs the personal record', () => {
    const record: MachiavelliRecord = { best_time_seconds: 240, best_game: null };

    service().getRecord().subscribe((res) => {
      expect(res).toEqual(record);
    });

    const req = mock().expectOne((r) => r.url.endsWith('/machiavelli/records'));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: record });
  });
});
