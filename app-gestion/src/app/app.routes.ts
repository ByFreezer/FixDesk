import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

/**
 * Rutas de la aplicación.
 * Todas usan carga diferida (lazy loading) con loadComponent.
 * - authGuard: solo usuarios logueados.
 * - roleGuard + data.role: solo el rol indicado (dashboard = admin).
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'incidencias',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/incidencias/incidencias.page').then((m) => m.IncidenciasPage),
  },
  {
    path: 'incidencias/nueva',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/incidencias/nueva-incidencia/nueva-incidencia.page').then(
        (m) => m.NuevaIncidenciaPage
      ),
  },
  {
    path: 'dashboard',
    canActivate: [roleGuard],
    data: { role: 'admin' },
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'ayuda',
    canActivate: [authGuard],
    loadComponent: () => import('./features/ayuda/ayuda.page').then((m) => m.AyudaPage),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
