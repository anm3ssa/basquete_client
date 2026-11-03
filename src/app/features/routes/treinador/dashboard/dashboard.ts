import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { Atleta, Evento, Presenca } from '../../../../shared/models';
import { AtletaService } from '../../../../core/services/atleta';
import { AuthService } from '../../../../core/services/auth';
import { EventoService } from '../../../../core/services/evento';
import { CardEstatistica } from '../../../../shared/components/card-estatistica/card-estatistica';
import { EventoItem } from '../../../../shared/components/evento-item/evento-item';
import { paraIsoData } from '../../../../shared/datas';

const DIAS_A_FRENTE = 14;

@Component({
  selector: 'app-treinador-dashboard',
  imports: [RouterLink, ProgressBarModule, SkeletonModule, TagModule, CardEstatistica, EventoItem],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreinadorDashboard {
  private readonly eventos = inject(EventoService);
  private readonly atletasService = inject(AtletaService);
  protected readonly auth = inject(AuthService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  private readonly atletas = signal<Atleta[]>([]);
  protected readonly agenda = signal<Evento[]>([]);
  protected readonly proximo = signal<Evento | null>(null);
  protected readonly presencas = signal<Presenca[]>([]);

  protected readonly ativos = computed(() => this.atletas().filter((a) => a.ativo).length);
  protected readonly jogosNaAgenda = computed(() => this.agenda().filter((e) => e.tipo === 'JOGO').length);
  protected readonly primeiroNome = computed(() => this.auth.usuario()?.nome.split(' ')[0] ?? '');

  /** resumo do próximo jogo/treino a partir da lista de presenças */
  protected readonly resumo = computed(() => {
    const lista = this.presencas();
    const conta = (s: Presenca['status']) => lista.filter((p) => p.status === s).length;
    const total = lista.length;
    const confirmados = conta('CONFIRMADO');
    return {
      total,
      confirmados,
      ausentes: conta('AUSENTE'),
      pendentes: conta('PENDENTE'),
      taxa: total ? Math.round((confirmados / total) * 100) : 0,
    };
  });

  protected readonly naoConfirmados = computed(() =>
    this.presencas()
      .filter((p) => p.status !== 'CONFIRMADO')
      .sort((a, b) => a.status.localeCompare(b.status) || a.numero - b.numero),
  );

  constructor() {
    const hoje = new Date();
    const fim = new Date();
    fim.setDate(fim.getDate() + DIAS_A_FRENTE);

    forkJoin({
      atletas: this.atletasService.listar(),
      agenda: this.eventos.listar({ de: paraIsoData(hoje), ate: paraIsoData(fim) }),
      proximo: this.eventos.proximo(),
    })
      .pipe(
        // com o próximo jogo/treino, busca a lista de presença
        switchMap((dados) =>
          (dados.proximo ? this.eventos.presencas(dados.proximo.id) : of([] as Presenca[])).pipe(
            map((presencas) => ({ ...dados, presencas })),
          ),
        ),
      )
      .subscribe({
        next: ({ atletas, agenda, proximo, presencas }) => {
          this.atletas.set(atletas);
          this.agenda.set(
            agenda
              .filter((e) => new Date(e.inicio).getTime() >= Date.now())
              .sort((a, b) => a.inicio.localeCompare(b.inicio)),
          );
          this.proximo.set(proximo);
          this.presencas.set(presencas);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set(true);
          this.carregando.set(false);
        },
      });
  }
}
