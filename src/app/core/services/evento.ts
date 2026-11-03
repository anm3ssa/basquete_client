import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ConfirmacaoPresencaRequest,
  Convocacao,
  Evento,
  EventoPayload,
  Presenca,
  TipoEvento,
} from '../../shared/models';
import { API_URL } from './auth';

export interface FiltroEventos {
  /** ISO yyyy-MM-dd */
  de: string;
  /** ISO yyyy-MM-dd */
  ate: string;
  tipo?: TipoEvento;
}

/** Treinos e jogos. As respostas variam conforme o perfil do token (ver models/evento). */
@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/eventos`;

  listar(filtro: FiltroEventos): Observable<Evento[]> {
    let params = new HttpParams().set('de', filtro.de).set('ate', filtro.ate);
    if (filtro.tipo) params = params.set('tipo', filtro.tipo);
    return this.http.get<Evento[]>(this.url, { params });
  }

  buscar(id: string): Observable<Evento> {
    return this.http.get<Evento>(`${this.url}/${id}`);
  }

  /** Próximo evento a partir de agora (ou null). */
  proximo(): Observable<Evento | null> {
    return this.http.get<Evento | null>(`${this.url}/proximo`);
  }

  // ---------- Atleta ----------

  responderPresenca(eventoId: string, resposta: ConfirmacaoPresencaRequest): Observable<Evento> {
    return this.http.put<Evento>(`${this.url}/${eventoId}/minha-presenca`, resposta);
  }

  // ---------- Treinador ----------

  criar(evento: EventoPayload): Observable<Evento> {
    return this.http.post<Evento>(this.url, evento);
  }

  atualizar(id: string, evento: EventoPayload): Observable<Evento> {
    return this.http.put<Evento>(`${this.url}/${id}`, evento);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  presencas(eventoId: string): Observable<Presenca[]> {
    return this.http.get<Presenca[]>(`${this.url}/${eventoId}/presencas`);
  }

  /** Convoca os atletas e devolve a ficha de participação. */
  convocar(eventoId: string, atletaIds: string[]): Observable<Convocacao> {
    return this.http.post<Convocacao>(`${this.url}/${eventoId}/convocacao`, { atletaIds });
  }
}
