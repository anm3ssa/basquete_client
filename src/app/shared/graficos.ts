import { calcularPontos, EstatisticaAtleta, percentual } from '../shared/models';

type ChartData<T extends 'line' | 'bar'> = {
  labels: string[];
  datasets: Array<{ label: string; data: Array<number | null>; [key: string]: any }>;
};

type ChartOptions = Record<string, any>;

/**
 * Cores dos gráficos. O Chart.js desenha em <canvas> e não lê variáveis CSS,
 * então os tons da paleta (styles.css) são repetidos aqui.
 */
export const CORES = {
  laranja: '#ff5f00',
  laranjaClaro: '#ff9a5c',
  laranjaEscuro: '#a33e00',
  preto: '#2a2a2a',
  cinza: '#9e9e9e',
  cinzaClaro: '#d6d6d6',
  grade: '#e6e6e6',
};

const fonte = { family: "'Inter', ui-sans-serif, system-ui, sans-serif" };

/** Opções comuns: responsivo, legenda embaixo, eixos discretos. */
export function opcoesBase(sufixoY = '', maxY?: number): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, font: fonte, color: CORES.preto } },
      tooltip: {
        callbacks: sufixoY
          ? { label: (ctx: { dataset: { label: string }; formattedValue: string }) => `${ctx.dataset.label}: ${ctx.formattedValue}${sufixoY}` }
          : {},
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: fonte, color: CORES.preto } },
      y: {
        beginAtZero: true,
        max: maxY,
        grid: { color: CORES.grade },
        border: { display: false },
        ticks: { font: fonte, color: CORES.preto, callback: (v: string | number) => `${v}${sufixoY}` },
      },
    },
  };
}

/** Rótulo do eixo X: "Tigres de Marília (04/11)" */
export function rotuloJogo(e: Pick<EstatisticaAtleta, 'data' | 'adversario'>): string {
  const data = e.data ? new Date(e.data) : null;
  const dia = data ? data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
  if (!e.adversario) return dia;
  return dia ? `${e.adversario} (${dia})` : e.adversario;
}

/** Atleta: evolução jogo a jogo de pontos, assistências, rebotes e tocos (linhas). */
export function graficoEvolucao(jogos: EstatisticaAtleta[]): ChartData<'line'> {
  const serie = (label: string, cor: string, valor: (e: EstatisticaAtleta) => number) => ({
    label,
    data: jogos.map(valor),
    borderColor: cor,
    backgroundColor: cor,
    tension: 0.3,
    pointRadius: 4,
  });
  return {
    labels: jogos.map(rotuloJogo),
    datasets: [
      serie('Pontos', CORES.laranja, calcularPontos),
      serie('Assistências', CORES.preto, (e) => e.assistencias),
      serie('Rebotes', CORES.laranjaEscuro, (e) => e.rebotes),
      serie('Tocos', CORES.cinza, (e) => e.tocos),
    ],
  };
}

/** Percentuais FT / 2PT / 3PT por jogo (barras). Sem tentativa = barra vazia. */
export function graficoAproveitamento(jogos: EstatisticaAtleta[]): ChartData<'bar'> {
  const serie = (label: string, cor: string, valor: (e: EstatisticaAtleta) => number | null) => ({
    label,
    data: jogos.map(valor),
    backgroundColor: cor,
    borderRadius: 6,
    maxBarThickness: 28,
  });
  return {
    labels: jogos.map(rotuloJogo),
    datasets: [
      serie('Lance livre (FT)', CORES.cinza, (e) => percentual(e.lanceLivreConvertidos, e.lanceLivreTentados)),
      serie('2 pontos (2PT)', CORES.laranjaEscuro, (e) => percentual(e.doisPontosConvertidos, e.doisPontosTentados)),
      serie('3 pontos (3PT)', CORES.laranja, (e) => percentual(e.tresPontosConvertidos, e.tresPontosTentados)),
    ],
  };
}

/** Treinador: números de cada atleta no jogo (barras agrupadas). */
export function graficoBoxScore(linhas: EstatisticaAtleta[]): ChartData<'bar'> {
  const serie = (label: string, cor: string, valor: (e: EstatisticaAtleta) => number) => ({
    label,
    data: linhas.map(valor),
    backgroundColor: cor,
    borderRadius: 6,
    maxBarThickness: 22,
  });
  return {
    labels: linhas.map((l) => `#${l.numero} ${primeiroNome(l.atletaNome)}`),
    datasets: [
      serie('Pontos', CORES.laranja, calcularPontos),
      serie('Rebotes', CORES.laranjaEscuro, (e) => e.rebotes),
      serie('Assistências', CORES.preto, (e) => e.assistencias),
      serie('Tocos', CORES.cinza, (e) => e.tocos),
    ],
  };
}

/** Treinador: aproveitamento de cada atleta no jogo. */
export function graficoArremessosPorAtleta(linhas: EstatisticaAtleta[]): ChartData<'bar'> {
  const base = graficoAproveitamento(linhas);
  return { ...base, labels: linhas.map((l) => `#${l.numero} ${primeiroNome(l.atletaNome)}`) };
}

export interface Medias {
  jogos: number;
  pontos: number;
  assistencias: number;
  rebotes: number;
  tocos: number;
  ft: number | null;
  dois: number | null;
  tres: number | null;
}

/** Médias por jogo e aproveitamento acumulado. */
export function calcularMedias(jogos: EstatisticaAtleta[]): Medias {
  const n = jogos.length;
  const soma = (f: (e: EstatisticaAtleta) => number) => jogos.reduce((acc, e) => acc + f(e), 0);
  const media = (f: (e: EstatisticaAtleta) => number) => (n ? Math.round((soma(f) / n) * 10) / 10 : 0);
  return {
    jogos: n,
    pontos: media(calcularPontos),
    assistencias: media((e) => e.assistencias),
    rebotes: media((e) => e.rebotes),
    tocos: media((e) => e.tocos),
    ft: percentual(soma((e) => e.lanceLivreConvertidos), soma((e) => e.lanceLivreTentados)),
    dois: percentual(soma((e) => e.doisPontosConvertidos), soma((e) => e.doisPontosTentados)),
    tres: percentual(soma((e) => e.tresPontosConvertidos), soma((e) => e.tresPontosTentados)),
  };
}

function primeiroNome(nome: string): string {
  return nome.split(' ')[0];
}
