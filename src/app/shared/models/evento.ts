export type TipoEvento = 'TREINO' | 'JOGO';
export type StatusPresenca = 'PENDENTE' | 'CONFIRMADO' | 'AUSENTE';

interface EventoBase {
  id: string;
  tipo: TipoEvento;
  /** ISO 8601 com fuso, ex.: 2026-11-04T19:30:00-03:00 */
  inicio: string;
  fim: string;
  local: string;
  /** Anotações técnicas do treinador (visíveis ao atleta) */
  anotacoes?: string;
  /** Presença do atleta logado. Só vem para ROLE_ATLETA. */
  minhaPresenca?: StatusPresenca;
  /** Resumo da convocação. Só vem para ROLE_TREINADOR. */
  resumoPresenca?: ResumoPresenca;
}

export interface Treino extends EventoBase {
  tipo: 'TREINO';
  /** Foco do treino, ex.: "Defesa por zona" */
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

/** Corpo de criação/edição (o id vem da URL na edição). */
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
  /** Obrigatória quando status = AUSENTE */
  justificativa?: string;
}

/** Ficha de participação gerada na convocação. */
export interface Convocacao {
  eventoId: string;
  geradaEm: string;
  atletas: Pick<Presenca, 'atletaId' | 'atletaNome' | 'numero' | 'status'>[];
}

/** "Em casa" ou "Fora", para mostrar junto do nome do adversário */
export function rotuloMando(jogo: Pick<Jogo, 'mandante'>): string {
  return jogo.mandante ? 'Em casa' : 'Fora';
}
