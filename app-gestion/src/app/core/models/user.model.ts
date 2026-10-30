/**
 * Roles de la aplicación (modelo RBAC), de menos a más privilegios:
 * - usuario: registra y consulta incidencias.
 * - tecnico: además ve el dashboard y exporta informes.
 * - admin: además puede borrar incidencias.
 */
export type UserRole = 'usuario' | 'tecnico' | 'admin';

/** Acciones concretas que un rol puede realizar */
export type Permiso =
  | 'incidencias:ver'
  | 'incidencias:crear'
  | 'incidencias:exportar'
  | 'incidencias:borrar'
  | 'dashboard:ver';

/**
 * Matriz rol → permisos. Es el único sitio donde se decide qué puede hacer cada rol:
 * guards, directivas y componentes preguntan por permisos, no por nombres de rol.
 */
export const PERMISOS_POR_ROL: Record<UserRole, readonly Permiso[]> = {
  usuario: ['incidencias:ver', 'incidencias:crear'],
  tecnico: ['incidencias:ver', 'incidencias:crear', 'incidencias:exportar', 'dashboard:ver'],
  admin: ['incidencias:ver', 'incidencias:crear', 'incidencias:exportar', 'incidencias:borrar', 'dashboard:ver'],
};

/** Nombre visible de cada rol */
export const NOMBRE_ROL: Record<UserRole, string> = {
  usuario: 'Usuario',
  tecnico: 'Técnico',
  admin: 'Administrador',
};

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  avatar?: string;
}
