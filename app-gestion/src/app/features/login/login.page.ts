import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonCard, IonCardHeader, IonCardContent, IonItem, IonInput, IonButton,
  IonText, IonSpinner, IonNote, ViewWillEnter,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

/**
 * Página de inicio de sesión.
 * Formulario reactivo con validaciones y redirección según el rol.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, IonContent, IonCard, IonCardHeader, IonCardContent, IonItem,
    IonInput, IonButton, IonText, IonSpinner, IonNote,
  ],
})
export class LoginPage implements ViewWillEnter {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isLoading = false;
  errorMessage = '';

  /** Si ya hay sesión iniciada no tiene sentido ver el login */
  ionViewWillEnter(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.irSegunRol(user.rol);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.loginForm.reset();
        this.cdr.markForCheck();
        this.irSegunRol(user.rol);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error al iniciar sesión';
        this.cdr.markForCheck();
      },
    });
  }

  private irSegunRol(rol: string): void {
    this.router.navigate([rol === 'admin' ? '/dashboard' : '/incidencias'], { replaceUrl: true });
  }
}
