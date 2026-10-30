import { Component, inject } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonAccordionGroup, IonAccordion, IonItem, IonLabel,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { Permiso } from '../../core/models/user.model';

/** Sección de la ayuda (manual de usuario) */
interface SeccionAyuda {
  id: string;
  titulo: string;
  pasos: string[];
  /** Si se indica, la sección solo se muestra a los roles con este permiso */
  permiso?: Permiso;
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
        'Si intentas abrir una página sin haber iniciado sesión, después de entrar vuelves a esa página.',
        'Para salir, abre el menú lateral y pulsa "Cerrar sesión".',
      ],
    },
    {
      id: 'roles',
      titulo: 'Roles y permisos',
      pasos: [
        'Usuario: consulta y crea incidencias.',
        'Técnico: además entra al Dashboard y exporta informes.',
        'Administrador: además puede eliminar incidencias.',
        'El menú y los botones solo muestran lo que tu rol puede usar. Tu rol aparece bajo tu nombre en el menú.',
      ],
    },
    {
      id: 'listado',
      titulo: 'Consultar incidencias',
      pasos: [
        'En "Incidencias" verás una tabla con todas las incidencias.',
        'Usa el buscador para filtrar por cualquier campo (título, estado, categoría...).',
        'Pulsa (o selecciona con Tab + Enter) una fila para ver su detalle debajo de la tabla. Si tiene foto, aparece al final del detalle.',
      ],
    },
    {
      id: 'nueva',
      titulo: 'Crear una incidencia',
      pasos: [
        'Pulsa el botón redondo "+" o la opción "Nueva incidencia" del menú.',
        'El código debe tener el formato INC-0000 y no puede estar repetido (se comprueba automáticamente).',
        'Si quieres, pulsa "Adjuntar foto" para añadir una imagen (JPG, PNG o WEBP, máximo 2 MB). En el móvil se abre la cámara.',
        'Rellena todos los campos y pulsa "Guardar incidencia". Si sales antes de guardar, la app te pide confirmación.',
      ],
    },
    {
      id: 'exportar',
      titulo: 'Exportar informes (técnico y administrador)',
      permiso: 'incidencias:exportar',
      pasos: [
        'En "Incidencias" o en el "Dashboard" pulsa "Exportar CSV" o "Exportar PDF".',
        'El archivo se descarga con los datos que se están mostrando.',
      ],
    },
    {
      id: 'dashboard',
      titulo: 'Dashboard (técnico y administrador)',
      permiso: 'dashboard:ver',
      pasos: [
        'Muestra el total de incidencias, las abiertas y las cerradas.',
        'Los gráficos enseñan las incidencias por estado y por categoría.',
        'Con el filtro de categoría los datos y gráficos se actualizan al momento.',
      ],
    },
    {
      id: 'eliminar',
      titulo: 'Eliminar incidencias (solo administrador)',
      permiso: 'incidencias:borrar',
      pasos: [
        'En la tabla de "Incidencias", pulsa "Eliminar" en la fila que quieras borrar.',
        'Confirma en el aviso. Esta acción no se puede deshacer.',
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

  /** Secciones visibles según los permisos del rol */
  get secciones(): SeccionAyuda[] {
    return this.todas.filter((s) => !s.permiso || this.auth.can(s.permiso));
  }
}
