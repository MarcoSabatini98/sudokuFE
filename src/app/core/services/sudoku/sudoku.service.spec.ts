import { SudokuService } from './sudoku.service';
import { SudokuPuzzle } from '../../../shared/models/game.model';
import { setupHttpServiceTest } from '../../../core/utils/testing/http-service-test';

describe('SudokuService', () => {
  const { service, mock } = setupHttpServiceTest(SudokuService);

  it('should be created', () => {
    expect(service()).toBeTruthy();
  });

  it('should call generate endpoint with difficulty param', () => {
    const mockPuzzle: SudokuPuzzle = {
      difficulty: 'easy',
      puzzle: Array.from({ length: 9 }, () => Array(9).fill(0)),
      solution: Array.from({ length: 9 }, () => Array(9).fill(1)),
    };

    service().generate('easy').subscribe((result) => {
      expect(result).toEqual(mockPuzzle);
    });

    const req = mock().expectOne(
      (r) => r.url.includes('/sudoku/generate') && r.params.get('difficulty') === 'easy'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: mockPuzzle });
  });
});
