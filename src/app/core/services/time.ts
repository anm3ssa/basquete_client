import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Time } from '../../shared/models';
import { API_URL } from './auth';

/** Comissão técnica e elenco, como o atleta enxerga. */
@Injectable({ providedIn: 'root' })
export class TimeService {
  private readonly http = inject(HttpClient);

  meuTime(): Observable<Time> {
    return this.http.get<Time>(`${API_URL}/time`);
  }
}
