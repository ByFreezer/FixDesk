import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Comentario } from '../models/comentario.model';

@Injectable({ providedIn: 'root' })
export class ComentariosService {
  // Simulación de almacén de documentos en tiempo real (NoSQL / Firestore mock)
  private mockComentarios: Comentario[] = [
    {
      id: 'com-1',
      incidenciaId: 'INC-1001',
      autor: 'Héctor Fernández',
      texto: 'Se ha reiniciado el servicio y se analiza el plan de ejecución de queries lentas.',
      fecha: '2026-10-25 10:30'
    },
    {
      id: 'com-2',
      incidenciaId: 'INC-1002',
      autor: 'Carlos Técnico',
      texto: 'Switch de repuesto solicitado a almacén central, llegada estimada en 2 horas.',
      fecha: '2026-10-26 12:15'
    },
    {
      id: 'com-3',
      incidenciaId: 'INC-1003',
      autor: 'Seguridad IT',
      texto: 'Verificación de handshake SSL superada con calificación A+ en SSL Labs.',
      fecha: '2026-10-24 16:45'
    },
    {
      id: 'com-4',
      incidenciaId: 'INC-1006',
      autor: 'Mantenimiento',
      texto: 'Técnico de fabricante desplazado a las instalaciones para cambio de batería.',
      fecha: '2026-10-28 09:10'
    }
  ];

  private comentariosSubject = new BehaviorSubject<Comentario[]>(this.mockComentarios);

  /**
   * Obtiene flujo observable de comentarios en tiempo real
   */
  getAll(): Observable<Comentario[]> {
    return this.comentariosSubject.asObservable().pipe(delay(250));
  }

  /**
   * Obtiene comentarios de una incidencia específica
   */
  getByIncidencia(incidenciaId: string | number): Observable<Comentario[]> {
    const filtrados = this.mockComentarios.filter(c => c.incidenciaId === incidenciaId);
    return of(filtrados).pipe(delay(200));
  }

  /**
   * Agrega un nuevo comentario documental
   */
  addComentario(incidenciaId: string | number, autor: string, texto: string): Observable<Comentario> {
    const nuevo: Comentario = {
      id: `com-${Date.now()}`,
      incidenciaId,
      autor,
      texto,
      fecha: new Date().toLocaleString()
    };
    this.mockComentarios.push(nuevo);
    this.comentariosSubject.next([...this.mockComentarios]);
    return of(nuevo).pipe(delay(150));
  }
}
