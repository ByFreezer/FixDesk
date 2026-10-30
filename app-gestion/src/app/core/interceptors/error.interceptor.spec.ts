import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { vi } from 'vitest';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const auth = { refreshAccessToken: vi.fn(), logout: vi.fn() };
  const toast = { create: vi.fn(async () => ({ present: async () => undefined })) };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ToastController, useValue: toast },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('ante un 401 renueva el token y repite la petición una vez', () => {
    auth.refreshAccessToken.mockReturnValue('token-nuevo');
    let respuesta: unknown;
    http.get('/api/incidencias').subscribe((r) => (respuesta = r));

    backend.expectOne('/api/incidencias').flush(null, { status: 401, statusText: 'Unauthorized' });
    const reintento = backend.expectOne('/api/incidencias');
    expect(reintento.request.headers.get('Authorization')).toBe('Bearer token-nuevo');
    reintento.flush({ ok: true });

    expect(respuesta).toEqual({ ok: true });
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('si no se puede renovar, cierra sesión y va al login con returnUrl', () => {
    auth.refreshAccessToken.mockReturnValue(null);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    let error: HttpErrorResponse | undefined;
    http.get('/api/incidencias').subscribe({ error: (e) => (error = e) });

    backend.expectOne('/api/incidencias').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(error?.status).toBe(401);
    expect(auth.logout).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
  });

  it('ante un 403 avisa pero NO cierra la sesión', () => {
    let error: HttpErrorResponse | undefined;
    http.delete('/api/incidencias/1').subscribe({ error: (e) => (error = e) });

    backend.expectOne('/api/incidencias/1').flush(null, { status: 403, statusText: 'Forbidden' });

    expect(error?.status).toBe(403);
    expect(toast.create).toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(auth.refreshAccessToken).not.toHaveBeenCalled();
  });
});
