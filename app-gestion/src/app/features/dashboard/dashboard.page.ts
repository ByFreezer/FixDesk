import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonText, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonButton, IonIcon,
} from '@ionic/angular';
import { Subscription, forkJoin, take, catchError, of } from 'rxjs';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { ComentariosService } from '../../core/services/comentarios.service';
import { ExportService } from '../../core/services/export.service';
import { StatWidgetComponent } from '../../shared/components/stat-widget/stat-widget.component';
import { Incidencia } from '../../core/models/incidencia.model';
import { Comentario } from '../../core/models/comentario.model';

/**
 * Cuadro de mando (solo rol Administrador).
 * Carga en paralelo SQL (Supabase) y NoSQL (comentarios) con forkJoin.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonText, IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonButton, IonIcon,
    BaseChartDirective, StatWidgetComponent,
  ],
})
export class DashboardPage implements OnInit, OnDestroy {
  private incSrv = inject(IncidenciasService);
  private comSrv = inject(ComentariosService);
  private exportSrv = inject(ExportService);
  private sub?: Subscription;

  loading = true;
  error = '';
  incidencias: Incidencia[] = [];
  comentarios: Comentario[] = [];
  incidenciasFiltradas: Incidencia[] = [];

  categorias = ['Hardware', 'Software', 'Red', 'Seguridad'];
  filtro = '';
  abiertas = 0;
  cerradas = 0;
  resumenEstado = '';
  resumenCategoria = '';

  porEstado: ChartData<'bar'> = { labels: [], datasets: [] };
  porCategoria: ChartData<'doughnut'> = { labels: [], datasets: [] };

  opcionesBarras: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  opcionesDonut: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  ngOnInit(): void {
    this.sub = forkJoin({
      inc: this.incSrv.getAll(),
      com: this.comSrv.getAll().pipe(take(1)),
    })
      .pipe(
        catchError(() => {
          this.error = 'No se pudieron cargar los datos';
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.incidencias = res.inc;
          this.comentarios = res.com;
          this.actualizar();
        }
        this.loading = false;
      });
  }

  /** Filtro en tiempo real por categoría */
  onFiltro(valor: string): void {
    this.filtro = valor === 'todas' ? '' : valor;
    this.actualizar();
  }

  exportCsv(): void {
    this.exportSrv.toCsv(this.incidenciasFiltradas);
  }

  exportPdf(): void {
    this.exportSrv.toPdf(this.incidenciasFiltradas);
  }

  private contar(lista: Incidencia[], campo: 'estado' | 'categoria'): Record<string, number> {
    const r: Record<string, number> = {};
    lista.forEach((i) => (r[i[campo]] = (r[i[campo]] || 0) + 1));
    return r;
  }

  private actualizar(): void {
    this.incidenciasFiltradas = this.filtro
      ? this.incidencias.filter((i) => i.categoria === this.filtro)
      : this.incidencias;
    this.abiertas = this.incidenciasFiltradas.filter((i) => i.estado === 'Abierta').length;
    this.cerradas = this.incidenciasFiltradas.filter((i) => i.estado === 'Cerrada').length;

    const est = this.contar(this.incidenciasFiltradas, 'estado');
    this.porEstado = {
      labels: Object.keys(est),
      datasets: [{ data: Object.values(est), label: 'Incidencias', backgroundColor: '#2d6da4' }],
    };
    const cat = this.contar(this.incidenciasFiltradas, 'categoria');
    this.porCategoria = {
      labels: Object.keys(cat),
      datasets: [{ data: Object.values(cat), backgroundColor: ['#1a3a5c', '#e67e22', '#27ae60', '#c0392b'] }],
    };

    // Texto alternativo para lectores de pantalla
    this.resumenEstado = Object.entries(est).map(([k, v]) => `${k} ${v}`).join(', ');
    this.resumenCategoria = Object.entries(cat).map(([k, v]) => `${k} ${v}`).join(', ');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
