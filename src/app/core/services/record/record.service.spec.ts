import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { RecordService } from './record.service';
import { Record } from '../../../shared/models/record.model';

describe('RecordService', () => {
  let service: RecordService;
  let httpMock: HttpTestingController;

  const mockRecord: Record = {
    id: 1,
    difficulty: 'easy',
    best_time_seconds: 90,
    game_id: 1,
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecordService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAll should call GET /records', () => {
    service.getAll().subscribe((records) => {
      expect(records).toHaveLength(1);
      expect(records[0].difficulty).toBe('easy');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/records'));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: [mockRecord] });
  });

  it('getByDifficulty should call GET /records/:difficulty', () => {
    service.getByDifficulty('easy').subscribe((record) => {
      expect(record?.best_time_seconds).toBe(90);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/records/easy'));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: mockRecord });
  });
});
