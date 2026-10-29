import { Component, OnDestroy, inject } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/user.model';

interface MenuPage {
  title: string;
  url: string;
  icon: string;
  soloAdmin: boolean;
}

/**
 * Componente raíz: menú lateral (Side Menu) que cambia según el rol.
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
export class AppComponent implements OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private sub: Subscription;

  /** Usuario logueado (null si no hay sesión) */
  user: User | null = null;

  private readonly todasLasPaginas: MenuPage[] = [
    { title: 'Incidencias', url: '/incidencias', icon: 'list', soloAdmin: false },
    { title: 'Nueva incidencia', url: '/incidencias/nueva', icon: 'add-circle', soloAdmin: false },
    { title: 'Dashboard', url: '/dashboard', icon: 'stats-chart', soloAdmin: true },
    { title: 'Ayuda', url: '/ayuda', icon: 'help-circle', soloAdmin: false },
  ];

  /** Páginas visibles según el rol del usuario */
  paginas: MenuPage[] = [];

  constructor() {
    addIcons({
      listOutline, listSharp, addCircleOutline, addCircleSharp, statsChartOutline, statsChartSharp,
      helpCircleOutline, helpCircleSharp, logOutOutline, 'alert-circle': alertCircle,
      'folder-open': folderOpen, 'checkmark-circle': checkmarkCircle, 'time-outline': timeOutline,
      add, downloadOutline, documentTextOutline, trashOutline, searchOutline,
    });

    this.sub = this.auth.currentUser$.subscribe((u) => {
      this.user = u;
      this.paginas = this.todasLasPaginas.filter((p) => !p.soloAdmin || u?.rol === 'admin');
    });
  }

  /** Cierra la sesión y vuelve al login */
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
