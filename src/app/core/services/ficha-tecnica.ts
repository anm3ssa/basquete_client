import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { FichaTecnica, FichaTecnicaPayload } from '../../shared/models';
import { API_URL } from './auth';

/** Ficha técnica (perfil físico/técnico) do atleta. */
@Injectable({ providedIn: 'root' })
export class FichaTecnicaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/fichas-tecnicas`;

  /** Retorna null quando o atleta ainda não possui ficha. */
  buscarPorAtleta(atletaId: number | string): Observable<FichaTecnica | null> {
    return this.http.get<FichaTecnica>(`${this.url}/atleta/${atletaId}`).pipe(
      catchError((err) => (err?.status === 404 ? of(null) : (() => { throw err; })())),
    );
  }

  /** Cria ou atualiza (upsert) a ficha técnica do atleta. */
  salvar(ficha: FichaTecnicaPayload): Observable<FichaTecnica> {
    return this.http.post<FichaTecnica>(this.url, ficha);
  }
}
