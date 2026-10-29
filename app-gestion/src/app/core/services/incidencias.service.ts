import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CategoriaIncidencia, EstadoIncidencia, Incidencia, PrioridadIncidencia } from '../models/incidencia.model';

/** Fila tal y como viene de la tabla "incidencias" de Supabase */
interface FilaIncidencia {
  id: number | string;
  codigo?: string | null;
  titulo: string;
  categoria: string;
  prioridad?: string | null;
  estado: string;
  descripcion?: string | null;
  usuario?: string | null;
  fecha: string;
}

/**
 * Servicio de incidencias (fuente SQL).
 * Consume la API REST de Supabase (PostgreSQL) con HttpClient; las cabeceras
 * las añade el interceptor. Si Supabase falla o la tabla está vacía usa datos
 * sintéticos de respaldo, así la app nunca se queda en blanco.
 */
@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  /** Copia local de los datos (caché + datos de respaldo) */
  private incidencias: Incidencia[] = [
    {
      id: 'INC-1001',
      codigo: 'INC-1001',
      titulo: 'Fallo en servidor de base de datos PostgreSQL',
      categoria: 'Software',
      prioridad: 'Crítica',
      estado: 'Abierta',
      descripcion: 'El pool de conexiones supera el umbral máximo del 95% generando timeouts en peticiones REST.',
      usuario: 'admin@empresa.com',
      fecha: '2026-10-25',
    },
    {
      id: 'INC-1002',
      codigo: 'INC-1002',
      titulo: 'Sustitución de switch capa 3 en rack principal',
      categoria: 'Hardware',
      prioridad: 'Alta',
      estado: 'En Proceso',
      descripcion: 'Pérdida de paquetes en la VLAN 20 de desarrollo tras fluctuación eléctrica.',
      usuario: 'soporte@empresa.com',
      fecha: '2026-10-26',
    },
    {
      id: 'INC-1003',
      codigo: 'INC-1003',
      titulo: 'Actualización certificados TLS / SSL',
      categoria: 'Seguridad',
      prioridad: 'Media',
      estado: 'Cerrada',
      descripcion: 'Renovación automatizada de certificados wildcard en proxy reverso NGINX.',
      usuario: 'admin@empresa.com',
      fecha: '2026-10-24',
    },
    {
      id: 'INC-1004',
      codigo: 'INC-1004',
      titulo: 'Latencia elevada en enlace fibra WAN Madrid-Barcelona',
      categoria: 'Red',
      prioridad: 'Alta',
      estado: 'Abierta',
      descripcion: 'Jitter superior a 120ms detectado por monitorización Zabbix.',
      usuario: 'redes@empresa.com',
      fecha: '2026-10-27',
    },
    {
      id: 'INC-1005',
      codigo: 'INC-1005',
      titulo: 'Instalación entorno desarrollo Angular / Ionic',
      categoria: 'Software',
      prioridad: 'Baja',
      estado: 'Cerrada',
      descripcion: 'Despliegue de imagen Docker estándar para nuevos desarrolladores.',
      usuario: 'usuario@empresa.com',
      fecha: '2026-10-22',
    },
    {
      id: 'INC-1006',
      codigo: 'INC-1006',
      titulo: 'Avería fuente de alimentación SAI sala de servidores',
      categoria: 'Hardware',
      prioridad: 'Crítica',
      estado: 'En Proceso',
      descripcion: 'Batería modular 2 emite señal de alarma por degradación de celdas.',
      usuario: 'mantenimiento@empresa.com',
      fecha: '2026-10-28',
    },
  ];

  private http = inject(HttpClient);
  private readonly url = `${environment.supabaseUrl}/rest/v1/incidencias`;

  /**
   * Obtiene todas las incidencias de forma asíncrona.
   * @returns Observable con la lista de incidencias
   */
  getAll(): Observable<Incidencia[]> {
    return this.http.get<FilaIncidencia[]>(`${this.url}?select=*&order=fecha.desc`).pipe(
      map((filas) => (filas.length ? filas.map((f) => this.aIncidencia(f)) : [...this.incidencias])),
      tap((lista) => (this.incidencias = [...lista])),
      catchError(() => of([...this.incidencias]).pipe(delay(200)))
    );
  }

  /**
   * Validación asíncrona: comprueba si el código ya existe.
   * @param codigo Código con formato INC-0000
   * @returns true si el código está libre, false si ya existe
   */
  verificarCodigoUnico(codigo: string): Observable<boolean> {
    const limpio = (codigo || '').trim().toUpperCase();
    const existeLocal = this.incidencias.some((i) => i.codigo.toUpperCase() === limpio);
    return this.http.get<unknown[]>(`${this.url}?select=codigo&codigo=eq.${encodeURIComponent(limpio)}`).pipe(
      map((filas) => !existeLocal && filas.length === 0),
      catchError(() => of(!existeLocal).pipe(delay(300)))
    );
  }

  /**
   * Crea una nueva incidencia.
   * Si la tabla todavía no tiene todas las columnas, se guardan solo las básicas.
   * @param nueva Datos del formulario
   */
  create(nueva: Omit<Incidencia, 'id' | 'fecha'> & { fecha?: string }): Observable<Incidencia> {
    const codigo = (nueva.codigo || `INC-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    const registro: Incidencia = { ...nueva, id: codigo, codigo, fecha: nueva.fecha || new Date().toISOString().split('T')[0] };
    this.incidencias = [registro, ...this.incidencias];

    const completa = {
      codigo, titulo: registro.titulo, categoria: registro.categoria, prioridad: registro.prioridad,
      estado: registro.estado, descripcion: registro.descripcion, usuario: registro.usuario, fecha: registro.fecha,
    };
    const basica = { titulo: registro.titulo, categoria: registro.categoria, estado: registro.estado, fecha: registro.fecha };
    const cabeceras = { Prefer: 'return=representation' };

    return this.http.post<FilaIncidencia[]>(this.url, completa, { headers: cabeceras }).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 400 ? this.http.post<FilaIncidencia[]>(this.url, basica, { headers: cabeceras }) : throwError(() => err)
      ),
      map((filas) => {
        const guardada = filas?.[0] ? { ...registro, id: filas[0].id } : registro;
        this.incidencias = this.incidencias.map((i) => (i === registro ? guardada : i));
        return guardada;
      }),
      catchError(() => of(registro))
    );
  }

  /**
   * Elimina una incidencia por su id.
   * @param id Identificador de la incidencia
   */
  delete(id: string | number): Observable<boolean> {
    this.incidencias = this.incidencias.filter((i) => i.id !== id);
    return this.http.delete(`${this.url}?id=eq.${encodeURIComponent(String(id))}`).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  /** Convierte una fila de la base de datos al modelo de la app */
  private aIncidencia(f: FilaIncidencia): Incidencia {
    return {
      id: f.id,
      codigo: f.codigo || `INC-${String(f.id).padStart(4, '0')}`,
      titulo: f.titulo,
      categoria: f.categoria as CategoriaIncidencia,
      prioridad: (f.prioridad || 'Media') as PrioridadIncidencia,
      estado: f.estado as EstadoIncidencia,
      descripcion: f.descripcion || '',
      usuario: f.usuario || '',
      fecha: f.fecha,
    };
  }
}
