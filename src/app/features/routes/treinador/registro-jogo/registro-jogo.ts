import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { ComAlteracoesPendentes } from '../../../../core/guards/auth-guard';
import { AtletaService } from '../../../../core/services/atleta';
import { EstatisticaService } from '../../../../core/services/estatistica';
import { EventoService } from '../../../../core/services/evento';
import { Jogo, Lance, RegistroLances, TipoLance } from '../../../../shared/models';
import { PlacarJogo } from './components/placar-jogo/placar-jogo';
import { AtletaDoJogo, boxScoreDoRegistro, LANCES, pontosDosLances, rotuloPeriodo } from '../../../../shared/registro';

const RASCUNHO_KEY = 'basquete-assis.registro-rascunho.';

interface Botao {
  tipo: TipoLance;
  rotulo: string;
  icone: string;
  severidade: 'success' | 'danger' | 'secondary' | 'info' | 'warn' | 'contrast';
}

/**
 * Registro do jogo, lance a lance: o treinador escolhe o atleta e marca o que aconteceu
 * (cestas, erros, rebotes, assistências, tocos e roubos) e os pontos do adversário.
 * Ao salvar, os lances viram o box score do jogo e a tela de Desempenho abre nele.
 * Enquanto não salva, tudo fica como rascunho no navegador (sobrevive a um F5).
 */
@Component({
  selector: 'app-registro-jogo',
  imports: [FormsModule, PlacarJogo, RouterLink, ButtonModule, ConfirmDialogModule, MessageModule, SelectButtonModule, SkeletonModule, TagModule],
  templateUrl: './registro-jogo.html',
  styleUrl: './registro-jogo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroJogo implements ComAlteracoesPendentes {
  private readonly eventos = inject(EventoService);
  private readonly estatisticas = inject(EstatisticaService);
  private readonly atletaService = inject(AtletaService);
  private readonly mensagens = inject(MessageService);
  private readonly confirmacao = inject(ConfirmationService);
  private readonly router = inject(Router);

  /** :id da rota */
  readonly id = input.required<string>();

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly salvando = signal(false);

  protected readonly jogo = signal<Jogo | null>(null);
  protected readonly atletas = signal<AtletaDoJogo[]>([]);
  protected readonly lances = signal<Lance[]>([]);
  protected readonly placarAdversario = signal(0);
  protected readonly periodo = signal(1);
  protected readonly selecionado = signal<string | null>(null);

  /** O jogo já tinha números lançados à mão (serão substituídos ao salvar) */
  protected readonly substituiNumeros = signal(false);
  private minutosAnteriores: Record<string, number> = {};
  /** Último estado salvo na API, para saber se há alterações */
  private readonly salvo = signal<RegistroLances>({ lances: [], placarAdversario: 0 });

  protected readonly rotuloPeriodo = rotuloPeriodo;
  protected readonly periodos = [1, 2, 3, 4, 5].map((p) => ({ valor: p, rotulo: p === 5 ? 'Prorr.' : `${p}º Q` }));

  protected readonly arremessos: { titulo: string; certo: Botao; errado: Botao }[] = [
    { titulo: 'Lance livre', certo: botao('LL_CONVERTIDO', '+1', 'pi pi-check', 'success'), errado: botao('LL_ERRADO', 'Errou', 'pi pi-times', 'secondary') },
    { titulo: '2 pontos', certo: botao('DOIS_CONVERTIDO', '+2', 'pi pi-check', 'success'), errado: botao('DOIS_ERRADO', 'Errou', 'pi pi-times', 'secondary') },
    { titulo: '3 pontos', certo: botao('TRES_CONVERTIDO', '+3', 'pi pi-check', 'success'), errado: botao('TRES_ERRADO', 'Errou', 'pi pi-times', 'secondary') },
  ];
  protected readonly outros: Botao[] = [
    botao('REBOTE', 'Rebote', 'pi pi-refresh', 'info'),
    botao('ASSISTENCIA', 'Assistência', 'pi pi-share-alt', 'info'),
    botao('TOCO', 'Toco', 'pi pi-ban', 'info'),
    botao('ROUBO', 'Roubo', 'pi pi-bolt', 'info'),
  ];

  protected readonly placarTime = computed(() => pontosDosLances(this.lances()));

  protected readonly alterado = computed(() => {
    const s = this.salvo();
    return this.placarAdversario() !== s.placarAdversario || JSON.stringify(this.lances()) !== JSON.stringify(s.lances);
  });

  /** Pontos, rebotes e assistências de cada atleta, para os botões de seleção */
  protected readonly resumoPorAtleta = computed(() => {
    const resumo: Record<string, { pontos: number; rebotes: number; assistencias: number }> = {};
    for (const a of this.atletas()) resumo[a.atletaId] = { pontos: 0, rebotes: 0, assistencias: 0 };
    for (const l of this.lances()) {
      const r = (resumo[l.atletaId] ??= { pontos: 0, rebotes: 0, assistencias: 0 });
      r.pontos += LANCES[l.tipo].pontos;
      if (l.tipo === 'REBOTE') r.rebotes++;
      if (l.tipo === 'ASSISTENCIA') r.assistencias++;
    }
    return resumo;
  });

  protected readonly atletaSelecionado = computed(() => this.atletas().find((a) => a.atletaId === this.selecionado()) ?? null);

  /** Lances do mais recente para o mais antigo, já com nome do atleta e descrição */
  protected readonly historico = computed(() => {
    const porId = new Map(this.atletas().map((a) => [a.atletaId, a]));
    return [...this.lances()].reverse().map((l) => {
      const a = porId.get(l.atletaId);
      return {
        ...l,
        atleta: a ? `#${a.numero} ${a.atletaNome}` : 'Atleta removido',
        descricao: LANCES[l.tipo].rotulo,
        pontos: LANCES[l.tipo].pontos,
        convertido: l.tipo.endsWith('CONVERTIDO'),
        errado: l.tipo.endsWith('ERRADO'),
      };
    });
  });

  constructor() {
    // Carrega quando o :id chega (input da rota)
    effect((onCleanup) => {
      const id = this.id();
      const sub = forkJoin({
        jogo: this.eventos.buscar(id),
        registro: this.estatisticas.registro(id),
        box: this.estatisticas.boxScore(id),
        presencas: this.eventos.presencas(id),
        atletas: this.atletaService.listar(),
      })
        .pipe(finalize(() => this.carregando.set(false)))
        .subscribe({
          next: ({ jogo, registro, box, presencas, atletas }) => {
            if (jogo.tipo !== 'JOGO') {
              this.erro.set(true);
              return;
            }
            this.jogo.set(jogo);

            // Quem joga: os convocados (menos quem avisou ausência); sem convocação, o elenco ativo
            const convocados = presencas.filter((p) => p.status !== 'AUSENTE');
            const lista: AtletaDoJogo[] = convocados.length
              ? convocados.map((p) => ({ atletaId: p.atletaId, atletaNome: p.atletaNome, numero: p.numero }))
              : atletas.filter((a) => a.ativo).map((a) => ({ atletaId: a.id, atletaNome: a.nome, numero: a.numero }));
            // Quem já tem lance registrado continua na lista mesmo se saiu da convocação
            for (const l of registro.lances) {
              if (!lista.some((a) => a.atletaId === l.atletaId)) {
                const a = atletas.find((x) => x.id === l.atletaId);
                if (a) lista.push({ atletaId: a.id, atletaNome: a.nome, numero: a.numero });
              }
            }
            this.atletas.set(lista.sort((a, b) => a.numero - b.numero));

            this.minutosAnteriores = Object.fromEntries(box.map((l) => [l.atletaId, l.minutos]));
            this.substituiNumeros.set(!registro.lances.length && box.some(temNumeros));

            this.salvo.set(registro);
            const rascunho = lerRascunho(id);
            const usar = rascunho && JSON.stringify(rascunho) !== JSON.stringify(registro) ? rascunho : registro;
            this.lances.set(usar.lances);
            this.placarAdversario.set(usar.placarAdversario);
            this.periodo.set(usar.lances.at(-1)?.periodo ?? 1);
            if (usar === rascunho) {
              this.mensagens.add({ severity: 'info', summary: 'Rascunho recuperado', detail: 'Os lances ainda não salvos voltaram para a tela.' });
            }
          },
          error: () => this.erro.set(true),
        });
      onCleanup(() => sub.unsubscribe());
    });

    // Rascunho no navegador: guarda a cada lance, some quando salva ou descarta
    effect(() => {
      const id = this.id();
      const registro: RegistroLances = { lances: this.lances(), placarAdversario: this.placarAdversario() };
      if (this.carregando()) return;
      if (this.alterado()) gravarRascunho(id, registro);
      else apagarRascunho(id);
    });
  }

  protected selecionar(atletaId: string): void {
    this.selecionado.set(this.selecionado() === atletaId ? null : atletaId);
  }

  protected marcar(tipo: TipoLance): void {
    const atletaId = this.selecionado();
    if (!atletaId) return;
    const lance: Lance = { id: novoId(), atletaId, tipo, periodo: this.periodo(), registradoEm: new Date().toISOString() };
    this.lances.update((l) => [...l, lance]);
  }

  protected remover(id: string): void {
    this.lances.update((l) => l.filter((x) => x.id !== id));
  }

  protected desfazer(): void {
    this.lances.update((l) => l.slice(0, -1));
  }

  protected pontosAdversario(valor: number): void {
    this.placarAdversario.update((p) => Math.max(0, p + valor));
  }

  protected descartar(): void {
    this.confirmacao.confirm({
      header: 'Descartar alterações',
      message: 'Os lances marcados desde o último salvamento serão apagados. Continuar?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Descartar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () => {
        const s = this.salvo();
        this.lances.set(s.lances);
        this.placarAdversario.set(s.placarAdversario);
      },
    });
  }

  /** Salva o registro e o box score que sai dele, e abre o jogo em Desempenho */
  protected salvar(): void {
    const id = this.id();
    const registro: RegistroLances = { lances: this.lances(), placarAdversario: this.placarAdversario() };
    const linhas = boxScoreDoRegistro(id, this.atletas(), registro.lances, this.minutosAnteriores);
    this.salvando.set(true);
    this.estatisticas
      .salvarRegistro(id, registro)
      .pipe(
        switchMap(() => this.estatisticas.salvarBoxScore(id, linhas)),
        finalize(() => this.salvando.set(false)),
      )
      .subscribe({
        next: () => {
          this.salvo.set(registro);
          apagarRascunho(id);
          this.mensagens.add({ severity: 'success', summary: 'Jogo salvo', detail: 'Os números já estão em Desempenho.' });
          this.router.navigate(['/treinador/desempenho'], { queryParams: { jogo: id } });
        },
        error: () =>
          this.mensagens.add({ severity: 'error', summary: 'Não foi possível salvar', detail: 'Os lances continuam guardados neste navegador.' }),
      });
  }

  /** CanDeactivate: o rascunho fica guardado, mas avisa que ainda não foi para Desempenho */
  podeSair(): boolean | Promise<boolean> {
    if (!this.alterado()) return true;
    return new Promise((resolve) =>
      this.confirmacao.confirm({
        header: 'Registro não salvo',
        message: 'Os lances ainda não foram para Desempenho. Eles ficam guardados neste navegador e voltam quando você abrir o jogo de novo.',
        icon: 'pi pi-info-circle',
        acceptLabel: 'Sair mesmo assim',
        rejectLabel: 'Continuar registrando',
        acceptButtonProps: { severity: 'secondary' },
        rejectButtonProps: { severity: 'secondary', text: true },
        accept: () => resolve(true),
        reject: () => resolve(false),
      }),
    );
  }
}

function botao(tipo: TipoLance, rotulo: string, icone: string, severidade: Botao['severidade']): Botao {
  return { tipo, rotulo, icone, severidade };
}

function temNumeros(l: { lanceLivreTentados: number; doisPontosTentados: number; tresPontosTentados: number; rebotes: number; assistencias: number; tocos: number; roubos: number }): boolean {
  return l.lanceLivreTentados + l.doisPontosTentados + l.tresPontosTentados + l.rebotes + l.assistencias + l.tocos + l.roubos > 0;
}

function novoId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// localStorage pode falhar (modo privado): o registro só não sobrevive ao F5
function lerRascunho(id: string): RegistroLances | null {
  try {
    const salvo = localStorage.getItem(RASCUNHO_KEY + id);
    return salvo ? (JSON.parse(salvo) as RegistroLances) : null;
  } catch {
    return null;
  }
}

function gravarRascunho(id: string, registro: RegistroLances): void {
  try {
    localStorage.setItem(RASCUNHO_KEY + id, JSON.stringify(registro));
  } catch {
    /* segue só em memória */
  }
}

function apagarRascunho(id: string): void {
  try {
    localStorage.removeItem(RASCUNHO_KEY + id);
  } catch {
    /* nada a fazer */
  }
}
