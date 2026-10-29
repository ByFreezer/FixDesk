import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, of } from 'rxjs';
import { map, catchError, delay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Incidencia } from '../models/incidencia.model';

/**
 * Servicio de incidencias (fuente SQL).
 * Lee y escribe en la tabla "incidencias" de Supabase (PostgreSQL vía API REST).
 * Si Supabase falla o la tabla está vacía usa datos sintéticos de respaldo,
 * así la app nunca se queda en blanco.
 */
@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  private supabase: SupabaseClient | null = null;

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

  constructor() {
    try {
      if (environment.supabaseUrl && environment.supabaseKey) {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
      }
    } catch (e) {
      console.warn('No se pudo iniciar Supabase, se usan datos locales:', e);
    }
  }

  /**
   * Obtiene todas las incidencias de forma asíncrona.
   * @returns Observable con la lista de incidencias
   */
  getAll(): Observable<Incidencia[]> {
    if (!this.supabase) {
      return of([...this.incidencias]).pipe(delay(350));
    }
    return from(this.supabase.from('incidencias').select('*').order('fecha', { ascending: false })).pipe(
      map((res) => {
        if (res.error || !res.data || res.data.length === 0) {
          return [...this.incidencias];
        }
        return res.data as Incidencia[];
      }),
      tap((lista) => (this.incidencias = [...lista])),
      catchError(() => of([...this.incidencias]))
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

    if (!this.supabase) {
      return of(!existeLocal).pipe(delay(500));
    }
    return from(this.supabase.from('incidencias').select('codigo').eq('codigo', limpio)).pipe(
      map((res) => !existeLocal && !(res.data && res.data.length > 0)),
      catchError(() => of(!existeLocal))
    );
  }

  /**
   * Crea una nueva incidencia.
   * @param nueva Datos del formulario
   */
  create(nueva: Omit<Incidencia, 'id' | 'fecha'> & { fecha?: string }): Observable<Incidencia> {
    const codigo = (nueva.codigo || `INC-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    const registro: Incidencia = {
      ...nueva,
      id: codigo,
      codigo,
      fecha: nueva.fecha || new Date().toISOString().split('T')[0],
    };

    this.incidencias = [registro, ...this.incidencias];

    if (!this.supabase) {
      return of(registro).pipe(delay(300));
    }
    return from(this.supabase.from('incidencias').insert([registro])).pipe(
      map(() => registro),
      catchError(() => of(registro))
    );
  }

  /**
   * Elimina una incidencia por su id.
   * @param id Identificador de la incidencia
   */
  delete(id: string | number): Observable<boolean> {
    this.incidencias = this.incidencias.filter((i) => i.id !== id);

    if (!this.supabase) {
      return of(true).pipe(delay(200));
    }
    return from(this.supabase.from('incidencias').delete().eq('id', id)).pipe(
      map((res) => !res.error),
      catchError(() => of(true))
    );
  }
}
