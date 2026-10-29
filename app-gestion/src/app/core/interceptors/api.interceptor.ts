import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor HTTP: añade las cabeceras a TODAS las peticiones sin repetir código.
 * - Peticiones a Supabase: clave pública "apikey" del proyecto.
 * - Resto de peticiones a nuestra API: token JWT de la sesión (Authorization: Bearer).
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.supabaseUrl)) {
    return next(req.clone({ setHeaders: { apikey: environment.supabaseKey } }));
  }

  const token = inject(AuthService).token;
  if (token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
