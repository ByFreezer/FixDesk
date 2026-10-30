import { Injectable, computed, signal } from '@angular/core';
import { PERMISOS_POR_ROL, Permiso, User, UserRole } from '../models/user.model';

/**
 * Estado global de autenticación.
 * Sigue el patrón Redux: un único estado, acciones y una función reductora pura.
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

/** Acciones que pueden cambiar el estado */
export type AuthAction =
  | { type: '[Auth] Login' }
  | { type: '[Auth] Login Success'; user: User; token: string }
  | { type: '[Auth] Login Failure'; error: string }
  | { type: '[Auth] Token Refreshed'; token: string }
  | { type: '[Auth] Logout' };

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

/**
 * Reductor: recibe el estado actual y una acción y devuelve un estado NUEVO
 * (nunca modifica el anterior). Así los cambios son predecibles y fáciles de probar.
 */
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case '[Auth] Login':
      return { ...state, loading: true, error: null };
    case '[Auth] Login Success':
      return { user: action.user, token: action.token, loading: false, error: null };
    case '[Auth] Login Failure':
      return { ...initialAuthState, error: action.error };
    case '[Auth] Token Refreshed':
      return { ...state, token: action.token };
    case '[Auth] Logout':
      return { ...initialAuthState };
    default:
      return state;
  }
}

/**
 * Store de autenticación basado en signals.
 * Los componentes leen el estado con los selectores y lo cambian solo con dispatch().
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _state = signal<AuthState>(initialAuthState);

  /** Estado completo (solo lectura) */
  readonly state = this._state.asReadonly();

  // Selectores
  readonly user = computed(() => this._state().user);
  readonly token = computed(() => this._state().token);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly isLoggedIn = computed(() => this._state().user !== null);
  readonly isAdmin = computed(() => this._state().user?.rol === 'admin');
  readonly rol = computed<UserRole | null>(() => this._state().user?.rol ?? null);
  /** Permisos del usuario actual según la matriz RBAC (vacío si no hay sesión) */
  readonly permisos = computed<readonly Permiso[]>(() => {
    const rol = this.rol();
    return rol ? PERMISOS_POR_ROL[rol] : [];
  });

  /** Única forma de cambiar el estado */
  dispatch(action: AuthAction): void {
    this._state.update((s) => authReducer(s, action));
  }
}
