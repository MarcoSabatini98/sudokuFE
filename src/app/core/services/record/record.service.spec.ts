import { RecordService } from './record.service';
import { Record } from '../../../shared/models/record.model';
import { setupHttpServiceTest } from '../../../core/utils/testing/http-service-test';

describe('RecordService', () => {
  const { service, mock } = setupHttpServiceTest(RecordService);

  const mockRecord: Record = {
    id: 1,
    difficulty: 'easy',
    best_time_seconds: 90,
    game_id: 1,
    updated_at: new Date().toISOString(),
  };

  it('should be created', () => {
    expect(service()).toBeTruthy();
  });

  it('getAll should call GET /records', () => {
    service().getAll().subscribe((records) => {
      expect(records).toHaveLength(1);
      expect(records[0].difficulty).toBe('easy');
    });

    const req = mock().expectOne((r) => r.url.endsWith('/records'));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: [mockRecord] });
  });

  it('getByDifficulty should call GET /records/:difficulty', () => {
    service().getByDifficulty('easy').subscribe((record) => {
      expect(record?.best_time_seconds).toBe(90);
    });

    const req = mock().expectOne((r) => r.url.endsWith('/records/easy'));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: mockRecord });
  });
});
