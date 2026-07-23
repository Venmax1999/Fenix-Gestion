import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: window.sessionStorage, // Logs out when the browser tab is closed
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const formatCurrency = (v) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0);

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

// ─── API layer — mirrors the original api.js interface exactly ───────────────
// All functions throw on error so callers can .catch(e => setError(e.message))

async function sbQuery(promise) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}

export const api = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboard: () => sbQuery(supabase.rpc('get_dashboard')),

  // ── Productos ──────────────────────────────────────────────────────────────
  getProductos: async (params = {}) => {
    let q = supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .eq('activo', true)
      .order('nombre');

    if (params.q) {
      q = q.or(`nombre.ilike.%${params.q}%,sku.ilike.%${params.q}%`);
    }
    if (params.categoria_id) {
      q = q.eq('categoria_id', params.categoria_id);
    }
    if (params.stock_critico === '1' || params.stock_critico === true) {
      q = q.lte('stock_actual', supabase.raw('stock_minimo'));
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    // Flatten categoria_nombre to match the original API shape
    return (data || []).map(p => ({
      ...p,
      categoria_nombre: p.categorias?.nombre ?? null,
      categorias: undefined,
    }));
  },

  getProducto: async (id) => {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return { ...data, categoria_nombre: data.categorias?.nombre ?? null, categorias: undefined };
  },

  getCategorias: () => sbQuery(supabase.from('categorias').select('*').order('nombre')),

  createProducto: async (d) => {
    // Auto SKU if not provided
    let sku = d.sku;
    if (!sku) {
      const { data: skuData } = await supabase.rpc('next_sku');
      sku = skuData;
    }
    const precio_venta_final = Number(d.precio_venta_neto || 0) * (1 + Number(d.tasa_impuesto || 21) / 100);
    const payload = { ...d, sku, precio_venta_final };

    const { data, error } = await supabase.from('productos').insert([payload]).select().single();
    if (error) throw new Error(error.message);

    // Register initial stock movement
    if (Number(d.stock_actual) > 0) {
      await supabase.from('movimientos_stock').insert([{
        producto_id: data.id, tipo: 'entrada', cantidad: data.stock_actual,
        stock_anterior: 0, stock_posterior: data.stock_actual, motivo: 'Stock inicial',
      }]);
    }
    return data;
  },

  updateProducto: async (id, d) => {
    const precio_venta_final = Number(d.precio_venta_neto || 0) * (1 + Number(d.tasa_impuesto || 21) / 100);
    const { data, error } = await supabase
      .from('productos')
      .update({ ...d, precio_venta_final, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteProducto: async (id) => {
    const { error } = await supabase.from('productos').update({ activo: false }).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Producto eliminado correctamente' };
  },

  // ── Ventas ─────────────────────────────────────────────────────────────────
  getVentas: async (params = {}) => {
    let q = supabase
      .from('ventas')
      .select('*, clientes(razon_social)')
      .order('fecha', { ascending: false });

    if (params.desde) q = q.gte('fecha', params.desde);
    if (params.hasta) q = q.lte('fecha', params.hasta);
    if (params.cliente_id) q = q.eq('cliente_id', params.cliente_id);
    if (params.estado) q = q.eq('estado', params.estado);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map(v => ({
      ...v,
      cliente_nombre: v.clientes?.razon_social ?? null,
      clientes: undefined,
    }));
  },

  getVenta: async (id) => {
    const { data: venta, error: ve } = await supabase
      .from('ventas')
      .select('*, clientes(razon_social, numero_documento)')
      .eq('id', id)
      .single();
    if (ve) throw new Error(ve.message);

    const { data: detalles, error: de } = await supabase
      .from('detalle_ventas')
      .select('*, productos(nombre, sku)')
      .eq('venta_id', id);
    if (de) throw new Error(de.message);

    return {
      ...venta,
      cliente_nombre: venta.clientes?.razon_social ?? null,
      cliente_documento: venta.clientes?.numero_documento ?? null,
      clientes: undefined,
      detalles: (detalles || []).map(d => ({
        ...d,
        producto_nombre: d.productos?.nombre,
        producto_sku: d.productos?.sku,
        productos: undefined,
      })),
    };
  },

  // Calls the DB function (transactional)
  createVenta: (d) => sbQuery(
    supabase.rpc('crear_venta', {
      p_cliente_id:    d.cliente_id ?? null,
      p_metodo_pago:   d.metodo_pago,
      p_observaciones: d.observaciones ?? null,
      p_items:         d.items,
      p_usuario:       'admin',
    })
  ),

  deleteVenta: (id) => sbQuery(
    supabase.rpc('anular_venta', { p_venta_id: id, p_usuario: 'admin' })
  ),

  // ── Clientes ───────────────────────────────────────────────────────────────
  getClientes: async (params = {}) => {
    let q = supabase.from('clientes').select('*').eq('activo', true).order('razon_social');
    if (params.q) {
      q = q.or(`razon_social.ilike.%${params.q}%,nombre_fantasia.ilike.%${params.q}%,numero_documento.ilike.%${params.q}%`);
    }
    return sbQuery(q);
  },

  getCliente: async (id) => {
    const { data: cliente, error } = await supabase.from('clientes').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    const { data: movimientos } = await supabase
      .from('cuenta_corriente').select('*').eq('cliente_id', id)
      .order('fecha', { ascending: false }).limit(50);
    return { ...cliente, movimientos_cuenta: movimientos || [] };
  },

  createCliente: (d) => sbQuery(supabase.from('clientes').insert([d]).select().single()),

  updateCliente: (id, d) => sbQuery(
    supabase.from('clientes').update(d).eq('id', id).select().single()
  ),

  deleteCliente: async (id) => {
    const { error } = await supabase.from('clientes').update({ activo: false }).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Cliente desactivado correctamente' };
  },

  // ── Proveedores ────────────────────────────────────────────────────────────
  getProveedores: async (params = {}) => {
    let q = supabase.from('proveedores').select('*').eq('activo', true).order('razon_social');
    if (params.q) {
      q = q.or(`razon_social.ilike.%${params.q}%,numero_documento.ilike.%${params.q}%`);
    }
    return sbQuery(q);
  },

  createProveedor: (d) => sbQuery(supabase.from('proveedores').insert([d]).select().single()),

  updateProveedor: (id, d) => sbQuery(
    supabase.from('proveedores').update(d).eq('id', id).select().single()
  ),

  deleteProveedor: async (id) => {
    const { error } = await supabase.from('proveedores').update({ activo: false }).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Proveedor eliminado correctamente' };
  },

  // ── Movimientos (Kardex) ───────────────────────────────────────────────────
  getMovimientos: async (params = {}) => {
    let q = supabase
      .from('movimientos_stock')
      .select('*, productos(nombre, sku)')
      .order('fecha', { ascending: false })
      .limit(Number(params.limit) || 200);

    if (params.producto_id) q = q.eq('producto_id', params.producto_id);
    if (params.tipo) q = q.eq('tipo', params.tipo);
    if (params.fecha_desde) q = q.gte('fecha', params.fecha_desde);
    if (params.fecha_hasta) q = q.lte('fecha', params.fecha_hasta);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map(m => ({
      ...m,
      producto_nombre: m.productos?.nombre,
      producto_sku: m.productos?.sku,
      productos: undefined,
    }));
  },

  createAjuste: (d) => sbQuery(
    supabase.rpc('ajustar_stock', {
      p_producto_id: d.producto_id,
      p_cantidad:    d.cantidad,
      p_tipo:        d.tipo || 'ajuste',
      p_motivo:      d.motivo,
      p_usuario:     'admin',
    })
  ),
};
