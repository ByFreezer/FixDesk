import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HasPermisoDirective } from './has-permiso.directive';
import { AuthStore } from '../../core/state/auth.store';
import { UserRole } from '../../core/models/user.model';

@Component({
  imports: [HasPermisoDirective],
  template: `<button *appHasPermiso="'incidencias:borrar'">Eliminar</button>`,
})
class HostComponent {}

describe('HasPermisoDirective', () => {
  const entrarComo = (rol: UserRole) =>
    TestBed.inject(AuthStore).dispatch({
      type: '[Auth] Login Success',
      user: { id: '1', email: 'a@b.com', nombre: 'A', rol },
      token: 't',
    });

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('no pinta el elemento sin sesión', () => {
    expect(render().nativeElement.querySelector('button')).toBeNull();
  });

  it('no pinta el elemento si el rol no tiene el permiso', () => {
    entrarComo('tecnico');
    expect(render().nativeElement.querySelector('button')).toBeNull();
  });

  it('pinta el elemento si el rol tiene el permiso', () => {
    entrarComo('admin');
    expect(render().nativeElement.querySelector('button')).not.toBeNull();
  });

  it('reacciona al cerrar sesión', () => {
    entrarComo('admin');
    const fixture = render();
    TestBed.inject(AuthStore).dispatch({ type: '[Auth] Logout' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
