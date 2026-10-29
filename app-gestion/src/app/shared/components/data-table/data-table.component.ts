import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonSearchbar, IonButton } from '@ionic/angular';

/** Definición de una columna de la tabla */
export interface Column {
  /** Nombre de la propiedad del objeto a mostrar */
  key: string;
  /** Texto de la cabecera */
  label: string;
}

/**
 * Tabla de datos reutilizable con buscador.
 * Es agnóstica: no sabe nada de incidencias, recibe cualquier lista por @Input
 * y avisa al padre con @Output cuando se selecciona o se borra una fila.
 *
 * @example
 * <app-data-table [data]="lista" [columns]="cols" (rowSelected)="ver($event)"></app-data-table>
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [FormsModule, IonSearchbar, IonButton],
  templateUrl: './data-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent {
  /** Filas a mostrar */
  @Input() data: any[] = [];
  /** Columnas visibles */
  @Input() columns: Column[] = [];
  /** Si es true muestra el botón Eliminar en cada fila */
  @Input() canDelete = false;

  /** Se emite al pulsar una fila */
  @Output() rowSelected = new EventEmitter<any>();
  /** Se emite al pulsar Eliminar */
  @Output() deleteClicked = new EventEmitter<any>();

  /** Texto del buscador (two-way binding con ngModel) */
  search = '';

  /** Filas que coinciden con el texto buscado */
  get filteredData(): any[] {
    const term = this.search.toLowerCase();
    return this.data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(term))
    );
  }
}
