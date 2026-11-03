import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { ContaService } from '../../../core/services/conta';
import { ContaUsuario } from '../../../shared/models';
import { dataBrParaIso } from '../../../shared/datas';
import { prepararFotoDePerfil, TAMANHO_MAXIMO_FOTO, TIPOS_DE_FOTO } from '../../../shared/imagem';
import { dataNascimentoValida } from '../../../shared/validadores';

type Campo = 'nome' | 'email' | 'telefone' | 'dataNascimento';

/** 'yyyy-MM-dd' -> 'ddMMyyyy' (formato do campo com máscara 00/00/0000) */
function isoParaCampo(iso: string): string {
  return iso ? `${iso.slice(8, 10)}${iso.slice(5, 7)}${iso.slice(0, 4)}` : '';
}

/** Configurações da própria conta: dados pessoais, foto e exclusão. Usada pelos dois perfis. */
@Component({
  selector: 'app-configuracoes',
  imports: [
    ReactiveFormsModule,
    NgxMaskDirective,
    NgxMaskPipe,
    AvatarModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    PasswordModule,
    SkeletonModule,
    TagModule,
  ],
  templateUrl: './configuracoes.html',
  styleUrl: './configuracoes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Configuracoes {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly contaService = inject(ContaService);
  private readonly mensagens = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly conta = this.contaService.conta;
  protected readonly carregando = signal(true);
  protected readonly erroAoCarregar = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erroAoSalvar = signal<string | null>(null);

  protected readonly rotuloPerfil = computed(() =>
    this.conta()?.perfil === 'ROLE_TREINADOR' ? 'Treinador' : 'Atleta',
  );
  protected readonly iniciais = computed(() =>
    (this.conta()?.nome ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join(''),
  );

  // ---------- Dados pessoais ----------
  protected readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required, Validators.minLength(10)]],
    dataNascimento: ['', [Validators.required, dataNascimentoValida]],
  });

  // ---------- Foto ----------
  private readonly seletorDeArquivo = viewChild.required<ElementRef<HTMLInputElement>>('arquivo');
  protected readonly enviandoFoto = signal(false);
  protected readonly erroFoto = signal<string | null>(null);
  protected readonly tiposAceitos = TIPOS_DE_FOTO.join(',');

  // ---------- Exclusão ----------
  protected readonly dialogExcluir = signal(false);
  protected readonly excluindo = signal(false);
  protected readonly erroExcluir = signal<string | null>(null);
  protected readonly senhaExclusao = this.fb.control('', [Validators.required, Validators.minLength(6)]);

  constructor() {
    this.contaService
      .carregar()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (c) => this.preencher(c),
        error: () => this.erroAoCarregar.set(true),
      });
  }

  protected invalido(campo: Campo): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  private preencher(c: ContaUsuario): void {
    this.form.reset({
      nome: c.nome,
      email: c.email,
      telefone: c.telefone,
      dataNascimento: isoParaCampo(c.dataNascimento),
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.salvando.set(true);
    this.erroAoSalvar.set(null);
    this.contaService
      .atualizar({
        nome: v.nome.trim(),
        email: v.email.trim().toLowerCase(),
        telefone: v.telefone,
        dataNascimento: dataBrParaIso(v.dataNascimento) ?? '',
      })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: (c) => {
          this.preencher(c);
          this.mensagens.add({ severity: 'success', summary: 'Dados atualizados' });
        },
        error: (e: HttpErrorResponse) =>
          this.erroAoSalvar.set(
            e.status === 409
              ? 'Este e-mail já está em uso por outra conta.'
              : 'Não foi possível salvar. Tente novamente.',
          ),
      });
  }

  protected descartar(): void {
    const c = this.conta();
    if (c) this.preencher(c);
    this.erroAoSalvar.set(null);
  }

  protected escolherFoto(): void {
    this.seletorDeArquivo().nativeElement.click();
  }

  protected async aoEscolherFoto(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const arquivo = entrada.files?.[0];
    entrada.value = ''; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;

    this.erroFoto.set(null);
    if (!TIPOS_DE_FOTO.includes(arquivo.type)) {
      this.erroFoto.set('Use uma imagem JPG, PNG ou WEBP.');
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      this.erroFoto.set('A imagem precisa ter no máximo 5 MB.');
      return;
    }

    this.enviandoFoto.set(true);
    try {
      const foto = await prepararFotoDePerfil(arquivo);
      this.contaService
        .enviarFoto(foto)
        .pipe(finalize(() => this.enviandoFoto.set(false)))
        .subscribe({
          next: () => this.mensagens.add({ severity: 'success', summary: 'Foto atualizada' }),
          error: () => this.erroFoto.set('Não foi possível enviar a foto. Tente novamente.'),
        });
    } catch {
      this.enviandoFoto.set(false);
      this.erroFoto.set('Não foi possível ler esta imagem.');
    }
  }

  protected removerFoto(): void {
    this.enviandoFoto.set(true);
    this.erroFoto.set(null);
    this.contaService
      .removerFoto()
      .pipe(finalize(() => this.enviandoFoto.set(false)))
      .subscribe({
        next: () => this.mensagens.add({ severity: 'success', summary: 'Foto removida' }),
        error: () => this.erroFoto.set('Não foi possível remover a foto.'),
      });
  }

  protected abrirExclusao(): void {
    this.senhaExclusao.reset();
    this.erroExcluir.set(null);
    this.dialogExcluir.set(true);
  }

  protected excluirConta(): void {
    if (this.senhaExclusao.invalid) {
      this.senhaExclusao.markAsTouched();
      return;
    }
    this.excluindo.set(true);
    this.erroExcluir.set(null);
    this.contaService
      .excluir(this.senhaExclusao.value)
      .pipe(finalize(() => this.excluindo.set(false)))
      .subscribe({
        next: () => {
          this.dialogExcluir.set(false);
          this.router.navigate(['/login'], { queryParams: { conta: 'excluida' } });
        },
        error: (e: HttpErrorResponse) =>
          this.erroExcluir.set(
            e.status === 401 || e.status === 403
              ? 'Senha incorreta.'
              : 'Não foi possível excluir a conta. Tente novamente.',
          ),
      });
  }
}
