import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Crossword, CrosswordDifficulty } from '../../../shared/models/crossword.model';

@Injectable({ providedIn: 'root' })
export class CrosswordService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/crossword`;

  generate(difficulty: CrosswordDifficulty = 'medium'): Observable<Crossword> {
    const params = new HttpParams().set('difficulty', difficulty);
    return this.http
      .get<ApiResponse<Crossword>>(`${this.API_URL}/generate`, { params })
      .pipe(map((res) => res.data));
  }
}
