import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Atleta, AtletaPayload } from '../../shared/models';
import { API_URL } from './auth';

/** Gestão do elenco (ROLE_TREINADOR). */
@Injectable({ providedIn: 'root' })
export class AtletaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/atletas`;

  listar(): Observable<Atleta[]> {
    return this.http.get<Atleta[]>(this.url);
  }

  criar(atleta: AtletaPayload): Observable<Atleta> {
    return this.http.post<Atleta>(this.url, atleta);
  }

  atualizar(id: string, atleta: AtletaPayload): Observable<Atleta> {
    return this.http.put<Atleta>(`${this.url}/${id}`, atleta);
  }

  /** Inativar não apaga: o atleta some das convocações, mas o histórico fica. */
  alterarStatus(id: string, ativo: boolean): Observable<Atleta> {
    return this.http.patch<Atleta>(`${this.url}/${id}/status`, { ativo });
  }
}
