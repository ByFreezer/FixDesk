import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote,
  IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonButton, IonBadge,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  listOutline, listSharp, addCircleOutline, addCircleSharp, statsChartOutline, statsChartSharp,
  helpCircleOutline, helpCircleSharp, logOutOutline, alertCircle, folderOpen, checkmarkCircle,
  timeOutline, add, downloadOutline, documentTextOutline, trashOutline, searchOutline,
} from 'ionicons/icons';
import { AuthService } from './core/services/auth.service';
import { AuthStore } from './core/state/auth.store';
import { NOMBRE_ROL, Permiso } from './core/models/user.model';

interface MenuPage {
  title: string;
  url: string;
  icon: string;
  /** Permiso necesario para ver la opción (sin él, la opción no aparece) */
  permiso: Permiso;
}

/**
 * Componente raíz: menú lateral (Side Menu) que cambia según el rol.
 * El menú es una signal computada a partir de los permisos del AuthStore.
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    RouterLink, RouterLinkActive, IonApp, IonSplitPane, IonMenu, IonContent, IonList,
    IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet,
    IonButton, IonBadge,
  ],
})
export class AppComponent {
  private auth = inject(AuthService);
  private store = inject(AuthStore);
  private router = inject(Router);

  /** Usuario logueado (null si no hay sesión) */
  readonly user = this.store.user;
  readonly nombreRol = NOMBRE_ROL;

  private readonly todasLasPaginas: MenuPage[] = [
    { title: 'Incidencias', url: '/incidencias', icon: 'list', permiso: 'incidencias:ver' },
    { title: 'Nueva incidencia', url: '/incidencias/nueva', icon: 'add-circle', permiso: 'incidencias:crear' },
    { title: 'Dashboard', url: '/dashboard', icon: 'stats-chart', permiso: 'dashboard:ver' },
    { title: 'Ayuda', url: '/ayuda', icon: 'help-circle', permiso: 'incidencias:ver' },
  ];

  /** Páginas visibles según los permisos del rol (se recalcula sola al cambiar la sesión) */
  readonly paginas = computed(() =>
    this.todasLasPaginas.filter((p) => this.store.permisos().includes(p.permiso))
  );

  constructor() {
    addIcons({
      listOutline, listSharp, addCircleOutline, addCircleSharp, statsChartOutline, statsChartSharp,
      helpCircleOutline, helpCircleSharp, logOutOutline, 'alert-circle': alertCircle,
      'folder-open': folderOpen, 'checkmark-circle': checkmarkCircle, 'time-outline': timeOutline,
      add, downloadOutline, documentTextOutline, trashOutline, searchOutline,
    });
  }

  /** Cierra la sesión y vuelve al login */
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
