import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  const ejecutar = () =>
    TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('redirige al login si no hay sesión', () => {
    expect(ejecutar()).toBeInstanceOf(UrlTree);
  });

  it('deja pasar si hay sesión', async () => {
    await firstValueFrom(TestBed.inject(AuthService).login('usuario@empresa.com', 'FixDesk#User26'));
    expect(ejecutar()).toBe(true);
  });
});
