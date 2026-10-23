import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/** Rotas privadas: sem token válido, volta ao login guardando o destino. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) return true;

  auth.logout(false);
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Quem já está logado não volta para a tela de login. */
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.autenticado() ? router.createUrlTree(['/dashboard']) : true;
};
