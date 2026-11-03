import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { AtualizarContaRequest, ContaUsuario } from '../../shared/models';
import { API_URL, AuthService } from './auth';

/** A própria conta: dados pessoais, foto e exclusão (tela de Configurações). */
@Injectable({ providedIn: 'root' })
export class ContaService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly url = `${API_URL}/usuarios/me`;

  private readonly _conta = signal<ContaUsuario | null>(null);
  /** Conta da pessoa logada (o header usa para mostrar a foto) */
  readonly conta = this._conta.asReadonly();

  constructor() {
    // Quem está logado mudou (login, logout, troca de usuário): recarrega ou limpa
    effect(() => {
      const id = this.auth.usuario()?.id;
      const autenticado = this.auth.autenticado();
      untracked(() => {
        if (!id || !autenticado) {
          this._conta.set(null);
        } else if (this._conta()?.id !== id) {
          this.carregar().subscribe({ error: () => this._conta.set(null) });
        }
      });
    });
  }

  carregar(): Observable<ContaUsuario> {
    return this.http.get<ContaUsuario>(this.url).pipe(tap((c) => this._conta.set(c)));
  }

  /**
   * Salva os dados e renova a sessão: o token passa a trazer o nome/e-mail novos,
   * então header, dashboards e o próximo login já usam os dados atualizados.
   */
  atualizar(dados: AtualizarContaRequest): Observable<ContaUsuario> {
    return this.http.put<ContaUsuario>(this.url, dados).pipe(
      tap((c) => this._conta.set(c)),
      switchMap((c) => this.auth.renovarToken().pipe(switchMap(() => [c]))),
    );
  }

  /** Envia a foto como multipart/form-data (campo "foto"). */
  enviarFoto(foto: Blob): Observable<ContaUsuario> {
    const corpo = new FormData();
    corpo.append('foto', foto, 'foto.jpg');
    return this.http.post<ContaUsuario>(`${this.url}/foto`, corpo).pipe(tap((c) => this._conta.set(c)));
  }

  removerFoto(): Observable<ContaUsuario> {
    return this.http.delete<ContaUsuario>(`${this.url}/foto`).pipe(tap((c) => this._conta.set(c)));
  }

  /** Exclui a conta (o back-end confere a senha) e encerra a sessão. */
  excluir(password: string): Observable<void> {
    return this.http.delete<void>(this.url, { body: { password } }).pipe(
      tap(() => {
        this._conta.set(null);
        this.auth.logout(false);
      }),
    );
  }
}
