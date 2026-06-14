import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedData } from '../../../shared/models/api-response.model';
import { Difficulty, Game, SaveGamePayload } from '../../../shared/models/game.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/games`;

  getAll(filters: { difficulty?: Difficulty; page?: number; limit?: number } = {}): Observable<PaginatedData<Game>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params = params.set(key, String(value));
    });
    return this.http
      .get<ApiResponse<PaginatedData<Game>>>(this.API_URL, { params })
      .pipe(map((res) => res.data));
  }

  save(payload: SaveGamePayload): Observable<Game> {
    return this.http
      .post<ApiResponse<Game>>(this.API_URL, payload)
      .pipe(map((res) => res.data));
  }
}
