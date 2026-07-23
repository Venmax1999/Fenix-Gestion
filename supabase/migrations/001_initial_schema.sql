-- ============================================================
-- Raíces Tucumán - Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Tables ─────────────────────────────────────────────────

create table if not exists categorias (
  id   serial primary key,
  nombre text not null unique,
  descripcion text
);

create table if not exists productos (
  id                  serial primary key,
  sku                 text not null unique,
  nombre              text not null,
  descripcion         text,
  categoria_id        integer references categorias(id),
  costo               numeric(12,2) not null default 0,
  precio_venta_neto   numeric(12,2) not null default 0,
  tasa_impuesto       numeric(5,2)  not null default 21.0,
  precio_venta_final  numeric(12,2) not null default 0,
  stock_actual        integer not null default 0,
  stock_minimo        integer not null default 5,
  activo              boolean not null default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists clientes (
  id                      serial primary key,
  tipo_documento          text not null default 'CUIT',
  numero_documento        text not null unique,
  razon_social            text not null,
  nombre_fantasia         text,
  email                   text,
  telefono                text,
  direccion               text,
  ciudad                  text,
  provincia               text,
  saldo_cuenta_corriente  numeric(12,2) not null default 0,
  activo                  boolean not null default true,
  created_at              timestamptz default now()
);

create table if not exists proveedores (
  id               serial primary key,
  tipo_documento   text not null default 'CUIT',
  numero_documento text not null unique,
  razon_social     text not null,
  contacto         text,
  email            text,
  telefono         text,
  direccion        text,
  activo           boolean not null default true,
  created_at       timestamptz default now()
);

create table if not exists ventas (
  id                 serial primary key,
  numero_comprobante text not null unique,
  cliente_id         integer references clientes(id),
  fecha              timestamptz default now(),
  subtotal           numeric(12,2) not null default 0,
  impuestos          numeric(12,2) not null default 0,
  total              numeric(12,2) not null default 0,
  metodo_pago        text not null default 'efectivo',
  estado             text not null default 'completada',
  observaciones      text,
  created_at         timestamptz default now()
);

create table if not exists detalle_ventas (
  id              serial primary key,
  venta_id        integer not null references ventas(id) on delete cascade,
  producto_id     integer not null references productos(id),
  cantidad        integer not null,
  precio_unitario numeric(12,2) not null,
  subtotal        numeric(12,2) not null,
  impuesto        numeric(12,2) not null,
  total_linea     numeric(12,2) not null
);

create table if not exists movimientos_stock (
  id               serial primary key,
  producto_id      integer not null references productos(id),
  tipo             text not null check (tipo in ('entrada', 'salida', 'ajuste')),
  cantidad         integer not null,
  stock_anterior   integer not null,
  stock_posterior  integer not null,
  motivo           text,
  referencia_id    integer,
  referencia_tipo  text,
  usuario          text default 'admin',
  fecha            timestamptz default now()
);

create table if not exists cuenta_corriente (
  id               serial primary key,
  cliente_id       integer not null references clientes(id),
  tipo             text not null check (tipo in ('debito', 'credito')),
  monto            numeric(12,2) not null,
  saldo_anterior   numeric(12,2) not null,
  saldo_posterior  numeric(12,2) not null,
  descripcion      text,
  referencia_id    integer,
  fecha            timestamptz default now()
);

-- ─── Indexes ────────────────────────────────────────────────
create index if not exists idx_productos_sku      on productos(sku);
create index if not exists idx_productos_nombre   on productos(nombre);
create index if not exists idx_productos_activo   on productos(activo);
create index if not exists idx_ventas_fecha       on ventas(fecha desc);
create index if not exists idx_ventas_cliente     on ventas(cliente_id);
create index if not exists idx_detalle_venta      on detalle_ventas(venta_id);
create index if not exists idx_movimientos_prod   on movimientos_stock(producto_id);
create index if not exists idx_movimientos_fecha  on movimientos_stock(fecha desc);

-- ─── Row Level Security ──────────────────────────────────────
alter table categorias         enable row level security;
alter table productos          enable row level security;
alter table clientes           enable row level security;
alter table proveedores        enable row level security;
alter table ventas             enable row level security;
alter table detalle_ventas     enable row level security;
alter table movimientos_stock  enable row level security;
alter table cuenta_corriente   enable row level security;

-- Authenticated users can do everything
create policy "auth_all_categorias"        on categorias        for all to authenticated using (true) with check (true);
create policy "auth_all_productos"         on productos         for all to authenticated using (true) with check (true);
create policy "auth_all_clientes"          on clientes          for all to authenticated using (true) with check (true);
create policy "auth_all_proveedores"       on proveedores       for all to authenticated using (true) with check (true);
create policy "auth_all_ventas"            on ventas            for all to authenticated using (true) with check (true);
create policy "auth_all_detalle_ventas"    on detalle_ventas    for all to authenticated using (true) with check (true);
create policy "auth_all_movimientos"       on movimientos_stock for all to authenticated using (true) with check (true);
create policy "auth_all_cuenta_corriente"  on cuenta_corriente  for all to authenticated using (true) with check (true);

-- ─── Database Functions ──────────────────────────────────────

-- get_dashboard(): returns all KPIs in one RPC call
create or replace function get_dashboard()
returns json
language plpgsql
security definer
as $$
declare
  v_total_productos     integer;
  v_stock_critico       integer;
  v_total_clientes      integer;
  v_total_proveedores   integer;
  v_ventas_hoy_cant     integer;
  v_ventas_hoy_total    numeric;
  v_ventas_mes_cant     integer;
  v_ventas_mes_total    numeric;
  v_valor_inv_costo     numeric;
  v_valor_inv_venta     numeric;
  v_top_productos       json;
  v_ventas_recientes    json;
  v_stock_bajo          json;
  v_ventas_por_metodo   json;
begin
  select count(*)                                     into v_total_productos     from productos where activo = true;
  select count(*)                                     into v_stock_critico       from productos where activo = true and stock_actual <= stock_minimo;
  select count(*)                                     into v_total_clientes      from clientes  where activo = true;
  select count(*)                                     into v_total_proveedores   from proveedores where activo = true;
  select coalesce(sum(costo * stock_actual), 0)       into v_valor_inv_costo     from productos where activo = true;
  select coalesce(sum(precio_venta_final * stock_actual), 0) into v_valor_inv_venta from productos where activo = true;

  select
    coalesce(count(*), 0),
    coalesce(sum(total), 0)
  into v_ventas_hoy_cant, v_ventas_hoy_total
  from ventas
  where date(fecha at time zone 'America/Argentina/Tucuman') = current_date and estado = 'completada';

  select
    coalesce(count(*), 0),
    coalesce(sum(total), 0)
  into v_ventas_mes_cant, v_ventas_mes_total
  from ventas
  where to_char(fecha at time zone 'America/Argentina/Tucuman', 'YYYY-MM') = to_char(now() at time zone 'America/Argentina/Tucuman', 'YYYY-MM')
    and estado = 'completada';

  select json_agg(t) into v_top_productos from (
    select p.id, p.sku, p.nombre,
           sum(dv.cantidad)    as total_vendido,
           sum(dv.total_linea) as total_facturado
    from detalle_ventas dv
    join productos p on dv.producto_id = p.id
    join ventas v on dv.venta_id = v.id
    where v.estado = 'completada'
    group by p.id, p.sku, p.nombre
    order by total_vendido desc
    limit 5
  ) t;

  select json_agg(t) into v_ventas_recientes from (
    select v.id, v.numero_comprobante, v.total, v.fecha, v.metodo_pago,
           c.razon_social as cliente_nombre
    from ventas v
    left join clientes c on v.cliente_id = c.id
    where v.estado = 'completada'
    order by v.fecha desc
    limit 5
  ) t;

  select json_agg(t) into v_stock_bajo from (
    select id, sku, nombre, stock_actual, stock_minimo
    from productos
    where activo = true and stock_actual <= stock_minimo
    order by (stock_actual - stock_minimo) asc
    limit 10
  ) t;

  select json_agg(t) into v_ventas_por_metodo from (
    select metodo_pago, count(*) as cantidad, coalesce(sum(total), 0) as total
    from ventas
    where to_char(fecha at time zone 'America/Argentina/Tucuman', 'YYYY-MM') = to_char(now() at time zone 'America/Argentina/Tucuman', 'YYYY-MM')
      and estado = 'completada'
    group by metodo_pago
  ) t;

  return json_build_object(
    'resumen', json_build_object(
      'total_productos',       v_total_productos,
      'stock_critico',         v_stock_critico,
      'total_clientes',        v_total_clientes,
      'total_proveedores',     v_total_proveedores,
      'valor_inventario_costo', v_valor_inv_costo,
      'valor_inventario_venta', v_valor_inv_venta
    ),
    'ventas_hoy', json_build_object(
      'cantidad', v_ventas_hoy_cant,
      'total',    v_ventas_hoy_total
    ),
    'ventas_mes', json_build_object(
      'cantidad', v_ventas_mes_cant,
      'total',    v_ventas_mes_total
    ),
    'top_productos',       coalesce(v_top_productos, '[]'::json),
    'ventas_recientes',    coalesce(v_ventas_recientes, '[]'::json),
    'productos_stock_bajo', coalesce(v_stock_bajo, '[]'::json),
    'ventas_por_metodo_pago', coalesce(v_ventas_por_metodo, '[]'::json)
  );
end;
$$;

-- crear_venta(): transactional sale creation
create or replace function crear_venta(
  p_cliente_id    integer,
  p_metodo_pago   text,
  p_observaciones text,
  p_items         json,
  p_usuario       text default 'admin'
)
returns json
language plpgsql
security definer
as $$
declare
  v_numero_comprobante text;
  v_last_num           integer;
  v_venta_id           integer;
  v_subtotal           numeric := 0;
  v_impuestos          numeric := 0;
  v_total              numeric := 0;
  v_item               json;
  v_producto           productos%rowtype;
  v_precio_unitario    numeric;
  v_subtotal_linea     numeric;
  v_impuesto_linea     numeric;
  v_total_linea        numeric;
  v_stock_anterior     integer;
  v_stock_posterior    integer;
  v_detalles           json;
  v_saldo_anterior     numeric;
  v_saldo_posterior    numeric;
begin
  -- Generate receipt number
  select coalesce(max(cast(regexp_replace(numero_comprobante, '[^0-9]', '', 'g') as integer)), 0)
  into v_last_num
  from ventas;
  v_numero_comprobante := 'NV-' || lpad((v_last_num + 1)::text, 8, '0');

  -- Validate and compute each item
  for v_item in select * from json_array_elements(p_items)
  loop
    select * into v_producto
    from productos
    where id = (v_item->>'producto_id')::integer and activo = true;

    if not found then
      raise exception 'Producto con ID % no encontrado o inactivo', (v_item->>'producto_id');
    end if;

    if v_producto.stock_actual < (v_item->>'cantidad')::integer then
      raise exception 'Stock insuficiente para "%". Disponible: %, Solicitado: %',
        v_producto.nombre, v_producto.stock_actual, (v_item->>'cantidad')::integer;
    end if;

    v_precio_unitario  := v_producto.precio_venta_neto;
    v_subtotal_linea   := v_precio_unitario * (v_item->>'cantidad')::integer;
    v_impuesto_linea   := v_subtotal_linea * (v_producto.tasa_impuesto / 100);
    v_total_linea      := v_subtotal_linea + v_impuesto_linea;

    v_subtotal  := v_subtotal  + v_subtotal_linea;
    v_impuestos := v_impuestos + v_impuesto_linea;
  end loop;

  v_total := v_subtotal + v_impuestos;

  -- Insert venta
  insert into ventas (numero_comprobante, cliente_id, subtotal, impuestos, total, metodo_pago, estado, observaciones)
  values (v_numero_comprobante, p_cliente_id, v_subtotal, v_impuestos, v_total, p_metodo_pago, 'completada', p_observaciones)
  returning id into v_venta_id;

  -- Insert each line, update stock, create movement
  for v_item in select * from json_array_elements(p_items)
  loop
    select * into v_producto from productos where id = (v_item->>'producto_id')::integer;

    v_precio_unitario  := v_producto.precio_venta_neto;
    v_subtotal_linea   := v_precio_unitario * (v_item->>'cantidad')::integer;
    v_impuesto_linea   := v_subtotal_linea * (v_producto.tasa_impuesto / 100);
    v_total_linea      := v_subtotal_linea + v_impuesto_linea;
    v_stock_anterior   := v_producto.stock_actual;
    v_stock_posterior  := v_stock_anterior - (v_item->>'cantidad')::integer;

    insert into detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal, impuesto, total_linea)
    values (v_venta_id, v_producto.id, (v_item->>'cantidad')::integer, v_precio_unitario, v_subtotal_linea, v_impuesto_linea, v_total_linea);

    update productos
    set stock_actual = v_stock_posterior, updated_at = now()
    where id = v_producto.id;

    insert into movimientos_stock (producto_id, tipo, cantidad, stock_anterior, stock_posterior, motivo, referencia_id, referencia_tipo, usuario)
    values (v_producto.id, 'salida', (v_item->>'cantidad')::integer, v_stock_anterior, v_stock_posterior, 'Venta', v_venta_id, 'venta', p_usuario);
  end loop;

  -- Handle cuenta corriente
  if p_metodo_pago = 'cuenta_corriente' and p_cliente_id is not null then
    select saldo_cuenta_corriente into v_saldo_anterior from clientes where id = p_cliente_id;
    v_saldo_posterior := v_saldo_anterior + v_total;
    update clientes set saldo_cuenta_corriente = v_saldo_posterior where id = p_cliente_id;
    insert into cuenta_corriente (cliente_id, tipo, monto, saldo_anterior, saldo_posterior, descripcion, referencia_id)
    values (p_cliente_id, 'debito', v_total, v_saldo_anterior, v_saldo_posterior, 'Venta ' || v_numero_comprobante, v_venta_id);
  end if;

  -- Return created sale
  select json_build_object(
    'id',                  v_venta_id,
    'numero_comprobante',  v_numero_comprobante,
    'cliente_id',          p_cliente_id,
    'subtotal',            v_subtotal,
    'impuestos',           v_impuestos,
    'total',               v_total,
    'metodo_pago',         p_metodo_pago,
    'estado',              'completada',
    'observaciones',       p_observaciones,
    'detalles', (
      select json_agg(json_build_object(
        'producto_id',      dv.producto_id,
        'producto_nombre',  p.nombre,
        'producto_sku',     p.sku,
        'cantidad',         dv.cantidad,
        'precio_unitario',  dv.precio_unitario,
        'subtotal',         dv.subtotal,
        'impuesto',         dv.impuesto,
        'total_linea',      dv.total_linea
      ))
      from detalle_ventas dv
      join productos p on p.id = dv.producto_id
      where dv.venta_id = v_venta_id
    )
  ) into v_detalles;

  return v_detalles;
end;
$$;

-- anular_venta(): transactional sale cancellation + stock restore
create or replace function anular_venta(
  p_venta_id integer,
  p_usuario  text default 'admin'
)
returns json
language plpgsql
security definer
as $$
declare
  v_venta          ventas%rowtype;
  v_detalle        detalle_ventas%rowtype;
  v_stock_actual   integer;
  v_stock_nuevo    integer;
  v_saldo_anterior numeric;
  v_saldo_posterior numeric;
begin
  select * into v_venta from ventas where id = p_venta_id;
  if not found then
    raise exception 'Venta no encontrada';
  end if;

  -- Restore stock for each line item
  for v_detalle in select * from detalle_ventas where venta_id = p_venta_id
  loop
    select stock_actual into v_stock_actual from productos where id = v_detalle.producto_id;
    v_stock_nuevo := v_stock_actual + v_detalle.cantidad;

    update productos
    set stock_actual = v_stock_nuevo, updated_at = now()
    where id = v_detalle.producto_id;

    insert into movimientos_stock (producto_id, tipo, cantidad, stock_anterior, stock_posterior, motivo, referencia_id, referencia_tipo, usuario)
    values (v_detalle.producto_id, 'entrada', v_detalle.cantidad, v_stock_actual, v_stock_nuevo,
            'Anulación ' || v_venta.numero_comprobante, p_venta_id, 'anulacion_venta', p_usuario);
  end loop;

  -- Reverse cuenta corriente if applicable
  if v_venta.metodo_pago = 'cuenta_corriente' and v_venta.cliente_id is not null then
    select saldo_cuenta_corriente into v_saldo_anterior from clientes where id = v_venta.cliente_id;
    v_saldo_posterior := v_saldo_anterior - v_venta.total;
    update clientes set saldo_cuenta_corriente = v_saldo_posterior where id = v_venta.cliente_id;
    insert into cuenta_corriente (cliente_id, tipo, monto, saldo_anterior, saldo_posterior, descripcion, referencia_id)
    values (v_venta.cliente_id, 'credito', v_venta.total, v_saldo_anterior, v_saldo_posterior,
            'Anulación ' || v_venta.numero_comprobante, p_venta_id);
  end if;

  -- Delete sale (CASCADE removes detalle_ventas)
  delete from ventas where id = p_venta_id;

  return json_build_object('message', 'Venta eliminada y stock restaurado correctamente');
end;
$$;

-- ajustar_stock(): manual stock adjustment
create or replace function ajustar_stock(
  p_producto_id integer,
  p_cantidad    integer,
  p_tipo        text,
  p_motivo      text,
  p_usuario     text default 'admin'
)
returns json
language plpgsql
security definer
as $$
declare
  v_producto       productos%rowtype;
  v_stock_anterior integer;
  v_stock_posterior integer;
  v_tipo_mov       text;
  v_cantidad_abs   integer;
  v_mov_id         integer;
begin
  select * into v_producto from productos where id = p_producto_id and activo = true;
  if not found then
    raise exception 'Producto no encontrado o inactivo';
  end if;

  v_stock_anterior := v_producto.stock_actual;
  v_cantidad_abs   := abs(p_cantidad);

  if p_tipo = 'entrada' then
    v_stock_posterior := v_stock_anterior + v_cantidad_abs;
    v_tipo_mov        := 'entrada';
  elsif p_tipo = 'salida' then
    v_stock_posterior := v_stock_anterior - v_cantidad_abs;
    if v_stock_posterior < 0 then
      raise exception 'El ajuste resultaría en stock negativo';
    end if;
    v_tipo_mov := 'salida';
  else
    v_stock_posterior := v_stock_anterior + p_cantidad;
    if v_stock_posterior < 0 then
      raise exception 'El ajuste resultaría en stock negativo';
    end if;
    v_tipo_mov := 'ajuste';
  end if;

  update productos set stock_actual = v_stock_posterior, updated_at = now() where id = p_producto_id;

  insert into movimientos_stock (producto_id, tipo, cantidad, stock_anterior, stock_posterior, motivo, usuario)
  values (p_producto_id, v_tipo_mov, v_cantidad_abs, v_stock_anterior, v_stock_posterior, p_motivo, p_usuario)
  returning id into v_mov_id;

  return json_build_object(
    'id',               v_mov_id,
    'producto_id',      p_producto_id,
    'producto_nombre',  v_producto.nombre,
    'producto_sku',     v_producto.sku,
    'tipo',             v_tipo_mov,
    'cantidad',         v_cantidad_abs,
    'stock_anterior',   v_stock_anterior,
    'stock_posterior',  v_stock_posterior,
    'motivo',           p_motivo
  );
end;
$$;

-- auto-generate numeric SKU
create or replace function next_sku()
returns text
language plpgsql
security definer
as $$
declare
  v_max integer;
begin
  select coalesce(max(sku::integer), 0)
  into v_max
  from productos
  where sku ~ '^[0-9]+$';
  return (v_max + 1)::text;
end;
$$;

-- ─── Seed Data ───────────────────────────────────────────────
insert into categorias (nombre) values
  ('Almacen'), ('Suplementos'), ('Granel'), ('Otros')
on conflict (nombre) do nothing;

insert into clientes (tipo_documento, numero_documento, razon_social, nombre_fantasia)
values ('CUIT', '30-99999999-9', 'Consumidor Final', 'Consumidor Final')
on conflict (numero_documento) do nothing;
