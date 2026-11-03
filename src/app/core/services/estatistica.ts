import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EstatisticaAtleta, RegistroLances } from '../../shared/models';
import { API_URL } from './auth';

@Injectable({ providedIn: 'root' })
export class EstatisticaService {
  private readonly http = inject(HttpClient);

  /** Atleta: os próprios números, jogo a jogo, em ordem cronológica. */
  meuDesempenho(): Observable<EstatisticaAtleta[]> {
    return this.http.get<EstatisticaAtleta[]>(`${API_URL}/estatisticas/me`);
  }

  /** Treinador: box score de um jogo (uma linha por atleta relacionado). */
  boxScore(jogoId: string): Observable<EstatisticaAtleta[]> {
    return this.http.get<EstatisticaAtleta[]>(`${API_URL}/jogos/${jogoId}/estatisticas`);
  }

  salvarBoxScore(jogoId: string, linhas: EstatisticaAtleta[]): Observable<EstatisticaAtleta[]> {
    return this.http.put<EstatisticaAtleta[]>(`${API_URL}/jogos/${jogoId}/estatisticas`, linhas);
  }

  /** Treinador: registro lance a lance do jogo (vazio se ainda não houver). */
  registro(jogoId: string): Observable<RegistroLances> {
    return this.http.get<RegistroLances>(`${API_URL}/jogos/${jogoId}/registro`);
  }

  /** Salva o registro lance a lance; o back-end atualiza o placar do jogo. */
  salvarRegistro(jogoId: string, registro: RegistroLances): Observable<RegistroLances> {
    return this.http.put<RegistroLances>(`${API_URL}/jogos/${jogoId}/registro`, registro);
  }
}
