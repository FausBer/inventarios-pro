-- Seguimiento de ensamblajes. Ejecutar en Supabase SQL Editor.
-- Los componentes se descuentan al iniciar; pausar no devuelve esos insumos.
-- El stock del equipo final aumenta al finalizar.

alter table public.insumo
  add column if not exists stock numeric not null default 0;

create table if not exists public.ensamblajes (
  id bigint generated always as identity primary key,
  id_empresa bigint not null references public.empresa(id),
  id_insumo_final bigint not null references public.insumo(id),
  cantidad integer not null check (cantidad > 0),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_proceso', 'pausado', 'falta_insumos', 'finalizado')),
  id_usuario bigint not null references public.usuarios(id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  finalizado_en timestamptz,
  insumos_consumidos boolean not null default false,
  detalle_estado text
);

create table if not exists public.avisos_ensamblaje (
  id bigint generated always as identity primary key,
  id_empresa bigint not null references public.empresa(id),
  id_ensamblaje bigint not null references public.ensamblajes(id),
  id_usuario_destino bigint not null references public.usuarios(id),
  mensaje text not null,
  creado_en timestamptz not null default now(),
  leida boolean not null default false
);

create index if not exists ensamblajes_empresa_estado_idx
  on public.ensamblajes (id_empresa, estado, actualizado_en desc);
create index if not exists avisos_ensamblaje_destino_idx
  on public.avisos_ensamblaje (id_usuario_destino, leida, creado_en desc);

-- El usuario necesita estar asignado a la empresa y tener el módulo Productos.
create or replace function public.puede_operar_ensamblaje(p_id_empresa bigint)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.usuarios u
    join public.asignarempresa ae on ae.id_usuario = u.id
    join public.permisos pe on pe.id_usuario = u.id
    join public.modulos m on m.id = pe.idmodulo and m.nombre = 'Productos'
    where u.idauth = auth.uid()::text
      and ae.id_empresa = p_id_empresa
  );
$$;

create or replace function public.es_destinatario_aviso_ensamblaje(p_id_usuario bigint)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = p_id_usuario
      and u.idauth = auth.uid()::text
  );
$$;

alter table public.ensamblajes enable row level security;
alter table public.avisos_ensamblaje enable row level security;

drop policy if exists ensamblajes_empresa_select on public.ensamblajes;
create policy ensamblajes_empresa_select on public.ensamblajes
  for select to authenticated
  using (public.puede_operar_ensamblaje(id_empresa));

drop policy if exists avisos_destinatario_select on public.avisos_ensamblaje;
create policy avisos_destinatario_select on public.avisos_ensamblaje
  for select to authenticated
  using (public.es_destinatario_aviso_ensamblaje(id_usuario_destino));

grant select on public.ensamblajes, public.avisos_ensamblaje to authenticated;

create or replace function public.crear_orden_ensamblaje(
  p_insumo_final_id bigint,
  p_cantidad integer,
  p_id_empresa bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_usuario_id bigint;
  v_orden_id bigint;
begin
  select u.id into v_usuario_id
  from public.usuarios u
  where u.idauth = auth.uid()::text;

  if v_usuario_id is null
     or not public.puede_operar_ensamblaje(p_id_empresa) then
    raise exception 'No tenés permiso para crear ensamblajes en esta empresa';
  end if;
  if p_cantidad is null or p_cantidad < 1 then
    raise exception 'La cantidad debe ser un entero mayor a cero';
  end if;
  if not exists (
    select 1 from public.insumo i
    where i.id = p_insumo_final_id and i.id_empresa = p_id_empresa
  ) then
    raise exception 'El equipo final no pertenece a esta empresa';
  end if;

  insert into public.ensamblajes
    (id_empresa, id_insumo_final, cantidad, id_usuario)
  values
    (p_id_empresa, p_insumo_final_id, p_cantidad, v_usuario_id)
  returning id into v_orden_id;

  return jsonb_build_object('id', v_orden_id, 'estado', 'pendiente');
end;
$$;

create or replace function public.iniciar_ensamblaje(p_ensamblaje_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_usuario_id bigint;
  v_orden public.ensamblajes%rowtype;
  v_faltante record;
  v_item record;
  v_receta_count integer;
  v_aviso text;
begin
  select u.id into v_usuario_id
  from public.usuarios u where u.idauth = auth.uid()::text;

  select * into v_orden
  from public.ensamblajes
  where id = p_ensamblaje_id
  for update;
  if not found then raise exception 'No se encontró la orden'; end if;
  if v_usuario_id is null
     or not public.puede_operar_ensamblaje(v_orden.id_empresa) then
    raise exception 'No tenés permiso para operar esta orden';
  end if;

  if v_orden.estado = 'finalizado' then
    raise exception 'La orden ya está finalizada';
  end if;
  if v_orden.insumos_consumidos then
    update public.ensamblajes
      set estado = 'en_proceso', detalle_estado = null, actualizado_en = now()
      where id = v_orden.id;
    return jsonb_build_object('estado', 'en_proceso', 'mensaje', 'Ensamblaje reanudado');
  end if;

  select count(*) into v_receta_count
  from public.productos_insumo pi
  where pi.id_insumo = v_orden.id_insumo_final;

  if v_receta_count = 0 then
    v_aviso := 'La orden #' || v_orden.id || ' no puede iniciar: el equipo final no tiene componentes asignados.';
  else
    -- Bloquear todos los stocks en orden estable para evitar consumos simultáneos inconsistentes.
    perform p.id
    from public.productos p
    join (
      select pi.id_producto
      from public.productos_insumo pi
      where pi.id_insumo = v_orden.id_insumo_final
      group by pi.id_producto
    ) receta on receta.id_producto = p.id
    order by p.id
    for update of p;

    select p.id, p.descripcion,
           coalesce(p.stock, 0) as stock,
           (pi.cantidad_por_equipo * v_orden.cantidad) as requerido
    into v_faltante
    from (
      select pi.id_producto,
             sum(pi.cantidad) as cantidad_por_equipo,
             bool_or(pi.cantidad <= 0) as receta_invalida
      from public.productos_insumo pi
      where pi.id_insumo = v_orden.id_insumo_final
      group by pi.id_producto
    ) pi
    join public.productos p on p.id = pi.id_producto
    where p.id_empresa is distinct from v_orden.id_empresa
       or pi.receta_invalida
       or pi.cantidad_por_equipo <= 0
       or coalesce(p.stock, 0) < (pi.cantidad_por_equipo * v_orden.cantidad)
    order by p.id
    limit 1;

    if found then
      v_aviso := 'Orden #' || v_orden.id || ': falta stock de ' ||
        coalesce(v_faltante.descripcion, 'un componente') ||
        ' (disponible ' || v_faltante.stock || ', necesario ' || v_faltante.requerido || ').';
    end if;
  end if;

  if v_aviso is not null then
    update public.ensamblajes
      set estado = 'falta_insumos', detalle_estado = v_aviso, actualizado_en = now()
      where id = v_orden.id;

    insert into public.avisos_ensamblaje
      (id_empresa, id_ensamblaje, id_usuario_destino, mensaje)
    select e.id, v_orden.id, e.iduseradmin, v_aviso
    from public.empresa e
    where e.id = v_orden.id_empresa and e.iduseradmin is not null;

    return jsonb_build_object('estado', 'falta_insumos', 'mensaje', v_aviso);
  end if;

  for v_item in
    select pi.id_producto,
           (sum(pi.cantidad) * v_orden.cantidad) as cantidad_consumida
    from public.productos_insumo pi
    where pi.id_insumo = v_orden.id_insumo_final
    group by pi.id_producto
    order by pi.id_producto
  loop
    update public.productos
      set stock = stock - v_item.cantidad_consumida
      where id = v_item.id_producto;

    insert into public.kardex
      (fecha, tipo, id_usuario, id_producto, cantidad, id_empresa, detalle)
    values
      (current_date, 'salida', v_usuario_id, v_item.id_producto,
       v_item.cantidad_consumida, v_orden.id_empresa,
       'Consumo por ensamblaje #' || v_orden.id);
  end loop;

  update public.ensamblajes
    set estado = 'en_proceso', insumos_consumidos = true,
        detalle_estado = null, actualizado_en = now()
    where id = v_orden.id;

  return jsonb_build_object('estado', 'en_proceso', 'mensaje', 'Insumos descontados; ensamblaje iniciado');
end;
$$;

create or replace function public.pausar_ensamblaje(p_ensamblaje_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_orden public.ensamblajes%rowtype;
begin
  select * into v_orden from public.ensamblajes
  where id = p_ensamblaje_id for update;
  if not found then raise exception 'No se encontró la orden'; end if;
  if not public.puede_operar_ensamblaje(v_orden.id_empresa) then
    raise exception 'No tenés permiso para operar esta orden';
  end if;
  if v_orden.estado <> 'en_proceso' then
    raise exception 'Solo se puede pausar una orden en proceso';
  end if;

  update public.ensamblajes
    set estado = 'pausado', detalle_estado = 'Pausado por el operario', actualizado_en = now()
    where id = v_orden.id;
  return jsonb_build_object('estado', 'pausado');
end;
$$;

create or replace function public.finalizar_ensamblaje(p_ensamblaje_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_orden public.ensamblajes%rowtype;
begin
  select * into v_orden from public.ensamblajes
  where id = p_ensamblaje_id for update;
  if not found then raise exception 'No se encontró la orden'; end if;
  if not public.puede_operar_ensamblaje(v_orden.id_empresa) then
    raise exception 'No tenés permiso para operar esta orden';
  end if;
  if v_orden.estado not in ('en_proceso', 'pausado') or not v_orden.insumos_consumidos then
    raise exception 'La orden debe estar iniciada para poder finalizarla';
  end if;

  update public.insumo
    set stock = coalesce(stock, 0) + v_orden.cantidad
    where id = v_orden.id_insumo_final and id_empresa = v_orden.id_empresa;

  update public.ensamblajes
    set estado = 'finalizado', finalizado_en = now(), actualizado_en = now(),
        detalle_estado = null
    where id = v_orden.id;
  return jsonb_build_object('estado', 'finalizado');
end;
$$;

create or replace function public.marcar_aviso_ensamblaje_leido(p_aviso_id bigint)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_usuario_id bigint;
begin
  select u.id into v_usuario_id from public.usuarios u
  where u.idauth = auth.uid()::text;
  if v_usuario_id is null then raise exception 'Usuario no autenticado'; end if;

  update public.avisos_ensamblaje
    set leida = true
    where id = p_aviso_id and id_usuario_destino = v_usuario_id;
end;
$$;

revoke all on function public.crear_orden_ensamblaje(bigint, integer, bigint) from public;
revoke all on function public.puede_operar_ensamblaje(bigint) from public;
revoke all on function public.es_destinatario_aviso_ensamblaje(bigint) from public;
revoke all on function public.iniciar_ensamblaje(bigint) from public;
revoke all on function public.pausar_ensamblaje(bigint) from public;
revoke all on function public.finalizar_ensamblaje(bigint) from public;
revoke all on function public.marcar_aviso_ensamblaje_leido(bigint) from public;
grant execute on function public.crear_orden_ensamblaje(bigint, integer, bigint) to authenticated;
grant execute on function public.puede_operar_ensamblaje(bigint) to authenticated;
grant execute on function public.es_destinatario_aviso_ensamblaje(bigint) to authenticated;
grant execute on function public.iniciar_ensamblaje(bigint) to authenticated;
grant execute on function public.pausar_ensamblaje(bigint) to authenticated;
grant execute on function public.finalizar_ensamblaje(bigint) to authenticated;
grant execute on function public.marcar_aviso_ensamblaje_leido(bigint) to authenticated;
