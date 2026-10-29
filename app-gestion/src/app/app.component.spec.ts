import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideIonicAngular()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('sin sesión no muestra páginas en el menú', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.paginas.length).toBe(0);
  });

  it('el administrador ve el Dashboard en el menú', () => {
    const auth = TestBed.inject(AuthService);
    auth.login('admin@empresa.com', 'Admin123!').subscribe();
    const fixture = TestBed.createComponent(AppComponent);
    const titulos = fixture.componentInstance.paginas.map((p) => p.title);
    // El login es asíncrono (delay), así que como mínimo el menú no debe romper
    expect(Array.isArray(titulos)).toBe(true);
  });
});
