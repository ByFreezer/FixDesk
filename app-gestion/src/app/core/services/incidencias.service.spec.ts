import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IncidenciasService } from './incidencias.service';
import { Incidencia } from '../models/incidencia.model';

describe('IncidenciasService', () => {
  let service: IncidenciasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(IncidenciasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('convierte las filas de Supabase al modelo de la app', () => {
    let resultado: Incidencia[] = [];
    service.getAll().subscribe((r) => (resultado = r));
    http.expectOne((req) => req.url.includes('/rest/v1/incidencias')).flush([
      { id: 7, titulo: 'Prueba', categoria: 'Red', estado: 'Abierta', fecha: '2026-10-29' },
    ]);
    expect(resultado.length).toBe(1);
    expect(resultado[0].codigo).toBe('INC-0007');
    expect(resultado[0].prioridad).toBe('Media');
  });

  it('usa datos de respaldo si la tabla está vacía', () => {
    let resultado: Incidencia[] = [];
    service.getAll().subscribe((r) => (resultado = r));
    http.expectOne((req) => req.url.includes('/rest/v1/incidencias')).flush([]);
    expect(resultado.length).toBeGreaterThan(0);
  });

  it('el código INC-1001 de los datos de respaldo ya existe', () => {
    let libre: boolean | undefined;
    service.verificarCodigoUnico('INC-1001').subscribe((r) => (libre = r));
    http.expectOne((req) => req.url.includes('codigo=eq.')).flush([]);
    expect(libre).toBe(false);
  });
});
