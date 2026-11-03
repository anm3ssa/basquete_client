import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { finalize, Observable } from 'rxjs';
import { Atleta, AtletaPayload, Posicao, POSICOES } from '../../../../../../shared/models';
import { AtletaService } from '../../../../../../core/services/atleta';
import { isoParaData, paraIsoData } from '../../../../../../shared/datas';
import { cpfValido } from '../../../../../../shared/validadores';

type Campo = 'nome' | 'cpf' | 'dataNascimento' | 'email' | 'telefone' | 'numero' | 'posicao';

/** Dialog de cadastro/edição de atleta pelo treinador. */
@Component({
  selector: 'app-atleta-form',
  imports: [
    ReactiveFormsModule,
    NgxMaskDirective,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
  ],
  templateUrl: './atleta-form.html',
  styleUrl: './atleta-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtletaForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servico = inject(AtletaService);

  /** null = novo atleta */
  readonly atleta = input<Atleta | null>(null);
  /** Números já usados por outros atletas ativos */
  readonly numerosEmUso = input<number[]>([]);
  readonly visivel = model(false);
  readonly salvo = output<Atleta>();

  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly editando = computed(() => !!this.atleta());
  protected readonly posicoes = POSICOES;
  protected readonly hoje = new Date();

  protected readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    cpf: ['', [Validators.required, cpfValido]],
    dataNascimento: this.fb.control<Date | null>(null, Validators.required),
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required, Validators.minLength(10)]],
    numero: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(99),
      (c: AbstractControl): ValidationErrors | null =>
        c.value !== null && this.numerosEmUso().includes(c.value) ? { numeroEmUso: true } : null,
    ]),
    posicao: this.fb.control<Posicao | null>(null, Validators.required),
    fotoUrl: ['', Validators.pattern(/^https?:\/\/\S+$/)],
  });

  constructor() {
    // Reage só à abertura do dialog. O preenchimento roda em untracked(): o reset dispara
    // validadores e o ngx-mask, que leem signals; sem isso o effect passaria a observá-los
    // e limparia o formulário enquanto a pessoa digita.
    effect(() => {
      const aberto = this.visivel();
      const a = this.atleta();
      if (!aberto) return;
      untracked(() => this.preencher(a));
    });
  }

  private preencher(a: Atleta | null): void {
    this.erro.set(null);
    this.form.reset(
      a
        ? {
            nome: a.nome,
            cpf: a.cpf,
            dataNascimento: isoParaData(a.dataNascimento),
            email: a.email,
            telefone: a.telefone,
            numero: a.numero,
            posicao: a.posicao,
            fotoUrl: a.fotoUrl ?? '',
          }
        : {},
    );
  }

  protected invalido(campo: Campo): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: AtletaPayload = {
      nome: v.nome.trim(),
      cpf: v.cpf,
      dataNascimento: paraIsoData(v.dataNascimento!),
      email: v.email.trim().toLowerCase(),
      telefone: v.telefone,
      numero: v.numero!,
      posicao: v.posicao!,
      fotoUrl: v.fotoUrl.trim() || null,
    };

    const a = this.atleta();
    const requisicao: Observable<Atleta> = a ? this.servico.atualizar(a.id, payload) : this.servico.criar(payload);

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
            ? 'Já existe um atleta com este CPF, e-mail ou número.'
            : 'Não foi possível salvar. Confira os dados e tente novamente.',
        ),
    });
  }
}
