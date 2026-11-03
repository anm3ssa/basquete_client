import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { finalize } from 'rxjs';
import { Role } from '../../../shared/models';
import { AuthService } from '../../../core/services/auth';
import { dataBrParaIso } from '../../../shared/datas';
import { cpfValido, dataNascimentoValida, senhasIguais } from '../../../shared/validadores';

type Campo = 'perfil' | 'nome' | 'cpf' | 'dataNascimento' | 'email' | 'telefone' | 'password' | 'confirmarPassword';

@Component({
  selector: 'app-cadastro',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgxMaskDirective,
    InputTextModule,
    PasswordModule,
    SelectButtonModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cadastro {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly perfis: { rotulo: string; valor: Role; icone: string }[] = [
    { rotulo: 'Sou atleta', valor: 'ROLE_ATLETA', icone: 'pi pi-user' },
    { rotulo: 'Sou treinador', valor: 'ROLE_TREINADOR', icone: 'pi pi-clipboard' },
  ];

  protected readonly cadastroForm = this.fb.group(
    {
      // Sem valor inicial: a pessoa precisa escolher. É o perfil que decide a tela após o login.
      perfil: this.fb.control<Role | null>(null, Validators.required),
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required, cpfValido]],
      dataNascimento: ['', [Validators.required, dataNascimentoValida]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.minLength(10)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: senhasIguais },
  );

  protected invalido(campo: Campo): boolean {
    const controle = this.cadastroForm.controls[campo];
    const tocado = controle.touched || controle.dirty;
    if (campo === 'confirmarPassword') {
      return tocado && (controle.invalid || this.cadastroForm.hasError('senhasDiferentes'));
    }
    return tocado && controle.invalid;
  }

  protected onSubmit(): void {
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // O ngx-mask entrega só os dígitos; a data vai para a API em ISO (yyyy-MM-dd)
    const { confirmarPassword: _, dataNascimento, perfil, ...dados } = this.cadastroForm.getRawValue();

    this.authService
      .cadastrar({ ...dados, perfil: perfil!, dataNascimento: dataBrParaIso(dataNascimento) ?? '' })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        // Mesmo fluxo do login: token salvo, segue para onde a pessoa queria ir
        next: () => {
          // Volta para onde a pessoa queria ir; senão, dashboard do perfil (atleta ou treinador)
          const destino = this.route.snapshot.queryParamMap.get('returnUrl') ?? this.authService.rotaInicial();
          this.router.navigateByUrl(destino);
        },
        error: (err: HttpErrorResponse) => this.errorMessage.set(mensagemDeErro(err)),
      });
  }
}

function mensagemDeErro(err: HttpErrorResponse): string {
  if (err.status === 0) return 'Não foi possível conectar ao servidor. Tente novamente.';
  if (err.status === 409) return 'Já existe uma conta com este e-mail ou CPF.';
  if (err.status === 400) return 'Confira os dados informados e tente novamente.';
  return 'Algo deu errado ao criar a conta. Tente novamente em instantes.';
}
