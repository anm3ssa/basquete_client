/** Registro de lesão/histórico médico do atleta. */
export interface HistoricoLesao {
  id?: number | string;
  atletaId: number | string;
  registradoPorUsuarioId?: number | string | null;
  /** ISO yyyy-MM-dd */
  dataInicio: string;
  /** ISO yyyy-MM-dd */
  dataRetorno?: string | null;
  descricaoLesao: string;
  procedimentosRealizados?: string | null;
  medicamentos?: string | null;
  periodoRepouso?: string | null;
}

export type HistoricoLesaoPayload = Omit<HistoricoLesao, 'id' | 'registradoPorUsuarioId'>;
