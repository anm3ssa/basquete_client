/** Linha de box score: números de um atleta em um jogo. */
export interface EstatisticaAtleta {
  atletaId: string;
  atletaNome: string;
  numero: number;
  jogoId: string;
  /** ISO da data do jogo (vem nas consultas de evolução) */
  data?: string;
  adversario?: string;
  minutos: number;
  assistencias: number;
  rebotes: number;
  tocos: number;
  roubos: number;
  /** Lance livre (FT) */
  lanceLivreConvertidos: number;
  lanceLivreTentados: number;
  /** Arremesso de 2 pontos (2PT) */
  doisPontosConvertidos: number;
  doisPontosTentados: number;
  /** Arremesso de 3 pontos (3PT) */
  tresPontosConvertidos: number;
  tresPontosTentados: number;
}

/** Os pontos não são digitados: saem dos arremessos convertidos. */
export function calcularPontos(
  e: Pick<EstatisticaAtleta, 'lanceLivreConvertidos' | 'doisPontosConvertidos' | 'tresPontosConvertidos'>,
): number {
  return e.lanceLivreConvertidos + e.doisPontosConvertidos * 2 + e.tresPontosConvertidos * 3;
}

/** Percentual de conversão (0–100) ou null quando não houve tentativa. */
export function percentual(convertidos: number, tentados: number): number | null {
  return tentados > 0 ? Math.round((convertidos / tentados) * 1000) / 10 : null;
}

// ---------------------------------------------------------------------------
// Registro do jogo (lance a lance), feito pelo treinador durante a partida
// ---------------------------------------------------------------------------

export type TipoLance =
  | 'LL_CONVERTIDO'
  | 'LL_ERRADO'
  | 'DOIS_CONVERTIDO'
  | 'DOIS_ERRADO'
  | 'TRES_CONVERTIDO'
  | 'TRES_ERRADO'
  | 'REBOTE'
  | 'ASSISTENCIA'
  | 'TOCO'
  | 'ROUBO';

export interface Lance {
  id: string;
  atletaId: string;
  tipo: TipoLance;
  /** 1 a 4; 5 = prorrogação */
  periodo: number;
  /** ISO de quando foi marcado */
  registradoEm: string;
}

/** Corpo/resposta de GET e PUT /jogos/{id}/registro */
export interface RegistroLances {
  lances: Lance[];
  placarAdversario: number;
}
