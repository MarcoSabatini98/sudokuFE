import { GameService } from './game.service';
import { Game, SaveGamePayload } from '../../../shared/models/game.model';
import { PaginatedData } from '../../../shared/models/api-response.model';
import { setupHttpServiceTest } from '../../../core/utils/testing/http-service-test';

describe('GameService', () => {
  const { service, mock } = setupHttpServiceTest(GameService);

  const mockGame: Game = {
    id: 1,
    difficulty: 'easy',
    time_seconds: 120,
    completed: true,
    played_at: new Date().toISOString(),
  };

  it('should be created', () => {
    expect(service()).toBeTruthy();
  });

  it('getAll should call GET /games', () => {
    const mockResponse: PaginatedData<Game> = {
      data: [mockGame],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };

    service().getAll().subscribe((res) => {
      expect(res.data).toHaveLength(1);
      expect(res.data[0].difficulty).toBe('easy');
    });

    const req = mock().expectOne((r) => r.url.includes('/games'));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: mockResponse });
  });

  it('save should call POST /games', () => {
    const payload: SaveGamePayload = { difficulty: 'easy', time_seconds: 120, completed: true };

    service().save(payload).subscribe((res) => {
      expect(res.id).toBe(1);
    });

    const req = mock().expectOne((r) => r.url.includes('/games'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ status: 'success', success: true, data: mockGame });
  });
});
