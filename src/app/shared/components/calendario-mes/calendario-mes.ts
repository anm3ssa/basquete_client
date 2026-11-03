import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { Evento } from '../../../shared/models';
import { chaveDia } from '../../datas';

export interface MesVisivel {
  ano: number;
  /** 0 = janeiro */
  mes: number;
}

/**
 * Calendário mensal (p-datepicker inline) que marca os dias com treino ou jogo.
 * Usado pelo atleta e pelo treinador.
 */
@Component({
  selector: 'app-calendario-mes',
  imports: [FormsModule, DatePickerModule],
  templateUrl: './calendario-mes.html',
  styleUrl: './calendario-mes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarioMes {
  readonly eventos = input<Evento[]>([]);
  readonly data = model<Date>(new Date());
  readonly mesAlterado = output<MesVisivel>();

  /** 'yyyy-MM-dd' -> tipos de evento do dia */
  protected readonly marcacoes = computed(() => {
    const mapa = new Map<string, { treino: boolean; jogo: boolean }>();
    for (const e of this.eventos()) {
      const chave = e.inicio.slice(0, 10);
      const atual = mapa.get(chave) ?? { treino: false, jogo: false };
      mapa.set(chave, { treino: atual.treino || e.tipo === 'TREINO', jogo: atual.jogo || e.tipo === 'JOGO' });
    }
    return mapa;
  });

  protected marcacao(dia: { day: number; month: number; year: number }) {
    return this.marcacoes().get(chaveDia(dia.year, dia.month, dia.day));
  }

  /** O p-datepicker informa o mês de 1 a 12. */
  protected aoTrocarMes(evento: { month?: number; year?: number }): void {
    if (evento.month && evento.year) {
      this.mesAlterado.emit({ ano: evento.year, mes: evento.month - 1 });
    }
  }
}
