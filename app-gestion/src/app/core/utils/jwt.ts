import { hmacSha256, utf8Bytes } from './sha256';

/** Datos que guardamos dentro del token */
export interface TokenPayload {
  /** Id del usuario */
  sub: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'usuario';
  /** Fecha de creación (segundos) */
  iat: number;
  /** Fecha de caducidad (segundos) */
  exp: number;
}

/** Bytes → Base64URL (el formato que usan los JWT) */
function base64Url(bytes: number[]): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Base64URL → texto */
function fromBase64Url(texto: string): string {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return decodeURIComponent(escape(bin));
}

/**
 * Crea un token JWT (cabecera.datos.firma) firmado con HMAC-SHA256.
 * @param payload Datos del usuario y caducidad
 * @param clave Clave con la que se firma
 */
export function crearToken(payload: TokenPayload, clave: string): string {
  const cabecera = base64Url(utf8Bytes(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const datos = base64Url(utf8Bytes(JSON.stringify(payload)));
  const firma = base64Url(hmacSha256(clave, `${cabecera}.${datos}`));
  return `${cabecera}.${datos}.${firma}`;
}

/**
 * Comprueba la firma y la caducidad de un token.
 * @returns Los datos del token si es válido, o null si está manipulado o caducado
 */
export function verificarToken(token: string | null, clave: string, ahora = Date.now()): TokenPayload | null {
  if (!token) return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  const [cabecera, datos, firma] = partes;
  if (base64Url(hmacSha256(clave, `${cabecera}.${datos}`)) !== firma) return null;
  try {
    const payload = JSON.parse(fromBase64Url(datos)) as TokenPayload;
    if (!payload.exp || payload.exp * 1000 < ahora) return null;
    return payload;
  } catch {
    return null;
  }
}
