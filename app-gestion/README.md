# FixDesk · Sistema de Gestión Multiplataforma (PWA/Híbrida)

> Actividad Individual 1 — Desarrollo de Interfaces (DI 0488)
> 2º DAM — Héctor Fernández — Curso 2026/2027

![Logo de FixDesk](src/assets/img/logo.svg)

## Enlaces de entrega

| | |
|---|---|
| Repositorio | https://github.com/ByFreezer/FixDesk |
| Aplicación en producción | https://fix-desk-freezer4.vercel.app |
| Documentación técnica | https://fix-desk-freezer4.vercel.app/docs/ (se genera con Compodoc en cada despliegue) |
| Anexo de seguridad | [docs/security-architecture.md](../docs/security-architecture.md) (guards, interceptores y RBAC) |

## Descripción

Aplicación para gestionar incidencias técnicas de una empresa, hecha con **Ionic 9 + Angular 22** (componentes standalone) y desplegada como PWA en Vercel.
Tiene login con tres roles (usuario, técnico y administrador) y control de acceso por permisos, listado de incidencias con buscador, formulario de alta con validación asíncrona y foto opcional, cuadro de mando con gráficos, exportación a PDF/CSV y un manual de usuario dentro de la propia app (página **Ayuda**).

## Credenciales de prueba

Hay tres usuarios **ficticios**: Administrador, Técnico y Usuario estándar. En el código de la
aplicación solo se guarda el hash SHA-256 de sus contraseñas (los tests unitarios usan estas
credenciales de prueba) y se entregan al profesor en el documento PDF de la actividad.

## Tecnologías

| Categoría | Tecnología |
|-----------|-----------|
| UI | Ionic 9 |
| Framework | Angular 22 (standalone, Reactive Forms, RxJS) |
| Gráficos | Chart.js + ng2-charts |
| Datos SQL | Supabase (PostgreSQL vía API REST con HttpClient) |
| Imágenes | Supabase Storage (bucket `incidencias`) |
| Datos NoSQL | Comentarios en tiempo real simulados (estilo Firestore, con `BehaviorSubject`) |
| Exportación | jsPDF + jspdf-autotable (PDF) y CSV propio |
| Documentación | Compodoc |
| CI / Despliegue | GitHub Actions + Vercel |

## Instalación local

```bash
git clone https://github.com/ByFreezer/FixDesk.git
cd FixDesk/app-gestion
npm install
npm start
```

Se abre en `http://localhost:4200`.

## Estructura (MVVM)

```
src/app/
├── core/
│   ├── guards/        # authGuard (sesión), rbacGuard (permisos, canMatch) y pendingChangesGuard (canDeactivate)
│   ├── interceptors/  # cabeceras (apiInterceptor) y errores 401/403 (errorInterceptor)
│   ├── models/        # Incidencia, User (roles y permisos), Comentario  (Modelo)
│   ├── routing/       # precarga selectiva de rutas
│   ├── services/      # Auth, Incidencias (SQL + fotos), Comentarios (NoSQL), Export
│   └── state/         # AuthStore (estilo Redux con signals)
├── features/          # Páginas (Vista + ViewModel)
│   ├── login/
│   ├── incidencias/   # listado + nueva-incidencia
│   ├── dashboard/     # técnico y administrador
│   └── ayuda/         # manual de usuario
├── shared/components/ # DataTable y StatWidget (reutilizables)
├── shared/directives/ # *appHasPermiso (muestra elementos según el permiso)
├── app.component.*    # Menú lateral según los permisos del rol
└── app.routes.ts      # Rutas con lazy loading y guards
```

## Qué se ha hecho en cada fase

**Fase 1 (RA 1 y 2)**
- Seguridad: las contraseñas solo se guardan como hash SHA-256 y al iniciar sesión se generan dos **tokens JWT firmados (HMAC-SHA256)**: uno de acceso que caduca a los 15 minutos y uno de refresco (8 horas) que lo renueva sin volver a pedir la contraseña. Si alguien modifica un token (por ejemplo para cambiarse el rol) la firma deja de coincidir y la sesión se cierra.
- Estado global predecible con un **store estilo Redux** (`core/state/auth.store.ts`): estado único, acciones y reductor puro.
- **Control de acceso por roles (RBAC)**: la matriz `PERMISOS_POR_ROL` define qué puede hacer cada rol; guards, menú y botones preguntan por permisos, no por el nombre del rol.
- **Interceptores HTTP** (`core/interceptors`): uno añade las cabeceras a cada petición y otro gestiona los errores: ante un 401 renueva el token y repite la petición, y ante un 403 avisa sin cerrar la sesión.
- Menú lateral (Side Menu) con lazy loading en todas las rutas (`loadComponent`) y precarga selectiva.
- `authGuard` (canActivate) protege todas las páginas y guarda la URL pedida (`returnUrl`); `rbacGuard` (canMatch) deja el Dashboard solo a los roles con permiso; `pendingChangesGuard` (canDeactivate) avisa al salir de un formulario sin guardar.
- El menú (signal computada) y los botones (directiva `*appHasPermiso`) cambian según el rol, y hay botón de cerrar sesión.
- Formularios reactivos (login y alta) con validaciones síncronas y una **validación asíncrona** que comprueba en Supabase si el código de incidencia ya existe.
- Data binding unidireccional (`[value]`, `{{ }}`) y bidireccional (`[(ngModel)]` en el buscador).

**Fase 2 (RA 3)**
- `DataTableComponent`: tabla con buscador. Recibe `data`, `columns` y `canDelete` por `@Input` y emite `rowSelected` y `deleteClicked` por `@Output`.
- `StatWidgetComponent`: tarjeta con icono, título y valor por `@Input`.
- Los dos usan `ChangeDetectionStrategy.OnPush` y no dependen de la página que los usa.

**Fase 3 (RA 5)**
- `IncidenciasService` usa Supabase (SQL). Si la tabla está vacía o falla, usa datos sintéticos para que la app no se quede en blanco.
- `ComentariosService` simula una colección NoSQL en tiempo real.
- Fotos: al crear una incidencia se puede adjuntar una imagen, que se sube a **Supabase Storage** (bucket `incidencias`) y se muestra en el detalle.
- El Dashboard carga las dos fuentes a la vez con `forkJoin`, muestra spinner mientras carga, gráficos de barras y donut, y filtro por categoría en tiempo real.
- Exportación a CSV y a PDF (con cabecera y tabla con estilo) desde Incidencias y desde el Dashboard (técnico y administrador).

**Fase 4 (RA 4)**
- Diseño mobile-first con `ion-grid` y flexbox; la tabla se convierte en tarjetas en el móvil.
- `lang="es"`, zoom permitido, enlace "Saltar al contenido", foco visible, textos alternativos en imágenes y gráficos, etiquetas en todos los campos y orden de tabulación natural (sin `tabindex` positivos).

**Fase 5 (RA 6 y 7)**
- Git Flow: ramas `main`, `develop` y `feature/*`, fusionadas con `--no-ff`.
- Workflow de GitHub Actions (`.github/workflows/ci.yml`): compila, pasa los tests y genera la documentación.
- **Los tests bloquean el despliegue**: Vercel ejecuta `npm run test:ci` antes de compilar; si un test falla, no se publica.
- Cambios integrados en `main` mediante **Pull Requests**.
- Documentación generada con Compodoc (`npm run docs`) y publicada en `/docs` del despliegue.
- Manual de usuario en esta página y dentro de la app (menú → **Ayuda**).

## Imágenes

| Imagen | Dónde aparece |
|--------|---------------|
| `src/assets/img/logo.svg` | Login, menú lateral e icono de la PWA |
| `src/assets/img/soporte.svg` | Cabecera de la página de Incidencias |
| `src/assets/img/ayuda.svg` | Página de Ayuda |

## Tabla de Supabase

La app usa la tabla `incidencias`. El script `supabase/setup.sql` añade las columnas que faltan,
crea las políticas de acceso para la demo, carga datos de ejemplo (ficticios) y crea el bucket
`incidencias` de Storage para las fotos. Se ejecuta una vez en **Supabase → SQL Editor**.

> La clave que hay en `environments` es la clave **publishable** de Supabase, pensada para ir en el
> frontend (equivale a la antigua *anon key*). No hay claves secretas en el repositorio.

## Manual de usuario

### Iniciar sesión
1. Escribe tu correo y contraseña y pulsa **Iniciar sesión**.
2. El usuario estándar entra a **Incidencias**; el técnico y el administrador, al **Dashboard**. Si venías de una página protegida, vuelves a ella.

### Roles

| Rol | Qué puede hacer |
|-----|-----------------|
| Usuario | Consultar y crear incidencias |
| Técnico | Además, ver el Dashboard y exportar informes |
| Administrador | Además, eliminar incidencias |

### Incidencias
1. La tabla muestra todas las incidencias. Usa el buscador para filtrar.
2. Pulsa una fila (o Tab + Enter) para ver el detalle, con la foto si la tiene.
3. Pulsa **+** para crear una incidencia. El código debe ser tipo `INC-0001` y no puede repetirse. Puedes **adjuntar una foto** (JPG, PNG o WEBP, máx. 2 MB).
4. El administrador puede eliminar incidencias.
5. El técnico y el administrador pueden descargar el listado con **Exportar CSV / PDF**.

### Dashboard (técnico y administrador)
1. Muestra total, abiertas, cerradas y número de comentarios.
2. Gráficos por estado y por categoría.
3. El filtro de categoría actualiza datos y gráficos al momento.

### Cerrar sesión
Abre el menú lateral y pulsa **Cerrar sesión**.

## Scripts

| Comando | Para qué sirve |
|---------|----------------|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Compilación de producción (carpeta `www`) |
| `npm run test:ci` | Tests unitarios una vez |
| `npm run docs` | Genera la documentación en `documentation/` |
| `npm run docs:serve` | Genera y abre la documentación en local |
