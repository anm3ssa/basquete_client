export type Posicao = 'ARMADOR' | 'ALA_ARMADOR' | 'ALA' | 'ALA_PIVO' | 'PIVO';

export const POSICOES: { valor: Posicao; rotulo: string; sigla: string }[] = [
  { valor: 'ARMADOR', rotulo: 'Armador', sigla: 'PG' },
  { valor: 'ALA_ARMADOR', rotulo: 'Ala-armador', sigla: 'SG' },
  { valor: 'ALA', rotulo: 'Ala', sigla: 'SF' },
  { valor: 'ALA_PIVO', rotulo: 'Ala-pivô', sigla: 'PF' },
  { valor: 'PIVO', rotulo: 'Pivô', sigla: 'C' },
];

export function rotuloPosicao(posicao: Posicao): string {
  return POSICOES.find((p) => p.valor === posicao)?.rotulo ?? posicao;
}

export interface Atleta {
  id: string;
  nome: string;
  /** só dígitos */
  cpf: string;
  /** ISO yyyy-MM-dd */
  dataNascimento: string;
  email: string;
  /** só dígitos com DDD */
  telefone: string;
  numero: number;
  posicao: Posicao;
  fotoUrl?: string | null;
  ativo: boolean;
}

export type AtletaPayload = Omit<Atleta, 'id' | 'ativo'>;

export interface Treinador {
  id: string;
  nome: string;
  /** ex.: "Treinador principal", "Assistente", "Preparador físico" */
  cargo: string;
  email: string;
  telefone: string;
  fotoUrl?: string | null;
}

/** Resposta de GET /time (visão do atleta). */
export interface Time {
  nome: string;
  comissaoTecnica: Treinador[];
  elenco: Atleta[];
}
