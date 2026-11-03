import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { Evento, rotuloMando, StatusPresenca } from '../../../shared/models';

const PRESENCA: Record<StatusPresenca, { rotulo: string; severidade: 'success' | 'danger' | 'warn' }> = {
  CONFIRMADO: { rotulo: 'Presença confirmada', severidade: 'success' },
  AUSENTE: { rotulo: 'Ausência justificada', severidade: 'danger' },
  PENDENTE: { rotulo: 'Aguardando resposta', severidade: 'warn' },
};

/**
 * Linha de evento (treino ou jogo) com data, horário e local.
 * Ações (botões) entram por projeção de conteúdo.
 */
@Component({
  selector: 'app-evento-item',
  imports: [DatePipe, TagModule],
  templateUrl: './evento-item.html',
  styleUrl: './evento-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventoItem {
  readonly evento = input.required<Evento>();
  /** Mostra a presença do atleta logado */
  readonly mostrarPresenca = input(false);

  protected readonly titulo = computed(() => {
    const e = this.evento();
    if (e.tipo === 'TREINO') return e.foco || 'Treino da equipe';
    return e.adversario;
  });

  /** "Em casa" / "Fora" (só jogos) */
  protected readonly mando = computed(() => {
    const e = this.evento();
    return e.tipo === 'JOGO' ? rotuloMando(e) : null;
  });

  protected readonly presenca = computed(() => {
    const status = this.evento().minhaPresenca;
    return status ? PRESENCA[status] : null;
  });
}
