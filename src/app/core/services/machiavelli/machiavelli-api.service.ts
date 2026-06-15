import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/models/api-response.model';
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

  getRecord(): Observable<MachiavelliRecord> {
    return this.http
      .get<ApiResponse<MachiavelliRecord>>(`${this.API_URL}/records`)
      .pipe(map((res) => res.data));
  }
}
