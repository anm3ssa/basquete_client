import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { EstatisticaAtleta, Evento } from '../../../../shared/models';
import { AuthService } from '../../../../core/services/auth';
import { EstatisticaService } from '../../../../core/services/estatistica';
import { EventoService } from '../../../../core/services/evento';
import { CardEstatistica } from '../../../../shared/components/card-estatistica/card-estatistica';
import { calcularMedias } from '../../../../shared/graficos';
import { ModoPresenca, Presenca } from '../presenca/presenca';

/** Quantos jogos entram no resumo de métricas */
const ULTIMOS_JOGOS = 5;

@Component({
  selector: 'app-atleta-dashboard',
  imports: [DatePipe, RouterLink, ButtonModule, SkeletonModule, TagModule, CardEstatistica, Presenca],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtletaDashboard {
  private readonly eventos = inject(EventoService);
  private readonly estatisticas = inject(EstatisticaService);
  private readonly mensagens = inject(MessageService);
  protected readonly auth = inject(AuthService);

  protected readonly proximo = signal<Evento | null>(null);
  protected readonly carregandoProximo = signal(true);
  protected readonly confirmando = signal(false);

  private readonly jogos = signal<EstatisticaAtleta[]>([]);
  protected readonly carregandoMetricas = signal(true);
  protected readonly ultimos = computed(() => this.jogos().slice(-ULTIMOS_JOGOS));
  protected readonly medias = computed(() => calcularMedias(this.ultimos()));

  protected readonly primeiroNome = computed(() => this.auth.usuario()?.nome.split(' ')[0] ?? '');

  protected readonly dialogVisivel = signal(false);
  protected readonly dialogModo = signal<ModoPresenca>('escolher');

  /** "hoje", "amanhã" ou "em N dias" */
  protected readonly quando = computed(() => {
    const e = this.proximo();
    if (!e) return '';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dia = new Date(e.inicio);
    dia.setHours(0, 0, 0, 0);
    const dias = Math.round((dia.getTime() - hoje.getTime()) / 86_400_000);
    return dias <= 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `Em ${dias} dias`;
  });

  constructor() {
    this.eventos
      .proximo()
      .pipe(finalize(() => this.carregandoProximo.set(false)))
      .subscribe({ next: (e) => this.proximo.set(e), error: () => this.proximo.set(null) });

    this.estatisticas
      .meuDesempenho()
      .pipe(finalize(() => this.carregandoMetricas.set(false)))
      .subscribe({ next: (j) => this.jogos.set(j), error: () => this.jogos.set([]) });
  }

  /** Botão rápido: confirma sem abrir o dialog */
  protected confirmarRapido(): void {
    const e = this.proximo();
    if (!e || !e.minhaPresenca) return;
    this.confirmando.set(true);
    this.eventos
      .responderPresenca(e.id, { status: 'CONFIRMADO' })
      .pipe(finalize(() => this.confirmando.set(false)))
      .subscribe({
        next: (atualizado) => this.aoResponder(atualizado),
        error: (err: unknown) => {
          const msg = (err as any)?.error?.message;
          this.mensagens.add({
            severity: 'error',
            summary: 'Não foi possível confirmar',
            detail: msg || 'Tente novamente em instantes.',
          });
        },
      });
  }

  protected abrirDialog(modo: ModoPresenca): void {
    if (!this.proximo()?.minhaPresenca) return;
    this.dialogModo.set(modo);
    this.dialogVisivel.set(true);
  }

  protected aoResponder(atualizado: Evento): void {
    this.proximo.set(atualizado);
    this.mensagens.add({
      severity: 'success',
      summary: atualizado.minhaPresenca === 'CONFIRMADO' ? 'Presença confirmada' : 'Ausência registrada',
      detail: 'O treinador já pode ver sua resposta.',
    });
  }
}
