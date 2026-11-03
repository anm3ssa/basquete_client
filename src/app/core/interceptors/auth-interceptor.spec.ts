import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_URL, AuthService, MODO_SEM_BACKEND } from '../services/auth';
import { Role } from '../../shared/models';
import { authInterceptor } from './auth-interceptor';

/** JWT de teste (assinatura falsa: o front só lê o payload). */
function jwtDeTeste(role: Role, extras: Record<string, unknown> = {}): string {
  const payload = {
    sub: '1',
    nome: 'Usuário Teste',
    email: 'teste@email.com',
    roles: [role],
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...extras,
  };
  return `x.${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}.x`;
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let api: HttpTestingController;
  let auth: AuthService;

  /** Abre uma sessão com o access token informado */
  function entrar(accessToken: string, refreshToken = 'r1'): void {
    auth.login({ email: 'a@a.com', password: '123456' }).subscribe();
    api.expectOne(`${API_URL}/auth/login`).flush({ accessToken, refreshToken });
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: MODO_SEM_BACKEND, useValue: false },
      ],
    });
    http = TestBed.inject(HttpClient);
    api = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => api.verify());

  it('envia o Bearer token nas chamadas à API', () => {
    const token = jwtDeTeste('ROLE_TREINADOR');
    entrar(token);

    http.get(`${API_URL}/atletas`).subscribe();
    const req = api.expectOne(`${API_URL}/atletas`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush([]);
  });

  it('não envia token para login/cadastro nem para outros domínios', () => {
    entrar(jwtDeTeste('ROLE_ATLETA'));

    http.get('https://viacep.com.br/ws/19800000/json').subscribe();
    const externo = api.expectOne('https://viacep.com.br/ws/19800000/json');
    expect(externo.request.headers.has('Authorization')).toBe(false);
    externo.flush({});

    http.post(`${API_URL}/auth/cadastro`, {}).subscribe({ error: () => undefined });
    const cadastro = api.expectOne(`${API_URL}/auth/cadastro`);
    expect(cadastro.request.headers.has('Authorization')).toBe(false);
    cadastro.flush(null, { status: 400, statusText: 'Bad Request' });
  });

  it('em 401: renova o token e repete a requisição com o novo', () => {
    entrar(jwtDeTeste('ROLE_TREINADOR'));
    let resposta: unknown;

    http.get(`${API_URL}/atletas`).subscribe((r) => (resposta = r));
    api.expectOne(`${API_URL}/atletas`).flush(null, { status: 401, statusText: 'Unauthorized' });

    const novo = jwtDeTeste('ROLE_TREINADOR', { iat: 2 });
    api.expectOne(`${API_URL}/auth/refresh`).flush({ accessToken: novo, refreshToken: 'r2' });

    const repetida = api.expectOne(`${API_URL}/atletas`);
    expect(repetida.request.headers.get('Authorization')).toBe(`Bearer ${novo}`);
    repetida.flush(['ok']);
    expect(resposta).toEqual(['ok']);
  });

  it('renova antes de enviar quando o access token já venceu', () => {
    entrar(jwtDeTeste('ROLE_ATLETA', { exp: Math.floor(Date.now() / 1000) - 60 }));

    http.get(`${API_URL}/time`).subscribe();
    const novo = jwtDeTeste('ROLE_ATLETA');
    api.expectOne(`${API_URL}/auth/refresh`).flush({ accessToken: novo, refreshToken: 'r2' });

    const req = api.expectOne(`${API_URL}/time`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${novo}`);
    req.flush({});
  });

  it('se a renovação falhar, encerra a sessão', () => {
    entrar(jwtDeTeste('ROLE_ATLETA'));
    let erro: unknown;

    http.get(`${API_URL}/time`).subscribe({ error: (e) => (erro = e) });
    api.expectOne(`${API_URL}/time`).flush(null, { status: 401, statusText: 'Unauthorized' });
    api.expectOne(`${API_URL}/auth/refresh`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(erro).toBeTruthy();
    expect(auth.autenticado()).toBe(false);
  });

  it('erros que não são 401 passam direto, sem renovar', () => {
    entrar(jwtDeTeste('ROLE_ATLETA'));
    let status = 0;

    http.get(`${API_URL}/time`).subscribe({ error: (e) => (status = e.status) });
    api.expectOne(`${API_URL}/time`).flush(null, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
    expect(auth.autenticado()).toBe(true);
  });
});
