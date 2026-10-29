import { authReducer, initialAuthState } from './auth.store';

describe('authReducer', () => {
  const user = { id: '1', email: 'a@b.com', nombre: 'A', rol: 'admin' as const };

  it('marca loading al iniciar el login', () => {
    expect(authReducer(initialAuthState, { type: '[Auth] Login' }).loading).toBe(true);
  });

  it('guarda el usuario y el token al hacer login', () => {
    const s = authReducer(initialAuthState, { type: '[Auth] Login Success', user, token: 't' });
    expect(s.user).toEqual(user);
    expect(s.token).toBe('t');
    expect(s.loading).toBe(false);
  });

  it('guarda el error si falla el login', () => {
    expect(authReducer(initialAuthState, { type: '[Auth] Login Failure', error: 'mal' }).error).toBe('mal');
  });

  it('limpia el estado al cerrar sesión', () => {
    const logueado = authReducer(initialAuthState, { type: '[Auth] Login Success', user, token: 't' });
    expect(authReducer(logueado, { type: '[Auth] Logout' })).toEqual(initialAuthState);
  });

  it('no modifica el estado anterior (inmutable)', () => {
    const antes = { ...initialAuthState };
    authReducer(initialAuthState, { type: '[Auth] Login' });
    expect(initialAuthState).toEqual(antes);
  });
});
