import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HistoricoLesao, HistoricoLesaoPayload } from '../../shared/models';
import { API_URL } from './auth';

/** Histórico de lesões do atleta. */
@Injectable({ providedIn: 'root' })
export class HistoricoLesaoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/historico-lesoes`;

  listarPorAtleta(atletaId: number | string): Observable<HistoricoLesao[]> {
    return this.http.get<HistoricoLesao[]>(`${this.url}/atleta/${atletaId}`);
  }

  registrar(lesao: HistoricoLesaoPayload): Observable<HistoricoLesao> {
    return this.http.post<HistoricoLesao>(this.url, lesao);
  }
}
