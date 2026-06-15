import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Crossword } from '../../../shared/models/crossword.model';

@Injectable({ providedIn: 'root' })
export class CrosswordService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/crossword`;

  generate(): Observable<Crossword> {
    return this.http
      .get<ApiResponse<Crossword>>(`${this.API_URL}/generate`)
      .pipe(map((res) => res.data));
  }
}
