import { CrosswordService } from './crossword.service';
import { setupHttpServiceTest } from '../../../core/utils/testing/http-service-test';
import { mockCrossword } from '../../../shared/testing/crossword-fixtures';

describe('CrosswordService', () => {
  const { service, mock } = setupHttpServiceTest(CrosswordService);

  it('should be created', () => {
    expect(service()).toBeTruthy();
  });

  it('should call the generate endpoint and unwrap data', () => {
    const mockCw = mockCrossword();

    service()
      .generate()
      .subscribe((result) => {
        expect(result).toEqual(mockCw);
      });

    const req = mock().expectOne((r) => r.url.includes('/crossword/generate'));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: mockCw });
  });
});
