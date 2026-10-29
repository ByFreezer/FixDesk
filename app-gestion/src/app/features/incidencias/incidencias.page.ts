import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonFab,
  IonFabButton, IonIcon, IonSpinner, IonText, IonGrid, IonRow, IonCol, IonButton,
  AlertController, ToastController, ViewDidEnter,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { StatWidgetComponent } from '../../shared/components/stat-widget/stat-widget.component';
import { Column, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { ExportService } from '../../core/services/export.service';
import { AuthService } from '../../core/services/auth.service';
import { Incidencia } from '../../core/models/incidencia.model';

/**
 * Página de listado de incidencias (Vista).
 * Usa los componentes reutilizables DataTable y StatWidget.
 */
@Component({
  selector: 'app-incidencias',
  templateUrl: './incidencias.page.html',
  styleUrls: ['./incidencias.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonFab,
    IonFabButton, IonIcon, IonSpinner, IonText, IonGrid, IonRow, IonCol, IonButton,
    StatWidgetComponent, DataTableComponent,
  ],
})
export class IncidenciasPage implements ViewDidEnter, OnDestroy {
  private incSrv = inject(IncidenciasService);
  private exportSrv = inject(ExportService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;

  columns: Column[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'titulo', label: 'Título' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'prioridad', label: 'Prioridad' },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha', label: 'Fecha' },
  ];

  incidencias: Incidencia[] = [];
  seleccionada: Incidencia | null = null;
  loading = true;
  error = '';

  /** Solo el administrador puede borrar */
  get esAdmin(): boolean {
    return this.auth.isAdmin();
  }

  get abiertas(): number {
    return this.incidencias.filter((i) => i.estado === 'Abierta').length;
  }

  get enProceso(): number {
    return this.incidencias.filter((i) => i.estado === 'En Proceso').length;
  }

  /** Se recarga cada vez que se entra en la vista (por ejemplo al volver de "nueva") */
  ionViewDidEnter(): void {
    this.cargar();
  }

  /** Carga las incidencias desde el servicio (asíncrono) */
  cargar(): void {
    this.loading = true;
    this.error = '';
    this.sub?.unsubscribe();
    this.sub = this.incSrv.getAll().subscribe({
      next: (data) => {
        this.incidencias = [...data];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudieron cargar las incidencias.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  /** Evento (Output) rowSelected del DataTable */
  onSelect(row: Incidencia): void {
    this.seleccionada = row;
  }

  /** Evento (Output) deleteClicked del DataTable */
  async onDelete(row: Incidencia): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar incidencia',
      message: `¿Seguro que quieres eliminar ${row.codigo}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.incSrv.delete(row.id).subscribe(async () => {
              this.incidencias = this.incidencias.filter((i) => i.id !== row.id);
              if (this.seleccionada?.id === row.id) this.seleccionada = null;
              this.cdr.markForCheck();
              const toast = await this.toastCtrl.create({
                message: 'Incidencia eliminada',
                duration: 2000,
                color: 'success',
              });
              await toast.present();
            });
          },
        },
      ],
    });
    await alert.present();
  }

  nueva(): void {
    this.router.navigate(['/incidencias/nueva']);
  }

  exportCsv(): void {
    this.exportSrv.toCsv(this.incidencias);
  }

  exportPdf(): void {
    this.exportSrv.toPdf(this.incidencias);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
