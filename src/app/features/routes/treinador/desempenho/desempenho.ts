import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize, map, startWith } from 'rxjs';
import { ComAlteracoesPendentes } from '../../../../core/guards/auth-guard';
import { calcularPontos, EstatisticaAtleta, Jogo, percentual, rotuloMando } from '../../../../shared/models';
import { EstatisticaService } from '../../../../core/services/estatistica';
import { EventoService } from '../../../../core/services/evento';
import { paraIsoData } from '../../../../shared/datas';
import { graficoArremessosPorAtleta, graficoBoxScore, opcoesBase } from '../../../../shared/graficos';
import { convertidosAteTentados } from '../../../../shared/validadores';

/** Campos numéricos editáveis de uma linha do box score */
const CAMPOS = [
  'minutos',
  'lanceLivreConvertidos',
  'lanceLivreTentados',
  'doisPontosConvertidos',
  'doisPontosTentados',
  'tresPontosConvertidos',
  'tresPontosTentados',
  'rebotes',
  'assistencias',
  'tocos',
  'roubos',
] as const;
type Campo = (typeof CAMPOS)[number];

/** Uma linha do formulário: os números + identificação fixa do atleta */
type LinhaForm = FormGroup<
  Record<Campo, FormControl<number>> & {
    atletaId: FormControl<string>;
    atletaNome: FormControl<string>;
    numero: FormControl<number>;
  }
>;

type ModoGrafico = 'numeros' | 'arremessos';

/**
 * Edição do box score de um jogo.
 * - Formulário reativo (FormArray, uma linha por atleta) dentro de uma p-table
 * - Signals derivados do formulário alimentam o gráfico em tempo real, antes de salvar
 * - Avisa antes de sair com alterações não salvas (CanDeactivate)
 */
@Component({
  selector: 'app-treinador-desempenho',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    ChartModule,
    ConfirmDialogModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    SkeletonModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './desempenho.html',
  styleUrl: './desempenho.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreinadorDesempenho implements ComAlteracoesPendentes {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly eventos = inject(EventoService);
  private readonly estatisticas = inject(EstatisticaService);
  private readonly mensagens = inject(MessageService);
  private readonly confirmacao = inject(ConfirmationService);

  /** ?jogo=<id>: abre já neste jogo (ex.: vindo do registro do jogo) */
  readonly jogoInicial = input<string | undefined>(undefined, { alias: 'jogo' });

  // ---------- Seleção do jogo ----------
  protected readonly jogos = signal<Jogo[]>([]);
  protected readonly jogoId = signal<string | null>(null);
  protected readonly jogo = computed(() => this.jogos().find((j) => j.id === this.jogoId()) ?? null);
  protected readonly carregandoJogos = signal(true);
  protected readonly carregandoBox = signal(false);
  protected readonly salvando = signal(false);

  // ---------- Formulário ----------
  protected readonly linhas = this.fb.array<LinhaForm>([]);
  protected readonly campos = CAMPOS;

  /** Snapshot do que veio da API, para "descartar" e detectar alterações */
  private readonly original = signal<EstatisticaAtleta[]>([]);

  /** Valores atuais do formulário como signal: atualiza a cada tecla */
  protected readonly valores = toSignal(
    this.linhas.valueChanges.pipe(
      startWith(null),
      map(() => this.linhas.getRawValue()),
    ),
    { initialValue: [] },
  );

  /** Linhas completas (identificação + números), prontas para gráfico e envio */
  protected readonly linhasAtuais = computed<EstatisticaAtleta[]>(() => {
    const jogoId = this.jogoId() ?? '';
    return this.valores().map((v) => ({ ...v, jogoId }));
  });

  protected readonly alterado = computed(
    () => JSON.stringify(this.linhasAtuais().map(numeros)) !== JSON.stringify(this.original().map(numeros)),
  );

  protected readonly temErro = toSignal(this.linhas.statusChanges.pipe(map((s) => s === 'INVALID')), {
    initialValue: false,
  });

  protected readonly totais = computed(() => {
    const l = this.linhasAtuais();
    const soma = (f: (e: EstatisticaAtleta) => number) => l.reduce((acc, e) => acc + f(e), 0);
    const ftC = soma((e) => e.lanceLivreConvertidos);
    const ftT = soma((e) => e.lanceLivreTentados);
    const doisC = soma((e) => e.doisPontosConvertidos);
    const doisT = soma((e) => e.doisPontosTentados);
    const tresC = soma((e) => e.tresPontosConvertidos);
    const tresT = soma((e) => e.tresPontosTentados);
    return {
      pontos: soma(calcularPontos),
      rebotes: soma((e) => e.rebotes),
      assistencias: soma((e) => e.assistencias),
      tocos: soma((e) => e.tocos),
      roubos: soma((e) => e.roubos),
      minutos: soma((e) => e.minutos),
      ft: `${ftC}/${ftT}`,
      ftPct: percentual(ftC, ftT),
      dois: `${doisC}/${doisT}`,
      doisPct: percentual(doisC, doisT),
      tres: `${tresC}/${tresT}`,
      tresPct: percentual(tresC, tresT),
    };
  });

  // ---------- Gráfico em tempo real ----------
  protected readonly modos: { rotulo: string; valor: ModoGrafico }[] = [
    { rotulo: 'Números', valor: 'numeros' },
    { rotulo: 'Arremessos (%)', valor: 'arremessos' },
  ];
  protected readonly modo = signal<ModoGrafico>('numeros');
  protected readonly dadosGrafico = computed(() =>
    this.modo() === 'numeros'
      ? graficoBoxScore(this.linhasAtuais())
      : graficoArremessosPorAtleta(this.linhasAtuais()),
  );
  private readonly opcoesNumeros = { ...opcoesBase(), animation: { duration: 250 } };
  private readonly opcoesPercentual = { ...opcoesBase('%', 100), animation: { duration: 250 } };
  protected readonly opcoesGrafico = computed(() =>
    this.modo() === 'numeros' ? this.opcoesNumeros : this.opcoesPercentual,
  );

  constructor() {
    const hoje = new Date();
    const inicioTemporada = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1);
    this.eventos
      .listar({ de: paraIsoData(inicioTemporada), ate: paraIsoData(hoje), tipo: 'JOGO' })
      .pipe(finalize(() => this.carregandoJogos.set(false)))
      .subscribe({
        next: (eventos) => {
          // Jogos até hoje (inclusive os de hoje), do mais recente para o mais antigo
          const fimDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
          const jogos = eventos
            .filter((e): e is Jogo => e.tipo === 'JOGO' && new Date(e.inicio) <= fimDeHoje)
            .sort((a, b) => b.inicio.localeCompare(a.inicio));
          this.jogos.set(jogos);
          const pedido = this.jogoInicial();
          if (pedido && !jogos.some((j) => j.id === pedido)) {
            // Jogo pedido fora da lista (ex.: registrado antes da data): busca e põe no topo
            this.eventos.buscar(pedido).subscribe({
              next: (e) => {
                if (e.tipo === 'JOGO') this.jogos.update((l) => [e, ...l]);
                const alvo = e.tipo === 'JOGO' ? e.id : jogos[0]?.id;
                if (alvo) this.selecionarJogo(alvo);
              },
              error: () => jogos.length && this.selecionarJogo(jogos[0].id),
            });
          } else if (jogos.length) {
            this.selecionarJogo(pedido ?? jogos[0].id);
          }
        },
        error: () => this.mensagens.add({ severity: 'error', summary: 'Não foi possível carregar os jogos' }),
      });
  }

  /** "Presidente Prudente (31/10)" */
  protected rotuloJogo(j: Jogo): string {
    const data = new Date(j.inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${j.adversario} (${data})`;
  }

  protected readonly rotuloMando = rotuloMando;

  /** Situação do jogo pelo horário: em andamento, encerrado (com placar) ou ainda vai começar */
  protected situacao(j: Jogo): { rotulo: string; severidade: 'danger' | 'secondary' | 'info'; icone: string } {
    const agora = Date.now();
    const inicio = new Date(j.inicio).getTime();
    const fim = new Date(j.fim).getTime();
    if (agora >= inicio && agora <= fim) return { rotulo: 'Em andamento', severidade: 'danger', icone: 'pi pi-circle-fill' };
    if (agora < inicio) return { rotulo: 'Ainda não começou', severidade: 'info', icone: 'pi pi-clock' };
    const placar = j.placarTime != null && j.placarAdversario != null ? `: ${j.placarTime} x ${j.placarAdversario}` : '';
    return { rotulo: `Encerrado${placar}`, severidade: 'secondary', icone: 'pi pi-flag' };
  }

  /** Troca de jogo pela p-select: pergunta antes se houver alterações */
  protected async trocarJogo(novoId: string | null): Promise<void> {
    if (!novoId || novoId === this.jogoId()) return;
    const anterior = this.jogoId();
    if (await this.podeSair()) {
      this.selecionarJogo(novoId);
    } else {
      // Desfaz a troca visual da p-select
      this.jogoId.set(null);
      queueMicrotask(() => this.jogoId.set(anterior));
    }
  }

  private selecionarJogo(id: string): void {
    this.jogoId.set(id);
    this.carregandoBox.set(true);
    this.estatisticas
      .boxScore(id)
      .pipe(finalize(() => this.carregandoBox.set(false)))
      .subscribe({
        next: (linhas) => this.preencher([...linhas].sort((a, b) => a.numero - b.numero)),
        error: () => this.mensagens.add({ severity: 'error', summary: 'Não foi possível carregar o box score' }),
      });
  }

  private preencher(linhas: EstatisticaAtleta[]): void {
    this.original.set(linhas);
    this.linhas.clear({ emitEvent: false });
    for (const l of linhas) this.linhas.push(this.criarLinha(l), { emitEvent: false });
    this.linhas.markAsPristine();
    this.linhas.updateValueAndValidity(); // emite uma vez: gráfico e totais atualizam
  }

  private criarLinha(e: EstatisticaAtleta): LinhaForm {
    const n = (valor: number, max = 99) => this.fb.control(valor, [Validators.required, Validators.min(0), Validators.max(max)]);
    return this.fb.group(
      {
        atletaId: this.fb.control(e.atletaId),
        atletaNome: this.fb.control(e.atletaNome),
        numero: this.fb.control(e.numero),
        minutos: n(e.minutos, 60),
        lanceLivreConvertidos: n(e.lanceLivreConvertidos),
        lanceLivreTentados: n(e.lanceLivreTentados),
        doisPontosConvertidos: n(e.doisPontosConvertidos),
        doisPontosTentados: n(e.doisPontosTentados),
        tresPontosConvertidos: n(e.tresPontosConvertidos),
        tresPontosTentados: n(e.tresPontosTentados),
        rebotes: n(e.rebotes),
        assistencias: n(e.assistencias),
        tocos: n(e.tocos),
        roubos: n(e.roubos),
      },
      { validators: convertidosAteTentados('lanceLivre', 'doisPontos', 'tresPontos') },
    );
  }

  /** Arremessos com convertidos > tentados, para destacar a célula */
  protected arremessoInvalido(linha: LinhaForm, prefixo: 'lanceLivre' | 'doisPontos' | 'tresPontos'): boolean {
    return (linha.errors?.['arremessos'] as string[] | undefined)?.includes(prefixo) ?? false;
  }

  protected pontos(linha: LinhaForm): number {
    return calcularPontos(linha.getRawValue());
  }

  protected salvar(): void {
    const id = this.jogoId();
    if (!id || this.linhas.invalid) {
      this.linhas.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    this.estatisticas
      .salvarBoxScore(id, this.linhasAtuais())
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: (salvas) => {
          this.preencher([...salvas].sort((a, b) => a.numero - b.numero));
          this.mensagens.add({ severity: 'success', summary: 'Box score salvo', detail: 'Os atletas já veem os novos números.' });
        },
        error: () => this.mensagens.add({ severity: 'error', summary: 'Não foi possível salvar', detail: 'Suas alterações continuam na tela.' }),
      });
  }

  protected descartar(): void {
    this.preencher(this.original());
  }

  /** CanDeactivate: confirma antes de sair com alterações não salvas */
  podeSair(): boolean | Promise<boolean> {
    if (!this.alterado()) return true;
    return new Promise((resolve) =>
      this.confirmacao.confirm({
        header: 'Alterações não salvas',
        message: 'Você editou o box score e ainda não salvou. Sair e descartar as alterações?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Descartar e sair',
        rejectLabel: 'Continuar editando',
        acceptButtonProps: { severity: 'danger' },
        rejectButtonProps: { severity: 'secondary', text: true },
        accept: () => resolve(true),
        reject: () => resolve(false),
      }),
    );
  }
}

/** Só os números da linha (para comparar com o original) */
function numeros(e: EstatisticaAtleta): number[] {
  return CAMPOS.map((c) => e[c]);
}
