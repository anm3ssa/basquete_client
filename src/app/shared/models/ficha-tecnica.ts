/** Ficha técnica (perfil físico/técnico) do atleta. */
export interface FichaTecnica {
  id?: number | string;
  atletaId: number | string;
  altura?: number | null;
  peso?: number | null;
  experienciaAnos?: number | null;
  historicoDoencas?: string | null;
  medicamentosUsoContinuo?: string | null;
  /** ISO date-time */
  dataAtualizacao?: string | null;
}

export type FichaTecnicaPayload = Omit<FichaTecnica, 'id' | 'dataAtualizacao'>;
