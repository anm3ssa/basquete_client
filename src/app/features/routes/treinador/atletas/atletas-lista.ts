import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxMaskPipe } from 'ngx-mask';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs';
import { Atleta, rotuloPosicao } from '../../../../shared/models';
import { AtletaService } from '../../../../core/services/atleta';
import { AtletaForm } from './components/atleta-form/atleta-form';

type FiltroStatus = 'ATIVOS' | 'INATIVOS' | 'TODOS';

/** Linha da tabela: o atleta + campos prontos para ordenar e filtrar */
interface LinhaAtleta extends Atleta {
  posicaoRotulo: string;
  idade: number;
}

/** Roster: CRUD completo do elenco (ROLE_TREINADOR). */
@Component({
  selector: 'app-atletas-lista',
  imports: [
    DatePipe,
    FormsModule,
    NgxMaskPipe,
    AvatarModule,
    ButtonModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    AtletaForm,
  ],
  templateUrl: './atletas-lista.html',
  styleUrl: './atletas-lista.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtletasLista {
  private readonly servico = inject(AtletaService);
  private readonly mensagens = inject(MessageService);
  private readonly confirmacao = inject(ConfirmationService);

  private readonly atletas = signal<Atleta[]>([]);
  protected readonly carregando = signal(true);

  protected readonly filtros: { rotulo: string; valor: FiltroStatus }[] = [
    { rotulo: 'Ativos', valor: 'ATIVOS' },
    { rotulo: 'Inativos', valor: 'INATIVOS' },
    { rotulo: 'Todos', valor: 'TODOS' },
  ];
  protected readonly filtroStatus = signal<FiltroStatus>('ATIVOS');

  protected readonly linhas = computed<LinhaAtleta[]>(() => {
    const filtro = this.filtroStatus();
    return this.atletas()
      .filter((a) => filtro === 'TODOS' || a.ativo === (filtro === 'ATIVOS'))
      .map((a) => ({ ...a, posicaoRotulo: rotuloPosicao(a.posicao), idade: idade(a.dataNascimento) }));
  });

  protected readonly totalAtivos = computed(() => this.atletas().filter((a) => a.ativo).length);

  // Dialog
  protected readonly formVisivel = signal(false);
  protected readonly atletaEditado = signal<Atleta | null>(null);
  protected readonly numerosEmUso = computed(() => {
    const editado = this.atletaEditado()?.id;
    return this.atletas()
      .filter((a) => a.ativo && a.id !== editado)
      .map((a) => a.numero);
  });

  protected readonly mascaraTelefone = '(00) 0000-0000||(00) 00000-0000';

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.servico
      .listar()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (a) => this.atletas.set(a),
        error: () => this.mensagens.add({ severity: 'error', summary: 'Não foi possível carregar os atletas' }),
      });
  }

  protected novo(): void {
    this.atletaEditado.set(null);
    this.formVisivel.set(true);
  }

  protected editar(atleta: Atleta): void {
    this.atletaEditado.set(atleta);
    this.formVisivel.set(true);
  }

  protected aoSalvar(salvo: Atleta): void {
    const edicao = !!this.atletaEditado();
    this.atletas.update((lista) => (edicao ? lista.map((a) => (a.id === salvo.id ? salvo : a)) : [...lista, salvo]));
    this.mensagens.add({ severity: 'success', summary: edicao ? 'Atleta atualizado' : 'Atleta cadastrado', detail: salvo.nome });
  }

  protected alternarStatus(atleta: Atleta): void {
    const inativar = atleta.ativo;
    this.confirmacao.confirm({
      header: inativar ? 'Inativar atleta' : 'Reativar atleta',
      message: inativar
        ? `${atleta.nome} deixa de aparecer nas convocações e no elenco. O histórico de jogos é mantido.`
        : `${atleta.nome} volta para o elenco ativo.`,
      icon: inativar ? 'pi pi-user-minus' : 'pi pi-user-plus',
      acceptLabel: inativar ? 'Inativar' : 'Reativar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: inativar ? 'danger' : 'primary' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () =>
        this.servico.alterarStatus(atleta.id, !inativar).subscribe({
          next: (atualizado) => {
            this.atletas.update((lista) => lista.map((a) => (a.id === atualizado.id ? atualizado : a)));
            this.mensagens.add({ severity: 'success', summary: inativar ? 'Atleta inativado' : 'Atleta reativado' });
          },
          error: () => this.mensagens.add({ severity: 'error', summary: 'Não foi possível alterar a situação' }),
        }),
    });
  }

  protected iniciais(nome: string): string {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  /** Busca global da p-table (o $event do input é um Event genérico) */
  protected buscar(tabela: { filterGlobal(valor: unknown, modo: string): void }, evento: Event): void {
    tabela.filterGlobal((evento.target as HTMLInputElement).value, 'contains');
  }
}

function idade(iso: string): number {
  const nascimento = new Date(iso);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFez =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFez) anos--;
  return anos;
}
