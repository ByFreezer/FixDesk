import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('inicia sesión como administrador con la contraseña correcta', async () => {
    const user = await firstValueFrom(service.login('admin@empresa.com', 'FixDesk#Admin26'));
    expect(user.rol).toBe('admin');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    await expect(firstValueFrom(service.login('admin@empresa.com', 'otra'))).rejects.toThrow();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('el usuario estándar no tiene rol de administrador', async () => {
    await firstValueFrom(service.login('usuario@empresa.com', 'FixDesk#User26'));
    expect(service.hasRole('usuario')).toBe(true);
    expect(service.isAdmin()).toBe(false);
  });

  it('descarta un token manipulado al recargar', () => {
    sessionStorage.setItem('fixdesk_token', 'a.b.c');
    service.restoreSession();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('cierra la sesión', async () => {
    await firstValueFrom(service.login('admin@empresa.com', 'FixDesk#Admin26'));
    service.logout();
    expect(service.currentUserValue).toBeNull();
  });
});
