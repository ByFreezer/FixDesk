-- FixDesk · Preparación de la tabla "incidencias" en Supabase
-- Ejecutar una sola vez en Supabase → SQL Editor.
-- Todos los datos son ficticios (datos sintéticos).

-- 1) Columnas que usa la app (si ya existen no pasa nada)
alter table public.incidencias add column if not exists codigo text unique;
alter table public.incidencias add column if not exists prioridad text default 'Media';
alter table public.incidencias add column if not exists descripcion text;
alter table public.incidencias add column if not exists usuario text;

-- 2) Políticas de acceso para la demo (lectura, alta y borrado con la clave pública)
alter table public.incidencias enable row level security;
drop policy if exists "demo_select" on public.incidencias;
drop policy if exists "demo_insert" on public.incidencias;
drop policy if exists "demo_delete" on public.incidencias;
create policy "demo_select" on public.incidencias for select using (true);
create policy "demo_insert" on public.incidencias for insert with check (true);
create policy "demo_delete" on public.incidencias for delete using (true);

-- 3) Datos de ejemplo
insert into public.incidencias (codigo, titulo, categoria, prioridad, estado, descripcion, usuario, fecha) values
('INC-1001','Fallo en servidor de base de datos PostgreSQL','Software','Crítica','Abierta','El pool de conexiones supera el umbral máximo del 95% generando timeouts en peticiones REST.','admin@empresa.com','2026-10-25'),
('INC-1002','Sustitución de switch capa 3 en rack principal','Hardware','Alta','En Proceso','Pérdida de paquetes en la VLAN 20 de desarrollo tras fluctuación eléctrica.','soporte@empresa.com','2026-10-26'),
('INC-1003','Actualización certificados TLS / SSL','Seguridad','Media','Cerrada','Renovación automatizada de certificados wildcard en proxy reverso NGINX.','admin@empresa.com','2026-10-24'),
('INC-1004','Latencia elevada en enlace fibra WAN Madrid-Barcelona','Red','Alta','Abierta','Jitter superior a 120ms detectado por monitorización Zabbix.','redes@empresa.com','2026-10-27'),
('INC-1005','Instalación entorno desarrollo Angular / Ionic','Software','Baja','Cerrada','Despliegue de imagen Docker estándar para nuevos desarrolladores.','usuario@empresa.com','2026-10-22'),
('INC-1006','Avería fuente de alimentación SAI sala de servidores','Hardware','Crítica','En Proceso','Batería modular 2 emite señal de alarma por degradación de celdas.','mantenimiento@empresa.com','2026-10-28'),
('INC-1007','Impresora de planta 2 no imprime en red','Hardware','Baja','Abierta','La impresora no responde a los trabajos enviados desde la VLAN de oficina.','usuario@empresa.com','2026-10-29'),
('INC-1008','Intentos de acceso sospechosos a la VPN','Seguridad','Alta','En Proceso','Se detectan múltiples intentos fallidos de autenticación desde IPs externas.','seguridad@empresa.com','2026-10-29')
on conflict (codigo) do nothing;

-- 4) Fotos de las incidencias (Supabase Storage)
--    Columna con la URL pública de la foto y bucket "incidencias" (público, máx. 2 MB, solo imágenes).
alter table public.incidencias add column if not exists imagen_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('incidencias', 'incidencias', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Políticas de la demo: cualquiera con la clave pública puede ver y subir fotos, solo en este bucket
drop policy if exists "demo_fotos_select" on storage.objects;
drop policy if exists "demo_fotos_insert" on storage.objects;
create policy "demo_fotos_select" on storage.objects for select using (bucket_id = 'incidencias');
create policy "demo_fotos_insert" on storage.objects for insert with check (bucket_id = 'incidencias');
