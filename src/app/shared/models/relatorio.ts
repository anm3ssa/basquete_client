import { Evento } from './evento';

/** Distribuição de atletas por categoria (chave = nome da categoria). */
export type DistribuicaoCategorias = Record<string, number>;

/** Extrato resumido de estoque. */
export interface ExtratoEstoque {
  itensComEstoqueBaixo: string[];
  totalItensCadastrados: number;
  /** ISO yyyy-MM-dd */
  dataGeracao: string;
}

/** Avaliação de desempenho individual (relatório). */
export interface AvaliacaoDesempenho {
  id: number | string;
  atletaId: number | string;
  treinoId?: number | string | null;
  notaFisica?: number | null;
  notaTatica?: number | null;
  notaTecnica?: number | null;
  comentarios?: string | null;
  status?: string | null;
}

/** Retrospectiva anual: eventos (treinos/jogos) do ano. */
export type RetrospectivaAno = Evento[];
