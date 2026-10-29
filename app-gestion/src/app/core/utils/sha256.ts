/**
 * Implementación sencilla de SHA-256 y HMAC-SHA256 en TypeScript.
 * Se usa para no guardar contraseñas en texto plano y para firmar el token de sesión.
 * (Funciona igual en el navegador y en los tests, sin depender de crypto.subtle).
 */

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/** Convierte un texto a bytes UTF-8 */
export function utf8Bytes(texto: string): number[] {
  const bin = unescape(encodeURIComponent(texto));
  const bytes: number[] = [];
  for (let i = 0; i < bin.length; i++) bytes.push(bin.charCodeAt(i));
  return bytes;
}

/** SHA-256 de un array de bytes. Devuelve 32 bytes. */
export function sha256Bytes(datos: number[]): number[] {
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const msg = [...datos, 0x80];
  while (msg.length % 64 !== 56) msg.push(0);
  const bits = datos.length * 8;
  for (let i = 7; i >= 0; i--) msg.push(i >= 4 ? 0 : (bits >>> (i * 8)) & 0xff);

  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  const w = new Array<number>(64);

  for (let off = 0; off < msg.length; off += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = (msg[off + i * 4] << 24) | (msg[off + i * 4 + 1] << 16) | (msg[off + i * 4 + 2] << 8) | msg[off + i * 4 + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }

  const out: number[] = [];
  for (const v of h) out.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
  return out;
}

/** Pasa bytes a texto hexadecimal */
export function toHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 de un texto, en hexadecimal */
export function sha256(texto: string): string {
  return toHex(sha256Bytes(utf8Bytes(texto)));
}

/** HMAC-SHA256 (firma con clave). Devuelve bytes. */
export function hmacSha256(clave: string, mensaje: string): number[] {
  let k = utf8Bytes(clave);
  if (k.length > 64) k = sha256Bytes(k);
  while (k.length < 64) k.push(0);
  const ipad = k.map((b) => b ^ 0x36);
  const opad = k.map((b) => b ^ 0x5c);
  return sha256Bytes([...opad, ...sha256Bytes([...ipad, ...utf8Bytes(mensaje)])]);
}
