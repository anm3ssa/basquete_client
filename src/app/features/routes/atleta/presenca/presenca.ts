import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { ConfirmacaoPresencaRequest, Evento } from '../../../../shared/models';
import { EventoService } from '../../../../core/services/evento';

export type ModoPresenca = 'escolher' | 'ausencia';

/** Dialog do atleta: confirmar presença ou justificar ausência em um treino/jogo. */
@Component({
  selector: 'app-presenca',
  imports: [DatePipe, ReactiveFormsModule, DialogModule, ButtonModule, TextareaModule, MessageModule],
  templateUrl: './presenca.html',
  styleUrl: './presenca.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Presenca {
  private readonly eventos = inject(EventoService);

  readonly evento = input<Evento | null>(null);
  readonly visivel = model(false);
  /** 'ausencia' abre direto no campo de justificativa */
  readonly modoInicial = input<ModoPresenca>('escolher');
  readonly respondido = output<Evento>();

  protected readonly modo = signal<ModoPresenca>('escolher');
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly justificativa = inject(NonNullableFormBuilder).control('', [
    Validators.required,
    Validators.minLength(5),
    Validators.maxLength(300),
  ]);

  constructor() {
    // Cada vez que abre, começa limpo
    effect(() => {
      const aberto = this.visivel();
      const modo = this.modoInicial();
      if (!aberto) return;
      untracked(() => {
        this.modo.set(modo);
        this.erro.set(null);
        this.justificativa.reset();
      });
    });
  }

  protected confirmar(): void {
    this.enviar({ status: 'CONFIRMADO' });
  }

  protected justificar(): void {
    if (this.justificativa.invalid) {
      this.justificativa.markAsTouched();
      return;
    }
    this.enviar({ status: 'AUSENTE', justificativa: this.justificativa.value.trim() });
  }

  private enviar(resposta: ConfirmacaoPresencaRequest): void {
    const evento = this.evento();
    if (!evento) return;

    this.enviando.set(true);
    this.erro.set(null);
    this.eventos
      .responderPresenca(evento.id, resposta)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (atualizado) => {
          this.respondido.emit(atualizado);
          this.visivel.set(false);
        },
        error: (e: HttpErrorResponse) =>
          this.erro.set(
            e.status === 409
              ? 'O prazo para responder este evento já terminou.'
              : 'Não foi possível enviar sua resposta. Tente novamente.',
          ),
      });
  }
}
