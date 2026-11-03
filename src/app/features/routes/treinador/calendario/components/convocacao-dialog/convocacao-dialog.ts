import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, LOCALE_ID, model, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize, forkJoin } from 'rxjs';
import { Atleta, Convocacao, Evento, rotuloPosicao } from '../../../../../../shared/models';
import { AtletaService } from '../../../../../../core/services/atleta';
import { EventoService } from '../../../../../../core/services/evento';

interface Opcao {
  id: string;
  rotulo: string;
}

/** Convocação: o treinador escolhe os atletas e gera a ficha de participação do evento. */
@Component({
  selector: 'app-convocacao-dialog',
  imports: [DatePipe, FormsModule, ButtonModule, DialogModule, MessageModule, MultiSelectModule, TableModule, TagModule],
  templateUrl: './convocacao-dialog.html',
  styleUrl: './convocacao-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvocacaoDialog {
  private readonly atletasService = inject(AtletaService);
  private readonly eventos = inject(EventoService);
  private readonly locale = inject(LOCALE_ID);

  readonly evento = input<Evento | null>(null);
  readonly visivel = model(false);
  readonly convocado = output<Convocacao>();

  protected readonly carregando = signal(false);
  protected readonly gerando = signal(false);
  protected readonly erro = signal<string | null>(null);
  private readonly atletas = signal<Atleta[]>([]);
  protected readonly selecionados = signal<string[]>([]);
  protected readonly ficha = signal<Convocacao | null>(null);

  protected readonly opcoes = computed<Opcao[]>(() =>
    this.atletas()
      .filter((a) => a.ativo)
      .sort((a, b) => a.numero - b.numero)
      .map((a) => ({ id: a.id, rotulo: `#${a.numero} ${a.nome} · ${rotuloPosicao(a.posicao)}` })),
  );

  protected readonly titulo = computed(() => {
    const e = this.evento();
    if (!e) return '';
    return e.tipo === 'JOGO' ? `Jogo contra ${e.adversario}` : e.foco ? `Treino: ${e.foco}` : 'Treino';
  });

  constructor() {
    effect(() => {
      const e = this.evento();
      const aberto = this.visivel();
      if (!aberto || !e) return;
      untracked(() => this.carregar(e));
    });
  }

  private carregar(e: Evento): void {
    this.ficha.set(null);
    this.erro.set(null);
    this.carregando.set(true);
    // Atletas ativos + quem já está convocado (para vir marcado)
    forkJoin({ atletas: this.atletasService.listar(), presencas: this.eventos.presencas(e.id) })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: ({ atletas, presencas }) => {
          this.atletas.set(atletas);
          this.selecionados.set(presencas.map((p) => p.atletaId));
        },
        error: () => this.erro.set('Não foi possível carregar os atletas.'),
      });
  }

  protected gerarFicha(): void {
    const e = this.evento();
    if (!e || !this.selecionados().length) return;
    this.gerando.set(true);
    this.erro.set(null);
    this.eventos
      .convocar(e.id, this.selecionados())
      .pipe(finalize(() => this.gerando.set(false)))
      .subscribe({
        next: (ficha) => {
          this.ficha.set(ficha);
          this.convocado.emit(ficha);
        },
        error: () => this.erro.set('Não foi possível gerar a ficha. Tente novamente.'),
      });
  }

  /** Abre a ficha numa janela própria, já no formato de impressão (lista com assinatura). */
  protected imprimir(): void {
    const e = this.evento();
    const f = this.ficha();
    if (!e || !f) return;

    const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    const quando = new DatePipe(this.locale).transform(e.inicio, "EEEE, dd/MM/yyyy 'às' HH:mm") ?? '';
    const linhas = [...f.atletas]
      .sort((a, b) => a.numero - b.numero)
      .map((a) => `<tr><td>${a.numero}</td><td>${esc(a.atletaNome)}</td><td></td><td></td></tr>`)
      .join('');

    const janela = window.open('', '_blank');
    if (!janela) {
      this.erro.set('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');
      return;
    }
    janela.document.write(`<!doctype html><html lang="pt-br"><head><meta charset="utf-8">
      <title>Ficha de participação · ${esc(this.titulo())}</title>
      <style>
        body{font-family:Inter,system-ui,sans-serif;margin:32px;color:#2a2a2a}
        h1{font-size:22px;margin:0 0 4px} p{margin:2px 0;color:#5a5a5a}
        table{width:100%;border-collapse:collapse;margin-top:20px;font-size:14px}
        th,td{border:1px solid #c4c4c4;padding:8px;text-align:left}
        th{background:#f5f5f5} td:first-child{width:48px;text-align:center;font-weight:700}
        td:nth-child(3){width:90px} td:nth-child(4){width:220px}
      </style></head><body>
      <h1>Ficha de participação — Basquete Assis</h1>
      <p><strong>${esc(this.titulo())}</strong></p>
      <p>${esc(quando)} · ${esc(e.local)}</p>
      <p>${f.atletas.length} atletas convocados</p>
      <table><thead><tr><th>Nº</th><th>Atleta</th><th>Presente</th><th>Assinatura</th></tr></thead>
      <tbody>${linhas}</tbody></table>
      <script>window.onload=()=>window.print()<\/script>
      </body></html>`);
    janela.document.close();
  }
}
