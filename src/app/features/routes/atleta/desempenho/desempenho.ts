import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { finalize } from 'rxjs';
import { EstatisticaAtleta } from '../../../../shared/models';
import { EstatisticaService } from '../../../../core/services/estatistica';
import { CardEstatistica } from '../../../../shared/components/card-estatistica/card-estatistica';
import {
  calcularMedias,
  graficoAproveitamento,
  graficoEvolucao,
  opcoesBase,
} from '../../../../shared/graficos';

type Periodo = 5 | 10 | 0;

/** Atleta: evolução dos próprios números. Somente leitura. */
@Component({
  selector: 'app-atleta-desempenho',
  imports: [FormsModule, ChartModule, SelectButtonModule, SkeletonModule, CardEstatistica],
  templateUrl: './desempenho.html',
  styleUrl: './desempenho.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtletaDesempenho {
  private readonly servico = inject(EstatisticaService);

  private readonly jogos = signal<EstatisticaAtleta[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  protected readonly periodos: { rotulo: string; valor: Periodo }[] = [
    { rotulo: 'Últimos 5', valor: 5 },
    { rotulo: 'Últimos 10', valor: 10 },
    { rotulo: 'Temporada', valor: 0 },
  ];
  protected readonly periodo = signal<Periodo>(10);

  protected readonly selecionados = computed(() => {
    const n = this.periodo();
    return n ? this.jogos().slice(-n) : this.jogos();
  });

  protected readonly medias = computed(() => calcularMedias(this.selecionados()));
  protected readonly evolucao = computed(() => graficoEvolucao(this.selecionados()));
  protected readonly aproveitamento = computed(() => graficoAproveitamento(this.selecionados()));

  protected readonly opcoesEvolucao = opcoesBase();
  protected readonly opcoesAproveitamento = opcoesBase('%', 100);

  constructor() {
    this.servico
      .meuDesempenho()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({ next: (j) => this.jogos.set(j), error: () => this.erro.set(true) });
  }
}
