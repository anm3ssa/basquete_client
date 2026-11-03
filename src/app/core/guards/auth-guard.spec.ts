import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';

import { Role } from '../../shared/models';
import { autenticadoGuard, perfilGuard, visitanteGuard } from './auth-guard';

/** Abre uma sessão gravando um token de teste onde o AuthService lê (localStorage). */
function entrar(role: Role): void {
  const payload = {
    sub: '1',
    nome: 'Usuário Teste',
    email: 'teste@email.com',
    roles: [role],
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const token = `x.${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}.x`;
  localStorage.setItem('basquete-assis.access-token', token);
  localStorage.setItem('basquete-assis.refresh-token', 'teste');
}

describe('guards de autenticação e perfil', () => {
  let router: Router;

  const segmentos = (url: string) => url.split('/').filter(Boolean).map((p) => new UrlSegment(p, {}));
  const executar = <T>(fn: () => T) => TestBed.runInInjectionContext(fn);
  const urlDe = (r: unknown) => (r instanceof UrlTree ? router.serializeUrl(r) : r);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    router = TestBed.inject(Router);
  });

  it('sem sessão: área logada manda para o login guardando o endereço', () => {
    const r = executar(() => autenticadoGuard({} as Route, segmentos('/treinador/atletas')));
    expect(urlDe(r)).toBe('/login?returnUrl=%2Ftreinador%2Fatletas');
  });

  it('com sessão: libera a área logada', () => {
    entrar('ROLE_ATLETA');
    expect(executar(() => autenticadoGuard({} as Route, segmentos('/atleta/dashboard')))).toBe(true);
  });

  it('RBAC: atleta não entra na área do treinador e volta para o próprio dashboard', () => {
    entrar('ROLE_ATLETA');
    const r = executar(() => perfilGuard('ROLE_TREINADOR')({} as Route, []));
    expect(urlDe(r)).toBe('/atleta/dashboard');
  });

  it('RBAC: treinador entra na área do treinador', () => {
    entrar('ROLE_TREINADOR');
    expect(executar(() => perfilGuard('ROLE_TREINADOR')({} as Route, []))).toBe(true);
  });

  it('login/cadastro: quem já está logado vai para o dashboard do perfil', () => {
    entrar('ROLE_TREINADOR');
    const r = executar(() => visitanteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(urlDe(r)).toBe('/treinador/dashboard');
  });
});
