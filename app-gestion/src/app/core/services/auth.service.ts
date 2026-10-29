import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'app_gestion_user';

  // Usuarios predefinidos de prueba exigidos en las especificaciones del proyecto
  private readonly DEMO_USERS: Array<User & { password: string }> = [
    {
      id: 'usr-1',
      email: 'admin@empresa.com',
      nombre: 'Héctor Fernández (Admin)',
      password: 'Admin123!',
      rol: 'admin',
      avatar: 'assets/icon/favicon.png'
    },
    {
      id: 'usr-2',
      email: 'usuario@empresa.com',
      nombre: 'Carlos López (Estándar)',
      password: 'User123!',
      rol: 'usuario',
      avatar: 'assets/icon/favicon.png'
    }
  ];

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {}

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    return this.currentUserValue !== null;
  }

  public isAdmin(): boolean {
    return this.currentUserValue?.rol === 'admin';
  }

  public hasRole(role: UserRole): boolean {
    return this.currentUserValue?.rol === role;
  }

  public login(email: string, password: string): Observable<User> {
    const user = this.DEMO_USERS.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (user) {
      const { password: _, ...userData } = user;
      return of(userData).pipe(
        delay(300),
        tap(u => {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(u));
          this.currentUserSubject.next(u);
        })
      );
    } else {
      return new Observable(observer => {
        setTimeout(() => {
          observer.error(new Error('Credenciales incorrectas. Verifique correo y contraseña.'));
        }, 300);
      });
    }
  }

  public logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  private getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
