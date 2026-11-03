import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const formato = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** Indicador numérico (média, total, percentual). */
@Component({
  selector: 'app-card-estatistica',
  templateUrl: './card-estatistica.html',
  styleUrl: './card-estatistica.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEstatistica {
  readonly rotulo = input.required<string>();
  readonly valor = input.required<number | string | null>();
  readonly sufixo = input('');
  readonly icone = input<string | null>(null);
  readonly detalhe = input<string | null>(null);

  /** Números no formato brasileiro: 12,5 */
  protected readonly valorFormatado = computed(() => {
    const v = this.valor();
    return typeof v === 'number' ? formato.format(v) : v;
  });
}
