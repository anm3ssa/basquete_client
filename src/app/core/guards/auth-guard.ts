import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, CanMatchFn, Router } from '@angular/router';
import { Role } from '../../shared/models';
import { AuthService } from '../services/auth';

/**
 * Área logada. Usa CanMatch: sem sessão, o Angular nem baixa o código da área
 * e a pessoa vai para o login guardando o endereço que tentou abrir.
 */
export const autenticadoGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) return true;

  auth.logout(false);
  const returnUrl = '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/login'], {
    queryParams: returnUrl === '/' ? {} : { returnUrl },
  });
};

/**
 * RBAC: só entra na área quem tem o perfil. Quem tem outro perfil
 * é mandado para o próprio dashboard.
 */
export function perfilGuard(perfil: Role): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.perfil() === perfil ? true : router.parseUrl(auth.rotaInicial());
  };
}

/** Login e cadastro: quem já está logado vai direto para o seu dashboard. */
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.autenticado() ? router.parseUrl(auth.rotaInicial()) : true;
};

/** Telas com edição implementam isto para avisar antes de sair sem salvar. */
export interface ComAlteracoesPendentes {
  podeSair(): boolean | Promise<boolean>;
}

export const alteracoesPendentesGuard: CanDeactivateFn<ComAlteracoesPendentes> = (componente) =>
  componente.podeSair();

/** Usado em redirectTo: manda para o dashboard do perfil (ou para o login). */
export function redirecionarParaInicio(): string {
  return inject(AuthService).rotaInicial();
}
