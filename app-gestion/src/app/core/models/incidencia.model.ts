export type EstadoIncidencia = 'Abierta' | 'En Proceso' | 'Cerrada';
export type CategoriaIncidencia = 'Hardware' | 'Software' | 'Red' | 'Seguridad';
export type PrioridadIncidencia = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export interface Incidencia {
  id: string | number;
  codigo: string;
  titulo: string;
  categoria: CategoriaIncidencia;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  descripcion: string;
  usuario: string;
  fecha: string;
  /** URL pública de la foto adjunta (Supabase Storage), si la hay */
  imagenUrl?: string;
}
