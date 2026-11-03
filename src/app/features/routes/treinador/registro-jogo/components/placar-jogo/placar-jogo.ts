import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Jogo, rotuloMando } from '../../../../../../shared/models';

/** Placar ao vivo do registro: pontos do time (somados dos lances) e do adversário (botões). */
@Component({
  selector: 'app-placar-jogo',
  imports: [DatePipe],
  templateUrl: './placar-jogo.html',
  styleUrl: './placar-jogo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacarJogo {
  readonly jogo = input.required<Jogo>();
  readonly pontosTime = input(0);
  readonly pontosAdversario = input(0);
  /** +1, +2, +3 ou -1 (correção) nos pontos do adversário */
  readonly alterarAdversario = output<number>();

  protected readonly mando = computed(() => rotuloMando(this.jogo()));
}
