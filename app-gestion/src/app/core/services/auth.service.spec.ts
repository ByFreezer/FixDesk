import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStore } from '../state/auth.store';

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

  it('el técnico tiene permisos intermedios (RBAC)', async () => {
    await firstValueFrom(service.login('tecnico@empresa.com', 'FixDesk#Tec26'));
    expect(service.hasRole('tecnico', 'admin')).toBe(true);
    expect(service.can('dashboard:ver')).toBe(true);
    expect(service.can('incidencias:exportar')).toBe(true);
    expect(service.can('incidencias:borrar')).toBe(false);
  });

  it('el usuario estándar no puede ver el dashboard ni borrar', async () => {
    await firstValueFrom(service.login('usuario@empresa.com', 'FixDesk#User26'));
    expect(service.can('incidencias:crear')).toBe(true);
    expect(service.can('dashboard:ver')).toBe(false);
    expect(service.can('incidencias:borrar')).toBe(false);
  });

  it('renueva el token de acceso con el de refresco si ha caducado', async () => {
    await firstValueFrom(service.login('usuario@empresa.com', 'FixDesk#User26'));
    const store = TestBed.inject(AuthStore);
    store.dispatch({ type: '[Auth] Token Refreshed', token: 'caducado.o.invalido' });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.token).not.toBe('caducado.o.invalido');
  });

  it('cierra la sesión si tampoco hay token de refresco válido', async () => {
    await firstValueFrom(service.login('usuario@empresa.com', 'FixDesk#User26'));
    sessionStorage.removeItem('fixdesk_refresh');
    TestBed.inject(AuthStore).dispatch({ type: '[Auth] Token Refreshed', token: 'caducado.o.invalido' });

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUserValue).toBeNull();
  });

  it('no acepta un token de refresco como token de acceso', async () => {
    await firstValueFrom(service.login('usuario@empresa.com', 'FixDesk#User26'));
    const refresh = sessionStorage.getItem('fixdesk_refresh')!;
    sessionStorage.setItem('fixdesk_token', refresh);
    sessionStorage.removeItem('fixdesk_refresh');
    service.restoreSession();
    expect(service.isAuthenticated()).toBe(false);
  });
});
