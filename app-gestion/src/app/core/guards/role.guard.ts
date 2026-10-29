import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  const requiredRole = route.data['role'] as UserRole | undefined;

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (requiredRole && !authService.hasRole(requiredRole)) {
    const toast = await toastCtrl.create({
      message: `Acceso restringido: Se requiere rol de ${requiredRole === 'admin' ? 'Administrador' : requiredRole}.`,
      duration: 3000,
      color: 'warning',
      position: 'top'
    });
    await toast.present();
    return router.createUrlTree(['/incidencias']);
  }

  return true;
};
