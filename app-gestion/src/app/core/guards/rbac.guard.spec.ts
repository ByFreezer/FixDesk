import { TestBed } from '@angular/core/testing';
import { CanMatchFn, Route, UrlSegment, UrlTree, provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { rbacGuard } from './rbac.guard';
import { AuthService } from '../services/auth.service';

describe('rbacGuard (canMatch)', () => {
  const rutaDashboard = { path: 'dashboard', data: { permiso: 'dashboard:ver' } } as Route;
  const ejecutar = () =>
    TestBed.runInInjectionContext(() => rbacGuard(rutaDashboard, [new UrlSegment('dashboard', {})], {} as Parameters<CanMatchFn>[2])) as Promise<
      boolean | UrlTree
    >;
  const entrar = (email: string, password: string) =>
    firstValueFrom(TestBed.inject(AuthService).login(email, password));

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ToastController, useValue: { create: async () => ({ present: async () => undefined }) } },
      ],
    });
  });

  it('sin sesión manda al login guardando la URL pedida', async () => {
    const res = (await ejecutar()) as UrlTree;
    expect(res.toString()).toBe('/login?returnUrl=%2Fdashboard');
  });

  it('el rol usuario no tiene dashboard:ver y vuelve a incidencias', async () => {
    await entrar('usuario@empresa.com', 'FixDesk#User26');
    expect(((await ejecutar()) as UrlTree).toString()).toBe('/incidencias');
  });

  it('el rol técnico sí puede entrar al dashboard', async () => {
    await entrar('tecnico@empresa.com', 'FixDesk#Tec26');
    expect(await ejecutar()).toBe(true);
  });

  it('el rol administrador puede entrar al dashboard', async () => {
    await entrar('admin@empresa.com', 'FixDesk#Admin26');
    expect(await ejecutar()).toBe(true);
  });
});
