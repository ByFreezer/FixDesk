import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, throwError, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { AuthStore } from '../state/auth.store';
import { sha256 } from '../utils/sha256';
import { crearToken, verificarToken } from '../utils/jwt';

/** Usuario de prueba: la contraseña NO se guarda, solo su hash SHA-256 */
interface UsuarioDemo extends User {
  passwordHash: string;
}

/**
 * Servicio de autenticación.
 * - Comprueba la contraseña comparando hashes SHA-256 (nunca en texto plano).
 * - Genera un token JWT firmado que caduca a las 8 horas.
 * - Guarda el estado en el AuthStore (patrón Redux).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private store = inject(AuthStore);

  private readonly STORAGE_KEY = 'fixdesk_token';
  private readonly SALT = 'fixdesk-2026';
  /** Clave de firma del token de la demo (no es una clave de ningún servicio externo) */
  private readonly CLAVE_FIRMA = 'fixdesk-demo-signing-key';
  private readonly DURACION_HORAS = 8;

  /** Usuarios ficticios de prueba (datos sintéticos) */
  private readonly USUARIOS: UsuarioDemo[] = [
    {
      id: 'usr-1',
      email: 'admin@empresa.com',
      nombre: 'Administrador Demo',
      rol: 'admin',
      passwordHash: 'b7d688c0c404a0536a68add5bcd7ca3f313c6b80b251e7717749142bd9c7c5ac',
    },
    {
      id: 'usr-2',
      email: 'usuario@empresa.com',
      nombre: 'Usuario Demo',
      rol: 'usuario',
      passwordHash: '8a394d6e10a4013da2024605af06c7ed78d0fb02029996090d43a92a6e80c5a2',
    },
  ];

  /** Usuario actual como Observable (para quien lo prefiera a los signals) */
  readonly currentUser$: Observable<User | null> = toObservable(this.store.user);

  get currentUserValue(): User | null {
    return this.store.user();
  }

  /** Token actual (lo usa el interceptor HTTP) */
  get token(): string | null {
    return this.store.token();
  }

  /** Hay sesión y el token sigue siendo válido (firma correcta y sin caducar) */
  isAuthenticated(): boolean {
    if (!this.store.isLoggedIn()) return false;
    if (!verificarToken(this.store.token(), this.CLAVE_FIRMA)) {
      this.logout();
      return false;
    }
    return true;
  }

  isAdmin(): boolean {
    return this.store.isAdmin();
  }

  hasRole(role: UserRole): boolean {
    return this.store.user()?.rol === role;
  }

  /**
   * Inicia sesión.
   * @param email Correo del usuario
   * @param password Contraseña escrita en el formulario
   */
  login(email: string, password: string): Observable<User> {
    this.store.dispatch({ type: '[Auth] Login' });

    return timer(300).pipe(
      switchMap(() => {
        const hash = sha256(`${this.SALT}:${password}`);
        const encontrado = this.USUARIOS.find(
          (u) => u.email === (email || '').trim().toLowerCase() && u.passwordHash === hash
        );

        if (!encontrado) {
          const error = 'Credenciales incorrectas. Verifique correo y contraseña.';
          this.store.dispatch({ type: '[Auth] Login Failure', error });
          return throwError(() => new Error(error));
        }

        const { passwordHash: _, ...user } = encontrado;
        const ahora = Math.floor(Date.now() / 1000);
        const token = crearToken(
          { sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol, iat: ahora, exp: ahora + this.DURACION_HORAS * 3600 },
          this.CLAVE_FIRMA
        );
        return of({ user, token });
      }),
      tap(({ user, token }) => {
        this.guardarToken(token);
        this.store.dispatch({ type: '[Auth] Login Success', user, token });
      }),
      switchMap(({ user }) => of(user))
    );
  }

  /** Cierra la sesión y borra el token */
  logout(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch {
      /* sin almacenamiento disponible */
    }
    this.store.dispatch({ type: '[Auth] Logout' });
  }

  /**
   * Recupera la sesión al recargar la página.
   * Si alguien modifica el token a mano (por ejemplo para cambiarse el rol),
   * la firma deja de coincidir y la sesión se descarta.
   */
  restoreSession(): void {
    let token: string | null = null;
    try {
      token = sessionStorage.getItem(this.STORAGE_KEY);
    } catch {
      token = null;
    }
    const payload = verificarToken(token, this.CLAVE_FIRMA);
    if (token && payload) {
      const user: User = { id: payload.sub, email: payload.email, nombre: payload.nombre, rol: payload.rol };
      this.store.dispatch({ type: '[Auth] Login Success', user, token });
    } else {
      this.logout();
    }
  }

  private guardarToken(token: string): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, token);
    } catch {
      /* sin almacenamiento disponible */
    }
  }
}
