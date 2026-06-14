import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Difficulty } from '../../../shared/models/game.model';
import { Record } from '../../../shared/models/record.model';

@Injectable({ providedIn: 'root' })
export class RecordService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/records`;

  getAll(): Observable<Record[]> {
    return this.http
      .get<ApiResponse<Record[]>>(this.API_URL)
      .pipe(map((res) => res.data));
  }

  getByDifficulty(difficulty: Difficulty): Observable<Record | null> {
    return this.http
      .get<ApiResponse<Record | null>>(`${this.API_URL}/${difficulty}`)
      .pipe(map((res) => res.data));
  }
}
