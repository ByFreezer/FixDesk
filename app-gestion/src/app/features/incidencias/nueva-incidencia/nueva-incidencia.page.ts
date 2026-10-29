import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonItem,

  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  IonSpinner,

  IonNote,
  ToastController,
} from '@ionic/angular';
import { Observable, map, of } from 'rxjs';
import { catchError, debounceTime, switchMap, first } from 'rxjs/operators';
import { IncidenciasService } from '../../../core/services/incidencias.service';

@Component({
  selector: 'app-nueva-incidencia',
  templateUrl: './nueva-incidencia.page.html',
  styleUrls: ['./nueva-incidencia.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonNote,
  ],
})
export class NuevaIncidenciaPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private incidenciasService = inject(IncidenciasService);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  isSubmitting = false;

  form: FormGroup = this.fb.group({
    codigo: [
      '',
      [Validators.required, Validators.pattern(/^INC-\d{4}$/)],
      [this.codigoUnicoValidator()],
    ],
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    categoria: ['', [Validators.required]],
    prioridad: ['', [Validators.required]],
    estado: ['Abierta', [Validators.required]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    usuario: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    // El validador asíncrono termina fuera de un evento: avisamos a Angular
    this.form.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
  }

  categorias = ['Hardware', 'Software', 'Red', 'Seguridad'];
  prioridades = ['Baja', 'Media', 'Alta', 'Crítica'];
  estados = ['Abierta', 'En Proceso', 'Cerrada'];

  /**
   * Validador asíncrono que verifica unicidad del código de incidencia
   */
  private codigoUnicoValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.errors?.['required'] || control.errors?.['pattern']) {
        return of(null);
      }
      return of(control.value).pipe(
        debounceTime(400),
        switchMap((codigo: string) =>
          this.incidenciasService.verificarCodigoUnico(codigo).pipe(
            map((disponible: boolean) => (disponible ? null : { codigoExiste: true })),
            catchError(() => of(null))
          )
        ),
        first()
      );
    };
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.incidenciasService.create(this.form.value).subscribe({
      next: async () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        const toast = await this.toastCtrl.create({
          message: 'Incidencia creada correctamente.',
          duration: 2500,
          color: 'success',
          position: 'top',
        });
        await toast.present();
        this.router.navigate(['/incidencias']);
      },
      error: async () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        const toast = await this.toastCtrl.create({
          message: 'Error al crear la incidencia.',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }
}
