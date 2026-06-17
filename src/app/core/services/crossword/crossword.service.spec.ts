import { CrosswordService } from './crossword.service';
import { setupHttpServiceTest } from '../../../core/utils/testing/http-service-test';
import { mockCrossword } from '../../../shared/testing/crossword-fixtures';

describe('CrosswordService', () => {
  const { service, mock } = setupHttpServiceTest(CrosswordService);

  it('should be created', () => {
    expect(service()).toBeTruthy();
  });

  it('should call the generate endpoint with the difficulty and unwrap data', () => {
    const mockCw = mockCrossword();

    service()
      .generate('hard')
      .subscribe((result) => {
        expect(result).toEqual(mockCw);
      });

    const req = mock().expectOne(
      (r) => r.url.includes('/crossword/generate') && r.params.get('difficulty') === 'hard'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: mockCw });
  });

  it('POSTs a game completion to /crossword/games', () => {
    service().saveGame({ difficulty: 'medium', time_seconds: 540 }).subscribe();

    const req = mock().expectOne((r) => r.url.endsWith('/crossword/games') && r.method === 'POST');
    expect(req.request.body).toEqual({ difficulty: 'medium', time_seconds: 540 });
    req.flush({ status: 'success', success: true, data: { id: 1 } });
  });

  it('GETs the records and unwraps data', () => {
    const records = [{ difficulty: 'easy' as const, best_time_seconds: 240 }];

    service().getRecords().subscribe((result) => {
      expect(result).toEqual(records);
    });

    const req = mock().expectOne((r) => r.url.endsWith('/crossword/records'));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: records });
  });

  it('GETs the paginated history with optional difficulty filter', () => {
    service().getHistory({ difficulty: 'hard', page: 1, limit: 15 }).subscribe();

    const req = mock().expectOne((r) => r.url.endsWith('/crossword/games') && r.method === 'GET');
    expect(req.request.params.get('difficulty')).toBe('hard');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('15');
    req.flush({
      status: 'success',
      success: true,
      data: { data: [], pagination: { total: 0, page: 1, limit: 15, totalPages: 0 } },
    });
  });
});
