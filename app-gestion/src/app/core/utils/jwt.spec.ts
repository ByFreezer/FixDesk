import { crearToken, verificarToken, TokenPayload } from './jwt';

describe('jwt', () => {
  const clave = 'clave-test';
  const ahora = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = { sub: 'u1', email: 'a@b.com', nombre: 'Test', rol: 'usuario', permisos: ['incidencias:ver'], typ: 'access', iat: ahora, exp: ahora + 60 };

  it('genera un token con 3 partes', () => {
    expect(crearToken(payload, clave).split('.').length).toBe(3);
  });

  it('verifica un token válido', () => {
    expect(verificarToken(crearToken(payload, clave), clave)?.email).toBe('a@b.com');
  });

  it('rechaza un token manipulado (cambio de rol)', () => {
    const [cab, , firma] = crearToken(payload, clave).split('.');
    const falso = btoa(JSON.stringify({ ...payload, rol: 'admin' })).replace(/=+$/, '');
    expect(verificarToken(`${cab}.${falso}.${firma}`, clave)).toBeNull();
  });

  it('rechaza un token caducado', () => {
    const caducado = crearToken({ ...payload, exp: ahora - 10 }, clave);
    expect(verificarToken(caducado, clave)).toBeNull();
  });
});
