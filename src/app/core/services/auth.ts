// import { HttpClient } from '@angular/common/http';
// import { computed, inject, Injectable, signal } from '@angular/core';
// import { Router } from '@angular/router';
// import { Observable, tap } from 'rxjs';
// export interface LoginRequest {
//   email: string;
//   password: string;
// }

// /** Ajuste os nomes conforme o que a sua API espera no cadastro. */
// export interface CadastroRequest {
//   nome: string;
//   email: string;
//   telefone: string;
//   password: string;
// }

// /** Ajuste os nomes conforme o retorno real da sua API (ex.: accessToken). */
// export interface LoginResponse {
//   token: string;
// }

// export interface JwtPayload {
//   sub: string;
//   exp: number;
//   iat?: number;
//   nome?: string;
//   roles?: string[];
//   [claim: string]: unknown;
// }

// /** Endereço base da API. Ajuste para a URL do seu back-end. */
// export const API_URL = 'http://localhost:8080/api';

// const TOKEN_KEY = 'basquete-assis.token';

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   private readonly http = inject(HttpClient);
//   private readonly router = inject(Router);

//   private readonly _token = signal<string | null>(this.lerTokenSalvo());

//   readonly token = this._token.asReadonly();
//   readonly usuario = computed(() => {
//     const token = this._token();
//     return token ? decodificarJwt(token) : null;
//   });
//   readonly autenticado = computed(() => {
//     const payload = this.usuario();
//     return !!payload && !tokenExpirado(payload);
//   });

//   login(credenciais: LoginRequest): Observable<LoginResponse> {
//     return this.http
//       .post<LoginResponse>(`${API_URL}/auth/login`, credenciais)
//       .pipe(tap(({ token }) => this.salvarToken(token)));
//   }
//   cadastrar(dados: CadastroRequest): Observable<LoginResponse> {
//     return this.http
//       .post<LoginResponse>(`${API_URL}/auth/cadastro`, dados)
//       .pipe(tap(({ token }) => this.salvarToken(token)));
//   }

//   logout(redirecionar = true): void {
//     localStorage.removeItem(TOKEN_KEY);
//     this._token.set(null);
//     if (redirecionar) {
//       this.router.navigate(['/login']);
//     }
//   }

//   private salvarToken(token: string): void {
//     localStorage.setItem(TOKEN_KEY, token);
//     this._token.set(token);
//   }

//   private lerTokenSalvo(): string | null {
//     try {
//       const token = localStorage.getItem(TOKEN_KEY);
//       if (!token) return null;
//       const payload = decodificarJwt(token);
//       if (!payload || tokenExpirado(payload)) {
//         localStorage.removeItem(TOKEN_KEY);
//         return null;
//       }
//       return token;
//     } catch {
//       return null;
//     }
//   }
// }

// /** Lê o payload do JWT (a assinatura é validada pelo back-end). */
// export function decodificarJwt(token: string): JwtPayload | null {
//   try {
//     const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
//     const json = decodeURIComponent(
//       atob(base64)
//         .split('')
//         .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
//         .join(''),
//     );
//     return JSON.parse(json) as JwtPayload;
//   } catch {
//     return null;
//   }
// }

// export function tokenExpirado(payload: JwtPayload, margemSegundos = 10): boolean {
//   if (!payload.exp) return false;
//   return Date.now() / 1000 >= payload.exp - margemSegundos;
// }


import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { Router } from '@angular/router';
import { delay, finalize, map, Observable, of, shareReplay, switchMap, tap, throwError, timer } from 'rxjs';
import { AuthResponse, CadastroRequest, JwtPayload, LoginRequest, Role, Usuario } from '../../shared/models';

/** Endereço base da API. Ajuste para a URL do seu back-end. */
export const API_URL = 'http://localhost:8080/api';

/** Rotas de autenticação: públicas, sem Bearer e sem refresh automático. */
export const ROTAS_PUBLICAS = ['/auth/login', '/auth/cadastro', '/auth/refresh'];

/** Tela inicial de cada perfil depois do login. */
export const ROTA_INICIAL: Record<Role, string> = {
  ROLE_ATLETA: '/atleta/dashboard',
  ROLE_TREINADOR: '/treinador/dashboard',
};

const ACCESS_KEY = 'basquete-assis.access-token';
const REFRESH_KEY = 'basquete-assis.refresh-token';

/**
 * TEMPORÁRIO, enquanto não existe back-end: true faz o cadastro e o login funcionarem
 * só neste navegador (os cadastros ficam no localStorage). Quando a API estiver pronta,
 * mude para false: nada mais precisa ser alterado.
 */
export const SEM_BACKEND = true;

/** Permite ligar/desligar o modo sem back-end nos testes. */
export const MODO_SEM_BACKEND = new InjectionToken<boolean>('MODO_SEM_BACKEND', {
  providedIn: 'root',
  factory: () => SEM_BACKEND,
});

/** Onde o modo sem back-end guarda os cadastros (o mock da API também lê daqui). */
export const USUARIOS_LOCAIS_KEY = 'basquete-assis.usuarios-locais';

export interface UsuarioLocal {
  id: string;
  nome: string;
  email: string;
  perfil: Role;
  cpf?: string;
  dataNascimento?: string;
  telefone?: string;
  fotoUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly semBackend = inject(MODO_SEM_BACKEND);

  private readonly _accessToken = signal<string | null>(ler(ACCESS_KEY));
  private readonly _refreshToken = signal<string | null>(ler(REFRESH_KEY));

  /** Renovação em andamento: requisições simultâneas compartilham a mesma chamada. */
  private renovacao$: Observable<string> | null = null;

  readonly token = this._accessToken.asReadonly();

  private readonly payload = computed(() => {
    const token = this._accessToken();
    return token ? decodificarJwt(token) : null;
  });

  readonly usuario = computed<Usuario | null>(() => {
    const p = this.payload();
    const role = p?.roles?.find((r): r is Role => r === 'ROLE_ATLETA' || r === 'ROLE_TREINADOR');
    return p && role ? { id: p.sub, nome: p.nome, email: p.email, role } : null;
  });

  readonly perfil = computed(() => this.usuario()?.role ?? null);

  /**
   * Sessão válida: tem usuário com perfil conhecido e o access token ainda vale,
   * ou já venceu mas existe refresh token para renová-lo.
   */
  readonly autenticado = computed(() => {
    const p = this.payload();
    if (!p || !this.usuario()) return false;
    return !tokenExpirado(p) || !!this._refreshToken();
  });

  login(credenciais: LoginRequest): Observable<AuthResponse> {
    const resposta$ = this.semBackend
      ? loginLocal(credenciais)
      : this.http.post<AuthResponse>(`${API_URL}/auth/login`, credenciais);
    return resposta$.pipe(tap((resposta) => this.salvarSessao(resposta)));
  }

  /** Cria a conta (atleta ou treinador) e já autentica, igual ao login. */
  cadastrar(dados: CadastroRequest): Observable<AuthResponse> {
    const resposta$ = this.semBackend
      ? cadastroLocal(dados)
      : this.http.post<AuthResponse>(`${API_URL}/auth/cadastro`, dados);
    return resposta$.pipe(tap((resposta) => this.salvarSessao(resposta)));
  }

  /** Troca o refresh token por um novo par de tokens e devolve o novo access token. */
  renovarToken(): Observable<string> {
    const refreshToken = this._refreshToken();
    if (!refreshToken) return throwError(() => new Error('Sem refresh token'));

    const resposta$ = this.semBackend
      ? renovarLocal(this.payload()?.sub)
      : this.http.post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken });

    this.renovacao$ ??= resposta$
      .pipe(
        tap((resposta) => this.salvarSessao(resposta)),
        map((resposta) => resposta.accessToken),
        finalize(() => (this.renovacao$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.renovacao$;
  }

  podeRenovar(): boolean {
    return !!this._refreshToken();
  }

  accessTokenExpirado(): boolean {
    const p = this.payload();
    return !p || tokenExpirado(p);
  }

  /** Para onde mandar a pessoa: dashboard do perfil ou login. */
  rotaInicial(): string {
    const perfil = this.perfil();
    return perfil && this.autenticado() ? ROTA_INICIAL[perfil] : '/login';
  }

  logout(redirecionar = true): void {
    remover(ACCESS_KEY);
    remover(REFRESH_KEY);
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this.renovacao$ = null;
    if (redirecionar) {
      this.router.navigate(['/login']);
    }
  }

  private salvarSessao({ accessToken, refreshToken }: AuthResponse): void {
    gravar(ACCESS_KEY, accessToken);
    gravar(REFRESH_KEY, refreshToken);
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
  }
}

/** Lê o payload do JWT (a assinatura é validada pelo back-end). */
export function decodificarJwt(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function tokenExpirado(payload: Pick<JwtPayload, 'exp'>, margemSegundos = 10): boolean {
  if (!payload.exp) return false;
  return Date.now() / 1000 >= payload.exp - margemSegundos;
}

// localStorage pode falhar (modo privado, armazenamento bloqueado): a sessão só não persiste.
function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string): void {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* segue só em memória */
  }
}

function remover(chave: string): void {
  try {
    localStorage.removeItem(chave);
  } catch {
    /* nada a fazer */
  }
}

// ---------------------------------------------------------------------------
// Modo sem back-end (TEMPORÁRIO): imita /auth/cadastro e /auth/login no navegador.
// O perfil escolhido no cadastro vai para o token, e é ele que decide a tela após o login.
// Senhas não são guardadas nem conferidas: serve só para navegar pelas telas.
// ---------------------------------------------------------------------------

function usuariosLocais(): UsuarioLocal[] {
  try {
    return JSON.parse(ler(USUARIOS_LOCAIS_KEY) ?? '[]') as UsuarioLocal[];
  } catch {
    return [];
  }
}

function cadastroLocal(dados: CadastroRequest): Observable<AuthResponse> {
  const email = dados.email.trim().toLowerCase();
  const usuarios = usuariosLocais();
  if (usuarios.some((u) => u.email === email)) {
    return erroLocal(409, '/auth/cadastro');
  }
  const novo: UsuarioLocal = {
    id: crypto.randomUUID(),
    nome: dados.nome.trim(),
    email,
    perfil: dados.perfil,
    cpf: dados.cpf,
    dataNascimento: dados.dataNascimento,
    telefone: dados.telefone,
    fotoUrl: null,
  };
  gravar(USUARIOS_LOCAIS_KEY, JSON.stringify([...usuarios, novo]));
  return of(sessaoLocal(novo)).pipe(delay(300));
}

function loginLocal({ email }: LoginRequest): Observable<AuthResponse> {
  const usuario = usuariosLocais().find((u) => u.email === email.trim().toLowerCase());
  return usuario ? of(sessaoLocal(usuario)).pipe(delay(300)) : erroLocal(401, '/auth/login');
}

/** Gera um novo token com os dados atuais do usuário (ex.: depois de mudar nome ou e-mail). */
function renovarLocal(id: string | undefined): Observable<AuthResponse> {
  const usuario = usuariosLocais().find((u) => u.id === id);
  return usuario ? of(sessaoLocal(usuario)) : erroLocal(401, '/auth/refresh');
}

/** Token no mesmo formato do back-end (sem assinatura válida), válido por 24h */
function sessaoLocal(u: UsuarioLocal): AuthResponse {
  const payload: JwtPayload = {
    sub: u.id,
    nome: u.nome,
    email: u.email,
    roles: [u.perfil],
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  };
  const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  return { accessToken: `local.${base64}.local`, refreshToken: 'local' };
}

function erroLocal(status: number, rota: string): Observable<never> {
  // timer + throwError: o delay do RxJS não atrasa erros
  return timer(300).pipe(switchMap(() => throwError(() => new HttpErrorResponse({ status, url: `${API_URL}${rota}` }))));
}
