import { Routes } from '@angular/router';
import { alteracoesPendentesGuard } from '../../../core/guards/auth-guard';

/** Área do treinador (ROLE_TREINADOR): gestão, escalação e edição. */
export default [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.TreinadorDashboard),
    title: 'Menu inicial · Basquete Assis',
  },
  {
    path: 'calendario',
    loadComponent: () => import('./calendario/calendario').then((m) => m.TreinadorCalendario),
    title: 'Calendário · Basquete Assis',
  },
  {
    path: 'atletas',
    loadComponent: () => import('./atletas/atletas-lista').then((m) => m.AtletasLista),
    title: 'Atletas · Basquete Assis',
  },
  {
    path: 'desempenho',
    loadComponent: () => import('./desempenho/desempenho').then((m) => m.TreinadorDesempenho),
    canDeactivate: [alteracoesPendentesGuard],
    title: 'Desempenho · Basquete Assis',
  },
  {
    path: 'jogos/:id/registro',
    loadComponent: () => import('./registro-jogo/registro-jogo').then((m) => m.RegistroJogo),
    canDeactivate: [alteracoesPendentesGuard],
    title: 'Registro do jogo · Basquete Assis',
  },
  {
    path: 'configuracoes',
    loadComponent: () => import('../configuracoes/configuracoes').then((m) => m.Configuracoes),
    title: 'Configurações · Basquete Assis',
  },
] satisfies Routes;
