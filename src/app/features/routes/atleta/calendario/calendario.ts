import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { finalize } from 'rxjs';
import { Evento } from '../../../../shared/models';
import { EventoService } from '../../../../core/services/evento';
import { CalendarioMes, MesVisivel } from '../../../../shared/components/calendario-mes/calendario-mes';
import { EventoItem } from '../../../../shared/components/evento-item/evento-item';
import { intervaloDoMes, mesmoDia } from '../../../../shared/datas';
import { Presenca } from '../presenca/presenca';

@Component({
  selector: 'app-atleta-calendario',
  imports: [DatePipe, ButtonModule, SkeletonModule, CalendarioMes, EventoItem, Presenca],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtletaCalendario {
  private readonly servico = inject(EventoService);
  private readonly mensagens = inject(MessageService);

  protected readonly eventos = signal<Evento[]>([]);
  protected readonly carregando = signal(true);
  protected readonly dataSelecionada = signal(new Date());

  /** Eventos do dia escolhido; sem nada no dia, mostra o mês inteiro */
  protected readonly doDia = computed(() =>
    this.eventos().filter((e) => mesmoDia(new Date(e.inicio), this.dataSelecionada())),
  );
  protected readonly lista = computed(() => (this.doDia().length ? this.doDia() : this.eventos()));
  protected readonly mostrandoDia = computed(() => this.doDia().length > 0);

  protected readonly eventoAberto = signal<Evento | null>(null);
  protected readonly dialogVisivel = signal(false);

  constructor() {
    const hoje = new Date();
    this.carregarMes({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  }

  protected carregarMes({ ano, mes }: MesVisivel): void {
    this.carregando.set(true);
    this.servico
      .listar(intervaloDoMes(ano, mes))
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (eventos) =>
          this.eventos.set([...eventos].sort((a, b) => a.inicio.localeCompare(b.inicio))),
        error: () => {
          this.eventos.set([]);
          this.mensagens.add({ severity: 'error', summary: 'Não foi possível carregar o calendário' });
        },
      });
  }

  protected abrir(evento: Evento): void {
    this.eventoAberto.set(evento);
    this.dialogVisivel.set(true);
  }

  protected aoResponder(atualizado: Evento): void {
    this.eventos.update((lista) => lista.map((e) => (e.id === atualizado.id ? atualizado : e)));
    this.mensagens.add({
      severity: 'success',
      summary: atualizado.minhaPresenca === 'CONFIRMADO' ? 'Presença confirmada' : 'Ausência registrada',
    });
  }

  /** Só dá para responder eventos futuros em que o atleta foi convocado */
  protected podeResponder(evento: Evento): boolean {
    return !!evento.minhaPresenca && new Date(evento.inicio).getTime() > Date.now();
  }
}
