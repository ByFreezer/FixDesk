import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonCard, IonCardHeader, IonCardContent, IonItem, IonInput, IonButton,
  IonText, IonSpinner, IonNote, ViewWillEnter,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

/**
 * Página de inicio de sesión.
 * Formulario reactivo con validaciones. Tras entrar vuelve a la URL que se pidió
 * antes del login (?returnUrl) o, si no hay, a la pantalla inicial de su rol.
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
  private route = inject(ActivatedRoute);
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

  private irSegunRol(rol: UserRole): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    // Solo rutas internas (empiezan por una sola /): evita redirecciones a otros dominios
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/login')) {
      this.router.navigateByUrl(returnUrl, { replaceUrl: true });
      return;
    }
    this.router.navigate([rol === 'usuario' ? '/incidencias' : '/dashboard'], { replaceUrl: true });
  }
}
