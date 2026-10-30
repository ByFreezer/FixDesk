import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor de errores de sesión (solo para nuestra API; los errores de Supabase
 * los gestiona cada servicio con datos de respaldo).
 * - 401 Unauthorized: el token de acceso ya no vale → se renueva con el de refresco y
 *   se repite la petición UNA vez. Si no se puede renovar, se cierra sesión y se va al
 *   login guardando la pantalla actual en ?returnUrl.
 * - 403 Forbidden: hay sesión pero el rol no tiene permiso → aviso, sin cerrar sesión.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  if (req.url.startsWith(environment.supabaseUrl)) {
    return next(req);
  }

  const irAlLogin = (err: HttpErrorResponse): Observable<never> => {
    auth.logout();
    router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
    return throwError(() => err);
  };

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        const nuevoToken = auth.refreshAccessToken();
        if (!nuevoToken) {
          return irAlLogin(err);
        }
        const reintento = req.clone({ setHeaders: { Authorization: `Bearer ${nuevoToken}` } });
        // Si el reintento vuelve a dar 401 no se insiste: la sesión no es válida
        return next(reintento).pipe(
          catchError((err2: HttpErrorResponse) => (err2.status === 401 ? irAlLogin(err2) : throwError(() => err2)))
        );
      }

      if (err.status === 403) {
        toastCtrl
          .create({
            message: 'No tienes permisos para realizar esta acción.',
            duration: 3000,
            color: 'warning',
            position: 'top',
          })
          .then((t) => t.present());
      }

      return throwError(() => err);
    })
  );
};
