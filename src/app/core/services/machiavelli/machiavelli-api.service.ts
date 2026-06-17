import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedData } from '../../../shared/models/api-response.model';
import { toHttpParams } from '../../utils/http-params';
import { BotDifficulty } from '../../constants/machiavelli.constants';
import {
  MachiavelliGame,
  MachiavelliGameResult,
  MachiavelliRecord,
} from '../../../shared/models/machiavelli-game.model';

@Injectable({ providedIn: 'root' })
export class MachiavelliApiService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/machiavelli`;

  saveGame(payload: MachiavelliGameResult): Observable<MachiavelliGame> {
    return this.http
      .post<ApiResponse<MachiavelliGame>>(this.API_URL, payload)
      .pipe(map((res) => res.data));
  }

  getHistory(
    filters: { bot_difficulty?: BotDifficulty; page?: number; limit?: number } = {}
  ): Observable<PaginatedData<MachiavelliGame>> {
    return this.http
      .get<ApiResponse<PaginatedData<MachiavelliGame>>>(this.API_URL, { params: toHttpParams(filters) })
      .pipe(map((res) => res.data));
  }

  getRecords(): Observable<MachiavelliRecord[]> {
    return this.http
      .get<ApiResponse<MachiavelliRecord[]>>(`${this.API_URL}/records`)
      .pipe(map((res) => res.data));
  }
}
