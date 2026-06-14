import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Difficulty, SudokuPuzzle } from '../../../shared/models/game.model';

@Injectable({ providedIn: 'root' })
export class SudokuService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/sudoku`;

  generate(difficulty: Difficulty): Observable<SudokuPuzzle> {
    const params = new HttpParams().set('difficulty', difficulty);
    return this.http
      .get<ApiResponse<SudokuPuzzle>>(`${this.API_URL}/generate`, { params })
      .pipe(map((res) => res.data));
  }
}
