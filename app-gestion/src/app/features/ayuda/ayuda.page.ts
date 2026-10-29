import { Component, inject } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonAccordionGroup, IonAccordion, IonItem, IonLabel,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

/** Sección de la ayuda (manual de usuario) */
interface SeccionAyuda {
  id: string;
  titulo: string;
  pasos: string[];
  soloAdmin?: boolean;
}

/**
 * Página de Ayuda: manual de usuario integrado en la app (RA 6).
 */
@Component({
  selector: 'app-ayuda',
  templateUrl: './ayuda.page.html',
  styleUrls: ['./ayuda.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonAccordionGroup, IonAccordion, IonItem, IonLabel,
  ],
})
export class AyudaPage {
  private auth = inject(AuthService);

  private readonly todas: SeccionAyuda[] = [
    {
      id: 'login',
      titulo: 'Iniciar y cerrar sesión',
      pasos: [
        'Escribe tu correo y contraseña y pulsa "Iniciar sesión".',
        'También puedes usar los botones de acceso rápido (Admin o Usuario).',
        'Para salir, abre el menú lateral y pulsa "Cerrar sesión".',
      ],
    },
    {
      id: 'listado',
      titulo: 'Consultar incidencias',
      pasos: [
        'En "Incidencias" verás una tabla con todas las incidencias.',
        'Usa el buscador para filtrar por cualquier campo (título, estado, categoría...).',
        'Pulsa (o selecciona con Tab + Enter) una fila para ver su detalle debajo de la tabla.',
      ],
    },
    {
      id: 'nueva',
      titulo: 'Crear una incidencia',
      pasos: [
        'Pulsa el botón redondo "+" o la opción "Nueva incidencia" del menú.',
        'El código debe tener el formato INC-0000 y no puede estar repetido (se comprueba automáticamente).',
        'Rellena todos los campos y pulsa "Guardar incidencia".',
      ],
    },
    {
      id: 'exportar',
      titulo: 'Exportar informes',
      pasos: [
        'En "Incidencias" o en el "Dashboard" pulsa "Exportar CSV" o "Exportar PDF".',
        'El archivo se descarga con los datos que se están mostrando.',
      ],
    },
    {
      id: 'dashboard',
      titulo: 'Dashboard (solo administrador)',
      soloAdmin: true,
      pasos: [
        'Muestra el total de incidencias, las abiertas y las cerradas.',
        'Los gráficos enseñan las incidencias por estado y por categoría.',
        'Con el filtro de categoría los datos y gráficos se actualizan al momento.',
      ],
    },
    {
      id: 'teclado',
      titulo: 'Accesibilidad y teclado',
      pasos: [
        'Puedes moverte por toda la app con Tab y Shift + Tab.',
        'Usa Enter para pulsar botones y seleccionar filas de la tabla.',
        'El primer Tab muestra el enlace "Saltar al contenido".',
      ],
    },
  ];

  /** Secciones visibles según el rol */
  get secciones(): SeccionAyuda[] {
    return this.todas.filter((s) => !s.soloAdmin || this.auth.isAdmin());
  }
}
