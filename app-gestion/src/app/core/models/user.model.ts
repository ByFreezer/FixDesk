export type UserRole = 'admin' | 'usuario';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  avatar?: string;
}
