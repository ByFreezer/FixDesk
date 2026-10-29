import { sha256, hmacSha256, toHex } from './sha256';

describe('sha256', () => {
  it('calcula el hash SHA-256 de "abc"', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('calcula el hash de un texto vacío', () => {
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('calcula HMAC-SHA256 correctamente', () => {
    expect(toHex(hmacSha256('key', 'The quick brown fox jumps over the lazy dog'))).toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8'
    );
  });
});
