import { EstatisticaAtleta, Lance, TipoLance } from './models';

/** Como cada lance aparece na tela e quantos pontos vale */
export const LANCES: Record<TipoLance, { rotulo: string; curto: string; pontos: number }> = {
  LL_CONVERTIDO: { rotulo: 'Lance livre convertido', curto: 'LL ✓', pontos: 1 },
  LL_ERRADO: { rotulo: 'Lance livre errado', curto: 'LL ✗', pontos: 0 },
  DOIS_CONVERTIDO: { rotulo: 'Cesta de 2', curto: '2 pts ✓', pontos: 2 },
  DOIS_ERRADO: { rotulo: 'Arremesso de 2 errado', curto: '2 pts ✗', pontos: 0 },
  TRES_CONVERTIDO: { rotulo: 'Cesta de 3', curto: '3 pts ✓', pontos: 3 },
  TRES_ERRADO: { rotulo: 'Arremesso de 3 errado', curto: '3 pts ✗', pontos: 0 },
  REBOTE: { rotulo: 'Rebote', curto: 'Rebote', pontos: 0 },
  ASSISTENCIA: { rotulo: 'Assistência', curto: 'Assistência', pontos: 0 },
  TOCO: { rotulo: 'Toco', curto: 'Toco', pontos: 0 },
  ROUBO: { rotulo: 'Roubo de bola', curto: 'Roubo', pontos: 0 },
};

export function rotuloPeriodo(periodo: number): string {
  return periodo >= 5 ? 'Prorrogação' : `${periodo}º quarto`;
}

export interface AtletaDoJogo {
  atletaId: string;
  atletaNome: string;
  numero: number;
}

/** Pontos marcados pelos lances (de um atleta ou do time todo) */
export function pontosDosLances(lances: Lance[]): number {
  return lances.reduce((total, l) => total + LANCES[l.tipo].pontos, 0);
}

/**
 * Transforma o registro lance a lance no box score do jogo (uma linha por atleta).
 * Os minutos não saem dos lances: vêm do box score anterior, se existir.
 */
export function boxScoreDoRegistro(
  jogoId: string,
  atletas: AtletaDoJogo[],
  lances: Lance[],
  minutosAnteriores: Record<string, number> = {},
): EstatisticaAtleta[] {
  return atletas.map((a) => {
    const conta = (tipo: TipoLance) => lances.filter((l) => l.atletaId === a.atletaId && l.tipo === tipo).length;
    const llC = conta('LL_CONVERTIDO');
    const doisC = conta('DOIS_CONVERTIDO');
    const tresC = conta('TRES_CONVERTIDO');
    return {
      atletaId: a.atletaId,
      atletaNome: a.atletaNome,
      numero: a.numero,
      jogoId,
      minutos: minutosAnteriores[a.atletaId] ?? 0,
      lanceLivreConvertidos: llC,
      lanceLivreTentados: llC + conta('LL_ERRADO'),
      doisPontosConvertidos: doisC,
      doisPontosTentados: doisC + conta('DOIS_ERRADO'),
      tresPontosConvertidos: tresC,
      tresPontosTentados: tresC + conta('TRES_ERRADO'),
      rebotes: conta('REBOTE'),
      assistencias: conta('ASSISTENCIA'),
      tocos: conta('TOCO'),
      roubos: conta('ROUBO'),
    };
  });
}
