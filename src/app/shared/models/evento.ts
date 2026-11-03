export type TipoEvento = 'TREINO' | 'JOGO';
export type StatusPresenca = 'PENDENTE' | 'CONFIRMADO' | 'AUSENTE';

interface EventoBase {
  id: string;
  tipo: TipoEvento;
  /** ISO 8601 com fuso, ex.: 2026-11-04T19:30:00-03:00 */
  inicio: string;
  fim: string;
  local: string;
  /** anotações técnicas do treinador (visíveis ao atleta) */
  anotacoes?: string;
  /** presença do atleta. ROLE_ATLETA. */
  minhaPresenca?: StatusPresenca;
  /** resumo da convocação. ROLE_TREINADOR. */
  resumoPresenca?: ResumoPresenca;
}

export interface Treino extends EventoBase {
  tipo: 'TREINO';
  /** foco do treino */
  foco?: string;
}

export interface Jogo extends EventoBase {
  tipo: 'JOGO';
  adversario: string;
  mandante: boolean;
  placarTime?: number | null;
  placarAdversario?: number | null;
}

export type Evento = Treino | Jogo;

export type EventoPayload = Omit<Treino, 'id' | 'minhaPresenca' | 'resumoPresenca'> | Omit<Jogo, 'id' | 'minhaPresenca' | 'resumoPresenca'>;

export interface ResumoPresenca {
  convocados: number;
  confirmados: number;
  ausentes: number;
  pendentes: number;
}

export interface Presenca {
  atletaId: string;
  atletaNome: string;
  numero: number;
  status: StatusPresenca;
  justificativa?: string;
}

export interface ConfirmacaoPresencaRequest {
  status: Exclude<StatusPresenca, 'PENDENTE'>;
  /** obrigatória quando status = AUSENTE */
  justificativa?: string;
}

/** ficha de participação  */
export interface Convocacao {
  eventoId: string;
  geradaEm: string;
  atletas: Pick<Presenca, 'atletaId' | 'atletaNome' | 'numero' | 'status'>[];
}

/** "em casa" ou "fora", mostra junto do nome do adversário */
export function rotuloMando(jogo: Pick<Jogo, 'mandante'>): string {
  return jogo.mandante ? 'Em casa' : 'Fora';
}
