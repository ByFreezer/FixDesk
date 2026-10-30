import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rbacGuard } from './core/guards/rbac.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

/**
 * Rutas de la aplicación.
 * Todas usan carga diferida (lazy loading) con loadComponent.
 * - authGuard (canActivate): solo usuarios logueados; si no, login con ?returnUrl.
 * - rbacGuard (canMatch) + data.permiso: solo los roles con ese permiso (ver PERMISOS_POR_ROL).
 *   Al ser canMatch la ruta ni siquiera se empareja y su chunk no se precarga para ese rol.
 * - pendingChangesGuard (canDeactivate): avisa antes de abandonar un formulario a medias.
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
    canDeactivate: [pendingChangesGuard],
    loadComponent: () =>
      import('./features/incidencias/nueva-incidencia/nueva-incidencia.page').then(
        (m) => m.NuevaIncidenciaPage
      ),
  },
  {
    path: 'dashboard',
    canMatch: [rbacGuard],
    data: { permiso: 'dashboard:ver' },
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
