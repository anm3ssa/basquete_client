import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

/** Ajuste os nomes conforme o retorno real da sua API (ex.: accessToken). */
export interface LoginResponse {
  token: string;
}

export interface JwtPayload {
  sub: string;
  exp: number;
  iat?: number;
  nome?: string;
  roles?: string[];
  [claim: string]: unknown;
}

/** Endereço base da API. Ajuste para a URL do seu back-end. */
export const API_URL = 'http://localhost:8080/api';

const TOKEN_KEY = 'basquete-assis.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(this.lerTokenSalvo());

  readonly token = this._token.asReadonly();
  readonly usuario = computed(() => {
    const token = this._token();
    return token ? decodificarJwt(token) : null;
  });
  readonly autenticado = computed(() => {
    const payload = this.usuario();
    return !!payload && !tokenExpirado(payload);
  });

  login(credenciais: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, credenciais)
      .pipe(tap(({ token }) => this.salvarToken(token)));
  }

  logout(redirecionar = true): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    if (redirecionar) {
      this.router.navigate(['/login']);
    }
  }

  private salvarToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  private lerTokenSalvo(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      const payload = decodificarJwt(token);
      if (!payload || tokenExpirado(payload)) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return token;
    } catch {
      return null;
    }
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

export function tokenExpirado(payload: JwtPayload, margemSegundos = 10): boolean {
  if (!payload.exp) return false;
  return Date.now() / 1000 >= payload.exp - margemSegundos;
}
