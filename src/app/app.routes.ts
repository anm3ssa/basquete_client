import { Routes } from '@angular/router';
import { authGuard, visitanteGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./features/routes/login/login').then((m) => m.Login),
    title: 'Entrar · Basquete Assis',
  },
  {
    // Tudo aqui dentro exige login e aparece com sidebar, header e footer
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/routes/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard · Basquete Assis',
      },
      {
        path: 'atletas',
        title: 'Atletas · Basquete Assis',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/routes/atletas/atleta-list/atleta-list').then(
                (m) => m.AtletaList,
              ),
          },
          {
            path: 'novo',
            loadComponent: () =>
              import('./features/routes/atletas/atleta-form/atleta-form').then(
                (m) => m.AtletaForm,
              ),
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/routes/atletas/atleta-form/atleta-form').then(
                (m) => m.AtletaForm,
              ),
          },
        ],
      },
      {
        path: 'treinadores',
        title: 'Treinadores · Basquete Assis',
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './features/routes/treinadores/treinador-list/treinador-list'
              ).then((m) => m.TreinadorList),
          },
          {
            path: 'novo',
            loadComponent: () =>
              import('./features/routes/treinadores/treinador-form/treinador-form').then(
                (m) => m.TreinadorForm,
              ),
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/routes/treinadores/treinador-form/treinador-form').then(
                (m) => m.TreinadorForm,
              ),
          },
        ],
      },
      {
        path: 'treinos',
        title: 'Treinos · Basquete Assis',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/routes/treinos/treino-list/treino-list').then(
                (m) => m.TreinoList,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/routes/treinos/treino-info/treino-info').then(
                (m) => m.TreinoInfo,
              ),
          },
        ],
      },
      {
        path: 'agendamentos',
        title: 'Agendamentos · Basquete Assis',
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './features/routes/agendamentos/agendamento-list/agendamento-list'
              ).then((m) => m.AgendamentoList),
          },
          {
            path: 'novo',
            loadComponent: () =>
              import(
                './features/routes/agendamentos/agendamento-form/agendamento-form'
              ).then((m) => m.AgendamentoForm),
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import(
                './features/routes/agendamentos/agendamento-form/agendamento-form'
              ).then((m) => m.AgendamentoForm),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
