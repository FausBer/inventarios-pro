-- Configuración de nombre de empresa y persona destinataria de alertas.
-- Ejecutar en Supabase SQL Editor.

alter table public.empresa
  add column if not exists id_usuario_alerta_stock bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'empresa_id_usuario_alerta_stock_fkey'
      and conrelid = 'public.empresa'::regclass
  ) then
    alter table public.empresa
      add constraint empresa_id_usuario_alerta_stock_fkey
      foreign key (id_usuario_alerta_stock)
      references public.usuarios(id)
      on delete set null;
  end if;
end;
$$;

create or replace function public.puede_configurar_empresa(p_id_empresa bigint)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.usuarios u
    join public.empresa e on e.iduseradmin = u.id
    where u.idauth = auth.uid()::text
      and e.id = p_id_empresa
  ) or exists (
    select 1
    from public.usuarios u
    join public.asignarempresa ae on ae.id_usuario = u.id
    join public.permisos pe on pe.id_usuario = u.id
    join public.modulos m on m.id = pe.idmodulo
    where u.idauth = auth.uid()::text
      and ae.id_empresa = p_id_empresa
      and m.nombre = 'Tu empresa'
  );
$$;

create or replace function public.listar_usuarios_encargados_empresa(
  p_id_empresa bigint
)
returns table(id bigint, nombres text, correo text)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if not public.puede_configurar_empresa(p_id_empresa) then
    raise exception 'No tenés permiso para configurar esta empresa';
  end if;

  return query
  select usuarios_empresa.id, usuarios_empresa.nombres, usuarios_empresa.correo
  from (
    select u.id, u.nombres, u.correo
    from public.usuarios u
    join public.asignarempresa ae on ae.id_usuario = u.id
    where ae.id_empresa = p_id_empresa
      and coalesce(lower(u.estado), 'activo') = 'activo'
      and nullif(btrim(u.correo), '') is not null
    union
    select u.id, u.nombres, u.correo
    from public.empresa e
    join public.usuarios u on u.id = e.iduseradmin
    where e.id = p_id_empresa
      and coalesce(lower(u.estado), 'activo') = 'activo'
      and nullif(btrim(u.correo), '') is not null
  ) usuarios_empresa
  order by usuarios_empresa.nombres;
end;
$$;

create or replace function public.actualizar_configuracion_empresa(
  p_id_empresa bigint,
  p_nombre text,
  p_id_usuario_alerta_stock bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_nombre text := nullif(btrim(p_nombre), '');
begin
  if not public.puede_configurar_empresa(p_id_empresa) then
    raise exception 'No tenés permiso para configurar esta empresa';
  end if;
  if v_nombre is null then
    raise exception 'El nombre de la empresa no puede quedar vacío';
  end if;

  if p_id_usuario_alerta_stock is not null and not exists (
    select 1
    from public.usuarios u
    where u.id = p_id_usuario_alerta_stock
      and coalesce(lower(u.estado), 'activo') = 'activo'
      and nullif(btrim(u.correo), '') is not null
      and (
        exists (
          select 1 from public.asignarempresa ae
          where ae.id_usuario = u.id and ae.id_empresa = p_id_empresa
        )
        or exists (
          select 1 from public.empresa e
          where e.id = p_id_empresa and e.iduseradmin = u.id
        )
      )
  ) then
    raise exception 'La persona encargada debe ser un usuario activo de esta empresa y tener correo registrado';
  end if;

  update public.empresa
  set nombre = v_nombre,
      id_usuario_alerta_stock = p_id_usuario_alerta_stock
  where id = p_id_empresa;

  return jsonb_build_object(
    'id', p_id_empresa,
    'nombre', v_nombre,
    'id_usuario_alerta_stock', p_id_usuario_alerta_stock
  );
end;
$$;

revoke all on function public.puede_configurar_empresa(bigint) from public;
revoke all on function public.listar_usuarios_encargados_empresa(bigint) from public;
revoke all on function public.actualizar_configuracion_empresa(bigint, text, bigint) from public;
grant execute on function public.puede_configurar_empresa(bigint) to authenticated;
grant execute on function public.listar_usuarios_encargados_empresa(bigint) to authenticated;
grant execute on function public.actualizar_configuracion_empresa(bigint, text, bigint) to authenticated;
