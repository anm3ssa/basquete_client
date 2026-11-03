import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { API_URL, AuthService, ROTAS_PUBLICAS } from '../services/auth';

/**
 * Injeta o Bearer token nas chamadas à API e cuida da renovação:
 * 1. Se o access token já venceu, renova antes de enviar.
 * 2. Se a API responder 401, renova uma vez e repete a requisição.
 * 3. Se a renovação falhar, encerra a sessão.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const ehApi = req.url.startsWith(API_URL);
  const ehRotaPublica = ROTAS_PUBLICAS.some((rota) => req.url.endsWith(rota));
  if (!ehApi || ehRotaPublica) return next(req);

  const encerrarSessao = (erro: unknown) => {
    auth.logout();
    return throwError(() => erro);
  };

  const token$ =
    auth.accessTokenExpirado() && auth.podeRenovar() ? auth.renovarToken() : of(auth.token());

  return token$.pipe(
    catchError(encerrarSessao),
    switchMap((token) =>
      next(comBearer(req, token)).pipe(
        catchError((erro: unknown) => {
          if (!(erro instanceof HttpErrorResponse) || erro.status !== 401) {
            return throwError(() => erro);
          }
          if (!auth.podeRenovar()) return encerrarSessao(erro);

          return auth.renovarToken().pipe(
            catchError(encerrarSessao),
            switchMap((novoToken) => next(comBearer(req, novoToken))),
          );
        }),
      ),
    ),
  );
};

function comBearer<T>(req: HttpRequest<T>, token: string | null): HttpRequest<T> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}
