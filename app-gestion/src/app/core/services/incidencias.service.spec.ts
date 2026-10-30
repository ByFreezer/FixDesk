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

  describe('fotos (Supabase Storage)', () => {
    const datos = {
      codigo: 'INC-2001', titulo: 'Pantalla rota', categoria: 'Hardware' as const, prioridad: 'Media' as const,
      estado: 'Abierta' as const, descripcion: 'La pantalla del portátil tiene una grieta.', usuario: 'a@b.com',
    };
    const foto = new File(['x'], 'foto.png', { type: 'image/png' });

    it('sube la foto al bucket y guarda su URL pública en la incidencia', () => {
      let creada: Incidencia | undefined;
      service.create(datos, foto).subscribe((r) => (creada = r));

      const subida = http.expectOne((req) => req.url.includes('/storage/v1/object/incidencias/INC-2001/'));
      expect(subida.request.method).toBe('POST');
      expect(subida.request.headers.get('Content-Type')).toBe('image/png');
      expect(subida.request.body).toBe(foto);
      subida.flush({ Key: 'incidencias/INC-2001/1.png' });

      const insercion = http.expectOne((req) => req.url.endsWith('/rest/v1/incidencias'));
      expect(insercion.request.body.imagen_url).toMatch(/\/storage\/v1\/object\/public\/incidencias\/INC-2001\/\d+\.png$/);
      insercion.flush([{ id: 99 }]);

      expect(creada?.imagenUrl).toBe(insercion.request.body.imagen_url);
    });

    it('si la subida falla, crea la incidencia igualmente sin foto', () => {
      let creada: Incidencia | undefined;
      service.create(datos, foto).subscribe((r) => (creada = r));

      http
        .expectOne((req) => req.url.includes('/storage/v1/object/'))
        .flush({ error: 'Bucket not found' }, { status: 400, statusText: 'Bad Request' });
      const insercion = http.expectOne((req) => req.url.endsWith('/rest/v1/incidencias'));
      expect(insercion.request.body.imagen_url).toBeUndefined();
      insercion.flush([{ id: 100 }]);

      expect(creada?.codigo).toBe('INC-2001');
      expect(creada?.imagenUrl).toBeUndefined();
    });

    it('lee la URL de la foto al cargar las incidencias', () => {
      let resultado: Incidencia[] = [];
      service.getAll().subscribe((r) => (resultado = r));
      http.expectOne((req) => req.url.includes('/rest/v1/incidencias')).flush([
        { id: 1, titulo: 'Con foto', categoria: 'Red', estado: 'Abierta', fecha: '2026-10-30', imagen_url: 'https://x/foto.png' },
      ]);
      expect(resultado[0].imagenUrl).toBe('https://x/foto.png');
    });
  });
});
