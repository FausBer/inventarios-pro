-- Permite usar una dirección de correo real para alertas, aunque la cuenta
-- de acceso del encargado conserve una dirección ficticia.
-- Ejecutar después de 20261109_configuracion_empresa_alertas.sql.

alter table public.empresa
  add column if not exists correo_alerta_stock text;

drop function if exists public.actualizar_configuracion_empresa(bigint, text, bigint);

create or replace function public.actualizar_configuracion_empresa(
  p_id_empresa bigint,
  p_nombre text,
  p_id_usuario_alerta_stock bigint,
  p_correo_alerta_stock text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_nombre text := nullif(btrim(p_nombre), '');
  v_correo text := nullif(lower(btrim(p_correo_alerta_stock)), '');
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
    raise exception 'El encargado debe ser un usuario activo de esta empresa';
  end if;

  if p_id_usuario_alerta_stock is not null and (
    v_correo is null or v_correo !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ) then
    raise exception 'Ingresá un correo real y válido para recibir las alertas';
  end if;

  update public.empresa
  set nombre = v_nombre,
      id_usuario_alerta_stock = p_id_usuario_alerta_stock,
      correo_alerta_stock = case
        when p_id_usuario_alerta_stock is null then null
        else v_correo
      end
  where id = p_id_empresa;

  return jsonb_build_object(
    'id', p_id_empresa,
    'nombre', v_nombre,
    'id_usuario_alerta_stock', p_id_usuario_alerta_stock,
    'correo_alerta_stock', case when p_id_usuario_alerta_stock is null then null else v_correo end
  );
end;
$$;

revoke all on function public.actualizar_configuracion_empresa(bigint, text, bigint, text) from public;
grant execute on function public.actualizar_configuracion_empresa(bigint, text, bigint, text) to authenticated;
