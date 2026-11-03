import { Routes } from '@angular/router';

/** Área do atleta (ROLE_ATLETA): consulta e confirmação. */
export default [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.AtletaDashboard),
    title: 'Menu inicial · Basquete Assis',
  },
  {
    path: 'calendario',
    loadComponent: () => import('./calendario/calendario').then((m) => m.AtletaCalendario),
    title: 'Calendário · Basquete Assis',
  },
  {
    path: 'meu-time',
    loadComponent: () => import('./meu-time/meu-time').then((m) => m.MeuTime),
    title: 'Meu time · Basquete Assis',
  },
  {
    path: 'desempenho',
    loadComponent: () => import('./desempenho/desempenho').then((m) => m.AtletaDesempenho),
    title: 'Desempenho · Basquete Assis',
  },
  {
    path: 'configuracoes',
    loadComponent: () => import('../configuracoes/configuracoes').then((m) => m.Configuracoes),
    title: 'Configurações · Basquete Assis',
  },
] satisfies Routes;
