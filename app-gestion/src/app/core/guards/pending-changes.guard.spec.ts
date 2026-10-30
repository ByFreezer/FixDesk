import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ConCambiosPendientes, pendingChangesGuard } from './pending-changes.guard';

describe('pendingChangesGuard (canDeactivate)', () => {
  let respuesta: 'confirm' | 'cancel';

  const ejecutar = (sucio: boolean) =>
    TestBed.runInInjectionContext(() =>
      pendingChangesGuard(
        { tieneCambiosSinGuardar: () => sucio } as ConCambiosPendientes,
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot
      )
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AlertController,
          useValue: {
            create: async () => ({ present: async () => undefined, onDidDismiss: async () => ({ role: respuesta }) }),
          },
        },
      ],
    });
  });

  it('deja salir si no hay cambios', async () => {
    expect(await ejecutar(false)).toBe(true);
  });

  it('con cambios, se queda si el usuario cancela', async () => {
    respuesta = 'cancel';
    expect(await ejecutar(true)).toBe(false);
  });

  it('con cambios, sale si el usuario confirma', async () => {
    respuesta = 'confirm';
    expect(await ejecutar(true)).toBe(true);
  });
});
