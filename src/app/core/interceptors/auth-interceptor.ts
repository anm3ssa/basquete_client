import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_URL, AuthService } from '../services/auth';

/** Anexa o JWT nas chamadas à API e encerra a sessão em caso de 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  const ehApi = req.url.startsWith(API_URL);
  const ehLogin = req.url.endsWith('/auth/login');

  const requisicao =
    token && ehApi && !ehLogin
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(requisicao).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status === 401 && !ehLogin) {
        auth.logout();
      }
      return throwError(() => erro);
    }),
  );
};
