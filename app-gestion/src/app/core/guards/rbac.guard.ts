import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { NOMBRE_ROL, PERMISOS_POR_ROL, Permiso, UserRole } from '../models/user.model';

/**
 * Autorización (RBAC) con canMatch: la ruta exige el permiso indicado en data.permiso.
 * Se usa canMatch y no canActivate porque actúa al EMPAREJAR la ruta: si el rol no tiene
 * permiso, para el router la ruta "no existe" (no se carga su código ni se evalúa nada más)
 * y, junto con SelectivePreloadingStrategy, su chunk tampoco se precarga en segundo plano.
 */
export const rbacGuard: CanMatchFn = async (route, segments) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  const permiso = route.data?.['permiso'] as Permiso | undefined;

  if (!authService.isAuthenticated()) {
    const returnUrl = '/' + segments.map((s) => s.path).join('/');
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }

  if (permiso && !authService.can(permiso)) {
    const roles = (Object.keys(PERMISOS_POR_ROL) as UserRole[])
      .filter((r) => PERMISOS_POR_ROL[r].includes(permiso))
      .map((r) => NOMBRE_ROL[r]);
    const toast = await toastCtrl.create({
      message: `Acceso restringido: se requiere rol ${roles.join(' o ')}.`,
      duration: 3000,
      color: 'warning',
      position: 'top',
    });
    await toast.present();
    return router.createUrlTree(['/incidencias']);
  }

  return true;
};
