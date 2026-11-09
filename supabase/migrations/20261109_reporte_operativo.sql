-- Reporte gerencial por período. Ejecutar en Supabase SQL Editor.
-- La función limita los datos a la empresa del usuario autenticado.
create or replace function public.reporte_operativo_periodo(
  p_id_empresa bigint,
  p_desde date,
  p_hasta date
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_usuario_id bigint;
  v_puede_ver boolean;
  v_resultado jsonb;
begin
  if p_desde is null or p_hasta is null or p_hasta <= p_desde then
    raise exception 'El período seleccionado no es válido';
  end if;

  select u.id into v_usuario_id
  from public.usuarios u
  where u.idauth = auth.uid()::text;

  select exists (
    select 1
    from public.empresa e
    where e.id = p_id_empresa
      and e.iduseradmin = v_usuario_id
  ) or exists (
    select 1
    from public.asignarempresa ae
    join public.permisos pe on pe.id_usuario = ae.id_usuario
    join public.modulos m on m.id = pe.idmodulo
    where ae.id_empresa = p_id_empresa
      and ae.id_usuario = v_usuario_id
      and m.nombre in ('Kardex', 'Productos', 'Marca de productos')
  ) into v_puede_ver;

  if v_usuario_id is null or not coalesce(v_puede_ver, false) then
    raise exception 'No tenés permiso para consultar los reportes de esta empresa';
  end if;

  with movimientos as (
    select k.id, k.tipo, k.cantidad, k.detalle, k.id_producto
    from public.kardex k
    where k.id_empresa = p_id_empresa
      and k.fecha >= p_desde
      and k.fecha < p_hasta
      and coalesce(k.estado, 1) <> 0
  ),
  produccion as (
    select i.nombre as equipo_final,
           sum(a.cantidad)::numeric as unidades,
           count(*)::integer as ordenes
    from public.ensamblajes a
    join public.insumo i on i.id = a.id_insumo_final
    where a.id_empresa = p_id_empresa
      and a.estado = 'finalizado'
      and a.finalizado_en >= (p_desde::timestamp at time zone 'America/Argentina/Cordoba')
      and a.finalizado_en < (p_hasta::timestamp at time zone 'America/Argentina/Cordoba')
    group by i.nombre
  ),
  consumo as (
    select p.descripcion as componente,
           sum(m.cantidad)::numeric as cantidad,
           count(*)::integer as movimientos
    from movimientos m
    join public.productos p on p.id = m.id_producto
    where m.tipo = 'salida'
      and m.detalle like 'Consumo por ensamblaje #%'
    group by p.descripcion
  ),
  movimiento_producto as (
    select p.descripcion as componente,
           coalesce(sum(m.cantidad) filter (where m.tipo = 'entrada'), 0)::numeric as entradas,
           coalesce(sum(m.cantidad) filter (where m.tipo = 'salida'), 0)::numeric as salidas,
           coalesce(sum(m.cantidad) filter (
             where m.tipo = 'salida' and m.detalle like 'Consumo por ensamblaje #%'
           ), 0)::numeric as consumo_ensamblaje,
           count(*) filter (where m.tipo = 'entrada')::integer as movimientos_entrada,
           count(*) filter (where m.tipo = 'salida')::integer as movimientos_salida
    from movimientos m
    join public.productos p on p.id = m.id_producto
    group by p.descripcion
  ),
  ordenes as (
    select a.estado, count(*)::integer as cantidad_ordenes,
           coalesce(sum(a.cantidad), 0)::numeric as unidades
    from public.ensamblajes a
    where a.id_empresa = p_id_empresa
      and a.creado_en >= (p_desde::timestamp at time zone 'America/Argentina/Cordoba')
      and a.creado_en < (p_hasta::timestamp at time zone 'America/Argentina/Cordoba')
    group by a.estado
  ),
  totales_produccion as (
    select coalesce(sum(unidades), 0)::numeric as unidades,
           coalesce(sum(ordenes), 0)::integer as ordenes
    from produccion
  ),
  totales_movimientos as (
    select coalesce(sum(cantidad) filter (where tipo = 'entrada'), 0)::numeric as entradas,
           coalesce(sum(cantidad) filter (where tipo = 'salida'), 0)::numeric as salidas,
           coalesce(sum(cantidad) filter (
             where tipo = 'salida' and detalle like 'Consumo por ensamblaje #%'
           ), 0)::numeric as consumo_ensamblaje
    from movimientos
  ),
  totales_ordenes as (
    select coalesce(sum(cantidad_ordenes), 0)::integer as creadas,
           coalesce(sum(cantidad_ordenes) filter (where estado = 'en_proceso'), 0)::integer as en_proceso,
           coalesce(sum(cantidad_ordenes) filter (where estado = 'pausado'), 0)::integer as pausadas,
           coalesce(sum(cantidad_ordenes) filter (where estado = 'falta_insumos'), 0)::integer as con_faltantes,
           coalesce(sum(cantidad_ordenes) filter (where estado = 'pendiente'), 0)::integer as pendientes
    from ordenes
  )
  select jsonb_build_object(
    'periodo', jsonb_build_object('desde', p_desde, 'hasta_exclusiva', p_hasta),
    'resumen', jsonb_build_object(
      'equipos_terminados', tp.unidades,
      'ordenes_finalizadas', tp.ordenes,
      'ordenes_creadas', tor.creadas,
      'ordenes_en_proceso', tor.en_proceso,
      'ordenes_pausadas', tor.pausadas,
      'ordenes_con_faltantes', tor.con_faltantes,
      'ordenes_pendientes', tor.pendientes,
      'componentes_entrantes', tm.entradas,
      'componentes_salientes', tm.salidas,
      'consumo_ensamblaje', tm.consumo_ensamblaje
    ),
    'produccion', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.unidades desc, x.equipo_final)
      from produccion x
    ), '[]'::jsonb),
    'consumo', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.cantidad desc, x.componente)
      from consumo x
    ), '[]'::jsonb),
    'movimientos', coalesce((
      select jsonb_agg(to_jsonb(x) order by (x.entradas + x.salidas) desc, x.componente)
      from movimiento_producto x
    ), '[]'::jsonb),
    'ordenes_por_estado', coalesce((
      select jsonb_object_agg(estado, cantidad_ordenes) from ordenes
    ), '{}'::jsonb)
  ) into v_resultado
  from totales_produccion tp
  cross join totales_movimientos tm
  cross join totales_ordenes tor;

  return v_resultado;
end;
$$;

revoke all on function public.reporte_operativo_periodo(bigint, date, date) from public;
grant execute on function public.reporte_operativo_periodo(bigint, date, date) to authenticated;
