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

## Descripción

Aplicación para gestionar incidencias técnicas de una empresa, hecha con **Ionic 9 + Angular 22** (componentes standalone) y desplegada como PWA en Vercel.
Tiene login con dos roles, listado de incidencias con buscador, formulario de alta con validación asíncrona, cuadro de mando con gráficos, exportación a PDF/CSV y un manual de usuario dentro de la propia app (página **Ayuda**).

## Credenciales de prueba

Son usuarios **ficticios** solo para probar la app (no son datos reales):

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@empresa.com | Admin123! |
| Usuario estándar | usuario@empresa.com | User123! |

En la pantalla de login también hay botones de acceso rápido.

## Tecnologías

| Categoría | Tecnología |
|-----------|-----------|
| UI | Ionic 9 |
| Framework | Angular 22 (standalone, Reactive Forms, RxJS) |
| Gráficos | Chart.js + ng2-charts |
| Datos SQL | Supabase (PostgreSQL vía API REST) |
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
│   ├── guards/        # authGuard (sesión) y roleGuard (rol admin)
│   ├── models/        # Incidencia, User, Comentario  (Modelo)
│   └── services/      # Auth, Incidencias (SQL), Comentarios (NoSQL), Export
├── features/          # Páginas (Vista + ViewModel)
│   ├── login/
│   ├── incidencias/   # listado + nueva-incidencia
│   ├── dashboard/     # solo administrador
│   └── ayuda/         # manual de usuario
├── shared/components/ # DataTable y StatWidget (reutilizables)
├── app.component.*    # Menú lateral según rol
└── app.routes.ts      # Rutas con lazy loading y guards
```

## Qué se ha hecho en cada fase

**Fase 1 (RA 1 y 2)**
- Menú lateral (Side Menu) con lazy loading en todas las rutas (`loadComponent`).
- `authGuard` protege todas las páginas y `roleGuard` deja el Dashboard solo al administrador.
- El menú cambia según el rol y tiene botón de cerrar sesión.
- Formularios reactivos (login y alta) con validaciones síncronas y una **validación asíncrona** que comprueba en Supabase si el código de incidencia ya existe.
- Data binding unidireccional (`[value]`, `{{ }}`) y bidireccional (`[(ngModel)]` en el buscador).

**Fase 2 (RA 3)**
- `DataTableComponent`: tabla con buscador. Recibe `data`, `columns` y `canDelete` por `@Input` y emite `rowSelected` y `deleteClicked` por `@Output`.
- `StatWidgetComponent`: tarjeta con icono, título y valor por `@Input`.
- Los dos usan `ChangeDetectionStrategy.OnPush` y no dependen de la página que los usa.

**Fase 3 (RA 5)**
- `IncidenciasService` usa Supabase (SQL). Si la tabla está vacía o falla, usa datos sintéticos para que la app no se quede en blanco.
- `ComentariosService` simula una colección NoSQL en tiempo real.
- El Dashboard carga las dos fuentes a la vez con `forkJoin`, muestra spinner mientras carga, gráficos de barras y donut, y filtro por categoría en tiempo real.
- Exportación a CSV y a PDF (con cabecera y tabla con estilo) desde Incidencias y desde el Dashboard.

**Fase 4 (RA 4)**
- Diseño mobile-first con `ion-grid` y flexbox; la tabla se convierte en tarjetas en el móvil.
- `lang="es"`, zoom permitido, enlace "Saltar al contenido", foco visible, textos alternativos en imágenes y gráficos, etiquetas en todos los campos y orden de tabulación natural (sin `tabindex` positivos).

**Fase 5 (RA 6 y 7)**
- Git Flow: ramas `main`, `develop` y `feature/*`, fusionadas con `--no-ff`.
- Workflow de GitHub Actions (`.github/workflows/ci.yml`): compila, pasa los tests y genera la documentación.
- Documentación generada con Compodoc (`npm run docs`) y publicada en `/docs` del despliegue.
- Manual de usuario en esta página y dentro de la app (menú → **Ayuda**).

## Imágenes

| Imagen | Dónde aparece |
|--------|---------------|
| `src/assets/img/logo.svg` | Login, menú lateral e icono de la PWA |
| `src/assets/img/soporte.svg` | Cabecera de la página de Incidencias |
| `src/assets/img/ayuda.svg` | Página de Ayuda |

## Tabla de Supabase

La app lee la tabla `incidencias`. Si hay que crearla, en el SQL Editor de Supabase:

```sql
create table if not exists incidencias (
  id text primary key,
  codigo text unique not null,
  titulo text not null,
  categoria text not null,
  prioridad text not null,
  estado text not null,
  descripcion text,
  usuario text,
  fecha date default current_date
);

alter table incidencias enable row level security;
create policy "acceso demo" on incidencias for all using (true) with check (true);
```

> La clave que hay en `environments` es la clave **publishable** de Supabase, pensada para ir en el frontend. No hay claves secretas en el repositorio.

## Manual de usuario

### Iniciar sesión
1. Escribe tu correo y contraseña y pulsa **Iniciar sesión** (o usa los botones de acceso rápido).
2. El administrador entra al **Dashboard** y el usuario estándar a **Incidencias**.

### Incidencias
1. La tabla muestra todas las incidencias. Usa el buscador para filtrar.
2. Pulsa una fila (o Tab + Enter) para ver el detalle.
3. Pulsa **+** para crear una incidencia. El código debe ser tipo `INC-0001` y no puede repetirse.
4. El administrador puede eliminar incidencias.
5. Con **Exportar CSV / PDF** descargas el listado.

### Dashboard (solo administrador)
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
