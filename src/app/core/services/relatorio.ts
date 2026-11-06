import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AvaliacaoDesempenho, DistribuicaoCategorias, ExtratoEstoque, RetrospectivaAno } from '../../shared/models';
import { API_URL } from './auth';

/** Relatórios e analytics. */
@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/relatorios`;

  desempenhoIndividual(atletaId: number | string): Observable<AvaliacaoDesempenho[]> {
    return this.http.get<AvaliacaoDesempenho[]>(`${this.url}/desempenho-individual/${atletaId}`);
  }

  retrospectivaAno(ano: number): Observable<RetrospectivaAno> {
    return this.http.get<RetrospectivaAno>(`${this.url}/retrospectiva-ano/${ano}`);
  }

  distribuicaoCategorias(): Observable<DistribuicaoCategorias> {
    return this.http.get<DistribuicaoCategorias>(`${this.url}/distribuicao-categorias`);
  }

  extratoEstoque(): Observable<ExtratoEstoque> {
    return this.http.get<ExtratoEstoque>(`${this.url}/extrato-estoque`);
  }
}
