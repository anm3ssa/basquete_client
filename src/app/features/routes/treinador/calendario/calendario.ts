import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs';
import { Evento, TipoEvento } from '../../../../shared/models';
import { EventoService } from '../../../../core/services/evento';
import { CalendarioMes, MesVisivel } from '../../../../shared/components/calendario-mes/calendario-mes';
import { EventoItem } from '../../../../shared/components/evento-item/evento-item';
import { intervaloDoMes, mesmoDia } from '../../../../shared/datas';
import { ConvocacaoDialog } from './components/convocacao-dialog/convocacao-dialog';
import { EventoForm } from './components/evento-form/evento-form';

@Component({
  selector: 'app-treinador-calendario',
  imports: [
    DatePipe,
    ButtonModule,
    ConfirmDialogModule,
    SkeletonModule,
    TooltipModule,
    CalendarioMes,
    EventoItem,
    EventoForm,
    ConvocacaoDialog,
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreinadorCalendario {
  private readonly servico = inject(EventoService);
  private readonly mensagens = inject(MessageService);
  private readonly confirmacao = inject(ConfirmationService);

  protected readonly eventos = signal<Evento[]>([]);
  protected readonly carregando = signal(true);
  protected readonly dataSelecionada = signal(new Date());
  private mesAtual: MesVisivel = { ano: new Date().getFullYear(), mes: new Date().getMonth() };

  protected readonly doDia = computed(() =>
    this.eventos().filter((e) => mesmoDia(new Date(e.inicio), this.dataSelecionada())),
  );
  protected readonly lista = computed(() => (this.doDia().length ? this.doDia() : this.eventos()));
  protected readonly mostrandoDia = computed(() => this.doDia().length > 0);

  // Dialog de criar/editar
  protected readonly formVisivel = signal(false);
  protected readonly eventoEditado = signal<Evento | null>(null);
  protected readonly tipoNovo = signal<TipoEvento>('TREINO');

  // Dialog de convocação
  protected readonly convocacaoVisivel = signal(false);
  protected readonly eventoConvocado = signal<Evento | null>(null);

  constructor() {
    this.carregarMes(this.mesAtual);
  }

  protected carregarMes(mes: MesVisivel): void {
    this.mesAtual = mes;
    this.carregando.set(true);
    this.servico
      .listar(intervaloDoMes(mes.ano, mes.mes))
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (eventos) => this.eventos.set([...eventos].sort((a, b) => a.inicio.localeCompare(b.inicio))),
        error: () => this.mensagens.add({ severity: 'error', summary: 'Não foi possível carregar o calendário' }),
      });
  }

  protected novo(tipo: TipoEvento): void {
    this.eventoEditado.set(null);
    this.tipoNovo.set(tipo);
    this.formVisivel.set(true);
  }

  protected editar(evento: Evento): void {
    this.eventoEditado.set(evento);
    this.formVisivel.set(true);
  }

  protected convocar(evento: Evento): void {
    this.eventoConvocado.set(evento);
    this.convocacaoVisivel.set(true);
  }

  protected aoSalvar(evento: Evento): void {
    this.mensagens.add({ severity: 'success', summary: this.eventoEditado() ? 'Evento atualizado' : 'Evento criado' });
    this.dataSelecionada.set(new Date(evento.inicio));
    this.carregarMes(this.mesAtual);
  }

  protected excluir(evento: Evento): void {
    this.confirmacao.confirm({
      header: 'Excluir evento',
      message: `Excluir ${evento.tipo === 'JOGO' ? 'o jogo' : 'o treino'} de ${new Date(evento.inicio).toLocaleDateString('pt-BR')}? Os atletas convocados deixam de ver o evento.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () =>
        this.servico.excluir(evento.id).subscribe({
          next: () => {
            this.eventos.update((lista) => lista.filter((e) => e.id !== evento.id));
            this.mensagens.add({ severity: 'success', summary: 'Evento excluído' });
          },
          error: () => this.mensagens.add({ severity: 'error', summary: 'Não foi possível excluir' }),
        }),
    });
  }

  protected aoConvocar(): void {
    this.mensagens.add({ severity: 'success', summary: 'Convocação registrada' });
    this.carregarMes(this.mesAtual);
  }

  protected futuro(evento: Evento): boolean {
    return new Date(evento.inicio).getTime() > Date.now();
  }
}
