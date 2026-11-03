import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgxMaskPipe } from 'ngx-mask';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { rotuloPosicao, Time } from '../../../../shared/models';
import { TimeService } from '../../../../core/services/time';

@Component({
  selector: 'app-meu-time',
  imports: [NgxMaskPipe, AvatarModule, BadgeModule, SkeletonModule, TagModule],
  templateUrl: './meu-time.html',
  styleUrl: './meu-time.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeuTime {
  private readonly servico = inject(TimeService);

  protected readonly time = signal<Time | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  /** Elenco ativo, por número da camisa */
  protected readonly elenco = computed(() =>
    (this.time()?.elenco ?? []).filter((a) => a.ativo).sort((a, b) => a.numero - b.numero),
  );

  protected readonly rotuloPosicao = rotuloPosicao;
  protected readonly mascaraTelefone = '(00) 0000-0000||(00) 00000-0000';

  constructor() {
    this.servico
      .meuTime()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({ next: (t) => this.time.set(t), error: () => this.erro.set(true) });
  }

  protected iniciais(nome: string): string {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  /** Link do WhatsApp com DDI do Brasil */
  protected whatsapp(telefone: string): string {
    return `https://wa.me/55${telefone.replace(/\D/g, '')}`;
  }
}
