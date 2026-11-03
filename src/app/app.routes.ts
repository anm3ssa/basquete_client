import { Routes } from '@angular/router';
import {
  autenticadoGuard,
  perfilGuard,
  redirecionarParaInicio,
  visitanteGuard,
} from './core/guards/auth-guard';

export const routes: Routes = [
  // ---------- Públicas ----------
  {
    path: 'login',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./features/routes/login/login').then((m) => m.Login),
    title: 'Entrar · Basquete Assis',
  },
  {
    path: 'cadastro',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./features/routes/cadastro/cadastro').then((m) => m.Cadastro),
    title: 'Cadastro · Basquete Assis',
  },

  // ---------- Área logada (sidebar, header e footer) ----------
  {
    path: '',
    canMatch: [autenticadoGuard],
    loadComponent: () =>
      import('./features/layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: 'atleta',
        canMatch: [perfilGuard('ROLE_ATLETA')],
        loadChildren: () => import('./features/routes/atleta/atleta.routes'),
      },
      {
        path: 'treinador',
        canMatch: [perfilGuard('ROLE_TREINADOR')],
        loadChildren: () => import('./features/routes/treinador/treinador.routes'),
      },
      // "/" leva ao dashboard do perfil
      { path: '', pathMatch: 'full', redirectTo: redirecionarParaInicio },
    ],
  },

  // Qualquer outro endereço: dashboard do perfil, ou login se não houver sessão
  { path: '**', redirectTo: redirecionarParaInicio },
];
