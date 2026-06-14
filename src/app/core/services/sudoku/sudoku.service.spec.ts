import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { SudokuService } from './sudoku.service';
import { SudokuPuzzle } from '../../../shared/models/game.model';

describe('SudokuService', () => {
  let service: SudokuService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SudokuService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call generate endpoint with difficulty param', () => {
    const mockPuzzle: SudokuPuzzle = {
      difficulty: 'easy',
      puzzle: Array.from({ length: 9 }, () => Array(9).fill(0)),
      solution: Array.from({ length: 9 }, () => Array(9).fill(1)),
    };

    service.generate('easy').subscribe((result) => {
      expect(result).toEqual(mockPuzzle);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/sudoku/generate') && r.params.get('difficulty') === 'easy');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', success: true, data: mockPuzzle });
  });
});
