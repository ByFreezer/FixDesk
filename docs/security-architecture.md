# Memoria técnica: arquitectura de seguridad y control de acceso

**Proyecto:** FixDesk, gestión de incidencias (Ionic 9 + Angular 22 standalone)
**Módulo:** Desarrollo de Interfaces (0488), DAM 2 · **Alumno:** Héctor Fernández
**Código:** `app-gestion/src/app/core` (guards, interceptors, state) y `app.routes.ts`

---

## A. Fundamentación teórico-técnica

### A.1 Functional guards

Un *guard* es una función que el router ejecuta durante una navegación para decidir si la permite. Desde Angular 15 se escriben como **funciones** (`CanActivateFn`, `CanMatchFn`, `CanDeactivateFn`) que obtienen dependencias con `inject()`. Las clases con `implements CanActivate` están obsoletas. Un guard puede devolver `true`, `false`, un `UrlTree` (redirección) o un `Observable`/`Promise` de esos valores.

**Ciclo de vida en una navegación** (orden comprobado en `@angular/router`):

```
URL ─► 1. Emparejar ruta ──► canMatch      (¿existe esta ruta para este usuario?)
       2. Comprobar guards ─► canDeactivate (¿puede irse de la vista actual?)
                            └► canActivate   (¿puede entrar en la nueva?)
       3. Resolvers ────────► datos previos
       4. loadComponent ────► descarga del chunk perezoso
       5. Activación ───────► se crea el componente
```

| Tipo | Cuándo actúa | Uso en FixDesk |
|---|---|---|
| `canMatch` | Al emparejar la URL con la configuración. Si falla, para el router la ruta no existe. | RBAC del dashboard |
| `canActivate` | Ruta ya emparejada, antes de activarla | Autenticación |
| `canDeactivate` | Al salir de la vista actual | Formulario con cambios sin guardar |

**`canActivate` frente a `canMatch` (rendimiento y lazy loading).** Con `loadComponent`, los dos impiden descargar el componente al navegar, porque el chunk se carga en el paso 4, después de los guards. La diferencia está en todo lo demás:

1. **`canMatch` actúa antes.** Con `loadChildren`, `canActivate` se evalúa *después* de cargar el árbol hijo. `canMatch` lo evita.
2. **La ruta "desaparece".** Si `canMatch` devuelve `false`, el router sigue probando las rutas siguientes. Así se pueden definir dos rutas con el mismo `path` según el rol.
3. **Precarga.** `PreloadAllModules` descarga en segundo plano *todas* las rutas perezosas, también las protegidas. En FixDesk hemos sustituido esa estrategia por `SelectivePreloadingStrategy`, que no precarga las rutas con `canMatch`. Así el código del dashboard nunca llega al navegador de un usuario sin permiso. Lo hemos comprobado en el panel *Network*: con el rol `usuario` no se pide ningún chunk del dashboard.

### A.2 HTTP interceptors (`HttpInterceptorFn`)

Los interceptores forman una **cadena** (*pipeline*): cada uno recibe la petición y `next`, puede clonarla y modificarla (las peticiones son inmutables), y devuelve el `Observable` de la respuesta. A ese `Observable` puede aplicar operadores RxJS como `catchError` o `retry`. El orden de registro determina el orden de ejecución: las peticiones pasan en ese orden y las respuestas vuelven en el orden inverso.

```
HttpClient ─► apiInterceptor ─► errorInterceptor ─► backend
           ◄─ (respuesta)     ◄─ catchError 401/403 ◄─
```

- **Cabecera de autorización.** `apiInterceptor` añade `Authorization: Bearer <token>` a las peticiones de nuestra API. A Supabase le envía su `apikey` pública. Ningún servicio construye cabeceras a mano.
- **Errores de sesión centralizados.** `errorInterceptor` distingue dos casos:
  - **401 Unauthorized** (el token no vale): intenta renovarlo **una sola vez** con el *refresh token* y repite la petición con el token nuevo. Si no puede renovarlo, o el reintento vuelve a dar 401, cierra la sesión y navega a `/login?returnUrl=<pantalla actual>`.
  - **403 Forbidden** (la identidad es válida pero el rol no tiene permiso): muestra un aviso **sin cerrar sesión**, porque no es un problema de identidad.
- **Estrategia de tokens.** El *access token* dura 15 minutos y el *refresh token* 8 horas (una jornada). Al renovar, el rol se vuelve a leer del origen de datos, así un cambio de rol se aplica en la siguiente renovación. Un refresh token no sirve como token de acceso: se distingue por el claim `typ`, y hay un test que lo comprueba.

### A.3 Control de acceso basado en roles (RBAC)

**Autenticación** responde a *¿quién eres?*: comparamos el hash SHA-256 de la contraseña y emitimos un JWT firmado. **Autorización** responde a *¿qué puedes hacer?*: el rol se consulta en una matriz de permisos. Son fases distintas en el código: `authGuard` comprueba la identidad y `rbacGuard` los privilegios.

**RBAC** asigna **permisos** a **roles** y roles a usuarios (`Usuario → Rol → Permisos`). El código nunca pregunta "¿es admin?". Pregunta "¿tiene `incidencias:borrar`?". Así, añadir un rol o mover un permiso solo exige cambiar la matriz.

```ts
// core/models/user.model.ts — única fuente de verdad
export const PERMISOS_POR_ROL: Record<UserRole, readonly Permiso[]> = {
  usuario: ['incidencias:ver', 'incidencias:crear'],
  tecnico: ['incidencias:ver', 'incidencias:crear', 'incidencias:exportar', 'dashboard:ver'],
  admin:   ['incidencias:ver', 'incidencias:crear', 'incidencias:exportar', 'incidencias:borrar', 'dashboard:ver'],
};
```

**Encapsulamiento del token.** El JWT (`cabecera.payload.firma`, HMAC-SHA256) lleva los claims `sub`, `email`, `rol`, `permisos`, `typ`, `iat` y `exp`. Ningún componente lee el token. `AuthService` lo valida (firma y caducidad) y publica el estado en `AuthStore`, un store tipo Redux hecho con signals, que expone los selectores computados `user`, `rol` y `permisos`. Si alguien edita el token en `sessionStorage` para cambiarse el rol, la firma deja de coincidir y la sesión se descarta.

```
JWT (sessionStorage) ─► AuthService (valida, renueva) ─► AuthStore (signals)
                                                          ├─► guards
                                                          ├─► *appHasPermiso
                                                          └─► computed() en vistas
```

---

## B. Justificación de la implementación en el proyecto

### B.1 Rutas, roles y registro del interceptor

```ts
// app.routes.ts (extracto)
{ path: 'incidencias',       canActivate: [authGuard], loadComponent: ... },
{ path: 'incidencias/nueva', canActivate: [authGuard],
                             canDeactivate: [pendingChangesGuard], loadComponent: ... },
{ path: 'dashboard',         canMatch: [rbacGuard], data: { permiso: 'dashboard:ver' },
                             loadComponent: ... },
{ path: 'ayuda',             canActivate: [authGuard], loadComponent: ... },
```

| Pantalla / acción | usuario | tecnico | admin | Protección |
|---|:-:|:-:|:-:|---|
| `/incidencias` (listado) | ✔ | ✔ | ✔ | `authGuard` |
| `/incidencias/nueva` | ✔ | ✔ | ✔ | `authGuard` + `pendingChangesGuard` |
| Exportar CSV / PDF | ✘ | ✔ | ✔ | `*appHasPermiso` |
| `/dashboard` | ✘ | ✔ | ✔ | `rbacGuard` (`canMatch`) |
| Botón *Eliminar* | ✘ | ✘ | ✔ | signal `puedeBorrar` + nueva comprobación en `onDelete` |

**Redirección contextual.** Si alguien sin sesión abre `/dashboard`, el guard lo manda a `/login?returnUrl=%2Fdashboard`. Tras iniciar sesión vuelve a esa URL. El login solo acepta rutas internas (empiezan por una sola `/`) para evitar redirecciones abiertas. Si el rol no tiene permiso, `rbacGuard` avisa con un toast ("se requiere rol Técnico o Administrador") y lo lleva a `/incidencias`.

**Registro global del interceptor** en `main.ts`, un único punto para toda la app:

```ts
provideRouter(routes, withPreloading(SelectivePreloadingStrategy), withComponentInputBinding()),
provideHttpClient(withInterceptors([apiInterceptor, errorInterceptor])),
provideAppInitializer(() => inject(AuthService).restoreSession()),
```

El orden es intencionado: primero se añade la cabecera y después se gestionan los errores. Así, en un reintento, `errorInterceptor` pone él mismo el token nuevo. `restoreSession()` se ejecuta antes del primer guard, de modo que al recargar la página no se expulsa a un usuario con sesión válida.

### B.2 Control visual y UI/UX condicional

La interfaz oculta lo que el rol no puede usar **antes** de que el usuario lo intente. Lo hace de tres formas, todas reactivas a la sesión:

1. **Directiva estructural `*appHasPermiso`**, del tipo `*hasRole` pero basada en permisos. Crea o destruye la vista con un `effect()` sobre `AuthStore.permisos`. El elemento no se oculta con CSS: no existe en el DOM.
   ```html
   <div *appHasPermiso="'incidencias:exportar'" class="acciones">…Exportar CSV / PDF…</div>
   ```
2. **Signals computadas.** El menú lateral es `paginas = computed(() => todas.filter(p => permisos().includes(p.permiso)))`. Al cerrar sesión o cambiar de rol se recalcula sin suscripciones manuales. La insignia del menú muestra el rol (Usuario, Técnico o Administrador).
3. **`[canDelete]="puedeBorrar()"`** en el componente `DataTable`, que no sabe nada de roles: solo recibe un booleano.

Ocultar no es proteger: `onDelete()` vuelve a comprobar el permiso (*defensa en profundidad*), y las rutas siguen protegidas por guards aunque alguien escriba la URL a mano.

---

## C. Matriz de alternativas evaluadas

| Decisión | Alternativa descartada | Seguridad | Red / rendimiento | Mantenibilidad y escala |
|---|---|---|---|---|
| **Guards funcionales en el router** | Comprobar en `ngOnInit()` / `ionViewWillEnter()` | El componente ya se ha creado y descargado. Puede mostrar contenido y lanzar peticiones antes de redirigir. | Se descarga el chunk y se ejecuta código inútil. | La regla queda repartida en cada página y es fácil olvidarla. Con guards es una línea en `routes.ts`, testeable de forma aislada. |
| **Interceptor centralizado** | Añadir cabeceras en cada servicio | Basta un olvido para enviar una petición sin token o filtrar el token a otro dominio. El interceptor decide en un solo sitio a qué URL va cada cabecera. | Solo un punto puede renovar el token y repetir la petición. Hacerlo en cada servicio duplicaría peticiones. | Cambiar el esquema (de `Bearer` a cookie, por ejemplo) supone tocar 1 fichero en vez de N. |
| **RBAC con matriz de permisos** | Flag booleano `isAdmin` | Con un flag, un tercer rol obliga a añadir `if` por toda la app. Es fácil dejar un hueco. | Igual. | **Nuestro caso:** 3 roles y 5 permisos. Añadir `tecnico` solo ha requerido una fila en la matriz. |
| | ABAC (atributos y contexto: hora, propietario, departamento…) | Más expresivo. | Exige evaluar políticas, normalmente en el servidor. | Excesivo para FixDesk: ninguna regla depende de atributos. Si hiciera falta "solo edito mis incidencias", se añadiría como regla ABAC puntual sobre RBAC. |
| **canMatch + precarga selectiva** | `canActivate` + `PreloadAllModules` | El código del panel de administración llega al navegador de cualquier usuario. | Se descargan bytes que ese rol no usará. | Hay que mantener una estrategia de precarga propia, de 10 líneas. |

### Limitaciones conocidas y siguiente paso

La autorización en el cliente es una mejora de **UX y de defensa en profundidad, no la barrera definitiva**. En esta versión de demostración:

- Los tokens se firman en el propio cliente, con una clave de demo incluida en el bundle. En producción los firmaría el servidor (por ejemplo Supabase Auth) y el refresh token iría en una cookie `HttpOnly; Secure; SameSite=Strict`, inaccesible desde JavaScript.
- Las políticas RLS de Supabase permiten leer, crear y borrar incidencias, y subir fotos al bucket `incidencias`, con la clave pública. El siguiente paso es mover la matriz de permisos a políticas RLS basadas en el claim `rol` del JWT, para que un 403 real venga del servidor. El `errorInterceptor` ya está preparado para ese caso.

### Verificación

Hay pruebas unitarias en Vitest (52 en la aplicación, todas superadas). Las de seguridad cubren: `authGuard` (con `returnUrl`), `rbacGuard` (`canMatch`, con los 3 roles), `pendingChangesGuard`, `errorInterceptor` (401 con renovación y reintento, 401 sin renovación y 403), la directiva `*appHasPermiso` y `AuthService` (permisos por rol, renovación del token, rechazo de un refresh token usado como token de acceso y rechazo de un token manipulado). La CI de GitHub Actions las ejecuta en cada push.
