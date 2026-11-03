import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { finalize, Observable } from 'rxjs';
import { Evento, EventoPayload, TipoEvento } from '../../../../../../shared/models';
import { EventoService } from '../../../../../../core/services/evento';
import { paraIsoDataHora } from '../../../../../../shared/datas';

/** Data do dia + hora do campo de horário -> Date */
function juntar(data: Date, hora: Date): Date {
  const d = new Date(data);
  d.setHours(hora.getHours(), hora.getMinutes(), 0, 0);
  return d;
}

const fimDepoisDoInicio: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const inicio = grupo.get('horaInicio')?.value as Date | null;
  const fim = grupo.get('horaFim')?.value as Date | null;
  if (!inicio || !fim) return null;
  const minutos = (d: Date) => d.getHours() * 60 + d.getMinutes();
  return minutos(fim) > minutos(inicio) ? null : { horario: true };
};

/** Dialog de criação/edição de treino ou jogo, com anotações técnicas. */
@Component({
  selector: 'app-evento-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectButtonModule,
    TextareaModule,
  ],
  templateUrl: './evento-form.html',
  styleUrl: './evento-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventoForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servico = inject(EventoService);

  /** null = novo evento */
  readonly evento = input<Evento | null>(null);
  readonly tipoInicial = input<TipoEvento>('TREINO');
  readonly dataSugerida = input<Date>(new Date());
  readonly visivel = model(false);
  readonly salvo = output<Evento>();

  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly editando = computed(() => !!this.evento());

  protected readonly tipos: { rotulo: string; valor: TipoEvento }[] = [
    { rotulo: 'Treino', valor: 'TREINO' },
    { rotulo: 'Jogo', valor: 'JOGO' },
  ];
  protected readonly mandos = [
    { rotulo: 'Em casa', valor: true },
    { rotulo: 'Fora', valor: false },
  ];

  protected readonly form = this.fb.group(
    {
      tipo: this.fb.control<TipoEvento>('TREINO'),
      data: this.fb.control<Date | null>(null, Validators.required),
      horaInicio: this.fb.control<Date | null>(null, Validators.required),
      horaFim: this.fb.control<Date | null>(null, Validators.required),
      local: ['', [Validators.required, Validators.maxLength(120)]],
      foco: ['', Validators.maxLength(120)],
      adversario: ['', Validators.maxLength(80)],
      mandante: this.fb.control(true),
      placarTime: this.fb.control<number | null>(null),
      placarAdversario: this.fb.control<number | null>(null),
      anotacoes: ['', Validators.maxLength(1000)],
    },
    { validators: fimDepoisDoInicio },
  );

  protected readonly tipo = toSignal(this.form.controls.tipo.valueChanges, { initialValue: this.form.controls.tipo.value });
  /** Placar só aparece para jogos que já aconteceram */
  protected readonly jogoRealizado = computed(() => {
    const e = this.evento();
    return this.tipo() === 'JOGO' && !!e && new Date(e.inicio).getTime() < Date.now();
  });

  constructor() {
    // Adversário obrigatório só em jogo
    this.form.controls.tipo.valueChanges.subscribe((tipo) => {
      const adversario = this.form.controls.adversario;
      adversario.setValidators(tipo === 'JOGO' ? [Validators.required, Validators.maxLength(80)] : [Validators.maxLength(80)]);
      adversario.updateValueAndValidity();
    });

    // Ao abrir: preenche com o evento (edição) ou com valores padrão (novo).
    // untracked(): o effect reage só à abertura, não aos signals lidos durante o reset.
    effect(() => {
      const aberto = this.visivel();
      const e = this.evento();
      const tipoInicial = this.tipoInicial();
      const dataSugerida = this.dataSugerida();
      if (!aberto) return;
      untracked(() => this.preencher(e, tipoInicial, dataSugerida));
    });
  }

  private preencher(e: Evento | null, tipoInicial: TipoEvento, dataSugerida: Date): void {
    this.erro.set(null);
    if (e) {
      this.form.reset({
        tipo: e.tipo,
        data: new Date(e.inicio),
        horaInicio: new Date(e.inicio),
        horaFim: new Date(e.fim),
        local: e.local,
        foco: e.tipo === 'TREINO' ? (e.foco ?? '') : '',
        adversario: e.tipo === 'JOGO' ? e.adversario : '',
        mandante: e.tipo === 'JOGO' ? e.mandante : true,
        placarTime: e.tipo === 'JOGO' ? (e.placarTime ?? null) : null,
        placarAdversario: e.tipo === 'JOGO' ? (e.placarAdversario ?? null) : null,
        anotacoes: e.anotacoes ?? '',
      });
    } else {
      const jogo = tipoInicial === 'JOGO';
      const hora = (h: number, m = 0) => {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
      };
      this.form.reset({
        tipo: tipoInicial,
        data: dataSugerida,
        horaInicio: jogo ? hora(15) : hora(19, 30),
        horaFim: jogo ? hora(17) : hora(21, 30),
        local: 'Ginásio Municipal de Assis',
        mandante: true,
      });
    }
  }

  protected invalido(campo: 'data' | 'local' | 'adversario'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const base = {
      inicio: paraIsoDataHora(juntar(v.data!, v.horaInicio!)),
      fim: paraIsoDataHora(juntar(v.data!, v.horaFim!)),
      local: v.local.trim(),
      anotacoes: v.anotacoes.trim() || undefined,
    };
    const payload: EventoPayload =
      v.tipo === 'JOGO'
        ? {
            ...base,
            tipo: 'JOGO',
            adversario: v.adversario.trim(),
            mandante: v.mandante,
            placarTime: v.placarTime,
            placarAdversario: v.placarAdversario,
          }
        : { ...base, tipo: 'TREINO', foco: v.foco.trim() || undefined };

    const e = this.evento();
    const requisicao: Observable<Evento> = e ? this.servico.atualizar(e.id, payload) : this.servico.criar(payload);

    this.salvando.set(true);
    this.erro.set(null);
    requisicao.pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: (salvo) => {
        this.salvo.emit(salvo);
        this.visivel.set(false);
      },
      error: (err: HttpErrorResponse) =>
        this.erro.set(
          err.status === 409
            ? 'Já existe um evento neste horário.'
            : 'Não foi possível salvar. Confira os dados e tente novamente.',
        ),
    });
  }
}
