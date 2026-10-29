import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IonCard, IonCardContent, IonIcon } from '@ionic/angular';

/**
 * Widget estadístico reutilizable: muestra un icono, un título y un valor.
 *
 * @example
 * <app-stat-widget title="Abiertas" [value]="5" icon="folder-open"></app-stat-widget>
 */
@Component({
  selector: 'app-stat-widget',
  standalone: true,
  imports: [IonCard, IonCardContent, IonIcon],
  templateUrl: './stat-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatWidgetComponent {
  /** Título del widget */
  @Input() title = '';
  /** Valor numérico o texto a mostrar */
  @Input() value: number | string = 0;
  /** Nombre del icono de Ionicons */
  @Input() icon = 'stats-chart';
}
