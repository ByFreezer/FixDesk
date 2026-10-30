import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, throwError, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { PERMISOS_POR_ROL, Permiso, User, UserRole } from '../models/user.model';
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
 * - Emite dos tokens JWT firmados: uno de acceso (15 min) y uno de refresco (8 h).
 * - Cuando el de acceso caduca, se renueva con el de refresco sin pedir de nuevo la contraseña.
 * - Guarda el estado en el AuthStore (patrón Redux).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private store = inject(AuthStore);

  private readonly STORAGE_KEY = 'fixdesk_token';
  private readonly REFRESH_KEY = 'fixdesk_refresh';
  private readonly SALT = 'fixdesk-2026';
  /** Clave de firma del token de la demo (no es una clave de ningún servicio externo) */
  private readonly CLAVE_FIRMA = 'fixdesk-demo-signing-key';
  private readonly ACCESO_MINUTOS = 15;
  private readonly REFRESCO_HORAS = 8;

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
      id: 'usr-3',
      email: 'tecnico@empresa.com',
      nombre: 'Técnico Demo',
      rol: 'tecnico',
      passwordHash: 'b95c7754ebc3e5f1bf6fe8f322e5a87b96713888c4d3359a6779dda5b487453a',
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

  /** Token de acceso actual (lo usa el interceptor HTTP) */
  get token(): string | null {
    return this.store.token();
  }

  /**
   * Hay sesión y el token de acceso es válido (firma correcta y sin caducar).
   * Si ha caducado pero el de refresco sigue vigente, se renueva aquí mismo.
   */
  isAuthenticated(): boolean {
    if (!this.store.isLoggedIn()) return false;
    if (this.payloadValido(this.store.token(), 'access')) return true;
    return this.refreshAccessToken() !== null;
  }

  isAdmin(): boolean {
    return this.store.isAdmin();
  }

  /** El usuario tiene alguno de los roles indicados */
  hasRole(...roles: UserRole[]): boolean {
    const rol = this.store.rol();
    return rol !== null && roles.includes(rol);
  }

  /** El rol del usuario incluye el permiso indicado (matriz PERMISOS_POR_ROL) */
  can(permiso: Permiso): boolean {
    return this.store.permisos().includes(permiso);
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
        return of({ user, token: this.emitirToken(user, 'access'), refresh: this.emitirToken(user, 'refresh') });
      }),
      tap(({ user, token, refresh }) => {
        this.guardar(this.STORAGE_KEY, token);
        this.guardar(this.REFRESH_KEY, refresh);
        this.store.dispatch({ type: '[Auth] Login Success', user, token });
      }),
      switchMap(({ user }) => of(user))
    );
  }

  /**
   * Renueva el token de acceso usando el de refresco.
   * El rol se vuelve a leer del "servidor" (lista de usuarios), así un cambio de rol
   * se aplica en la siguiente renovación sin esperar a que el usuario cierre sesión.
   * @returns El nuevo token, o null si el refresco no es válido (en ese caso se cierra la sesión)
   */
  refreshAccessToken(): string | null {
    const payload = this.payloadValido(this.leer(this.REFRESH_KEY), 'refresh');
    const encontrado = payload && this.USUARIOS.find((u) => u.id === payload.sub);
    if (!encontrado) {
      this.logout();
      return null;
    }
    const { passwordHash: _, ...user } = encontrado;
    const token = this.emitirToken(user, 'access');
    this.guardar(this.STORAGE_KEY, token);
    if (this.store.isLoggedIn()) {
      this.store.dispatch({ type: '[Auth] Token Refreshed', token });
    } else {
      this.store.dispatch({ type: '[Auth] Login Success', user, token });
    }
    return token;
  }

  /** Cierra la sesión y borra los dos tokens */
  logout(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.REFRESH_KEY);
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
    const token = this.leer(this.STORAGE_KEY);
    const payload = this.payloadValido(token, 'access');
    if (token && payload) {
      const user: User = { id: payload.sub, email: payload.email, nombre: payload.nombre, rol: payload.rol };
      this.store.dispatch({ type: '[Auth] Login Success', user, token });
    } else {
      // Acceso caducado o manipulado: se intenta con el de refresco (si falla, cierra sesión)
      this.refreshAccessToken();
    }
  }

  /** Crea un token firmado con los claims del usuario: rol, permisos y caducidad */
  private emitirToken(user: User, typ: 'access' | 'refresh'): string {
    const ahora = Math.floor(Date.now() / 1000);
    const duracion = typ === 'access' ? this.ACCESO_MINUTOS * 60 : this.REFRESCO_HORAS * 3600;
    return crearToken(
      {
        sub: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        permisos: [...PERMISOS_POR_ROL[user.rol]],
        typ,
        iat: ahora,
        exp: ahora + duracion,
      },
      this.CLAVE_FIRMA
    );
  }

  /** Verifica firma y caducidad, y que el token sea del tipo esperado */
  private payloadValido(token: string | null, typ: 'access' | 'refresh') {
    const payload = verificarToken(token, this.CLAVE_FIRMA);
    return payload?.typ === typ ? payload : null;
  }

  private leer(clave: string): string | null {
    try {
      return sessionStorage.getItem(clave);
    } catch {
      return null;
    }
  }

  private guardar(clave: string, token: string): void {
    try {
      sessionStorage.setItem(clave, token);
    } catch {
      /* sin almacenamiento disponible */
    }
  }
}
