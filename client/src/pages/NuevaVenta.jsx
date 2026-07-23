import { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, Printer, RotateCcw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, formatCurrency, formatDateTime } from '../supabaseClient';

export default function NuevaVenta() {
  const [clientes, setClientes]         = useState([]);
  const [clienteId, setClienteId]       = useState('');
  const [busqueda, setBusqueda]         = useState('');
  const [resultados, setResultados]     = useState([]);
  const [buscando, setBuscando]         = useState(false);
  const [showResults, setShowResults]   = useState(false);
  const [carrito, setCarrito]           = useState([]);
  const [metodoPago, setMetodoPago]     = useState('efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando]         = useState(false);
  const [error, setError]               = useState(null);
  const [comprobante, setComprobante]   = useState(null);
  const searchRef  = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    api.getClientes().then(setClientes).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const buscarProductos = useCallback((term) => {
    if (!term || term.length < 2) { setResultados([]); setShowResults(false); return; }
    setBuscando(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      api.getProductos({ q: term })
        .then(prods => { setResultados(prods); setShowResults(true); })
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false));
    }, 350);
  }, []);

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setBusqueda(v);
    buscarProductos(v);
  };

  const agregarProducto = (prod) => {
    setShowResults(false);
    setBusqueda('');
    const existe = carrito.find(i => i.productoId === prod.id);
    if (existe) {
      setCarrito(prev => prev.map(i =>
        i.productoId === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i
      ));
    } else {
      setCarrito(prev => [...prev, {
        productoId: prod.id,
        nombre: prod.nombre,
        sku: prod.sku,
        precioUnitarioNeto: Number(prod.precio_venta_neto || 0),
        iva: Number(prod.tasa_impuesto || 21),
        cantidad: 1,
        stockActual: prod.stock_actual || 999,
      }]);
    }
  };

  const actualizarCantidad = (productoId, delta) => {
    setCarrito(prev => prev.map(i => {
      if (i.productoId !== productoId) return i;
      const nuevaCant = Math.max(1, i.cantidad + delta);
      return { ...i, cantidad: nuevaCant };
    }));
  };

  const eliminarItem = (productoId) => {
    setCarrito(prev => prev.filter(i => i.productoId !== productoId));
  };

  const calcularItem = (item) => {
    const subtotal   = item.precioUnitarioNeto * item.cantidad;
    const ivaAmount  = subtotal * (item.iva / 100);
    const total      = subtotal + ivaAmount;
    return { subtotal, ivaAmount, total };
  };

  const totales = carrito.reduce((acc, item) => {
    const c = calcularItem(item);
    return { subtotal: acc.subtotal + c.subtotal, iva: acc.iva + c.ivaAmount, total: acc.total + c.total };
  }, { subtotal: 0, iva: 0, total: 0 });

  const confirmarVenta = async () => {
    if (carrito.length === 0) { setError('Agregá al menos un producto'); return; }
    setEnviando(true);
    setError(null);
    try {
      const ventaData = {
        cliente_id:    clienteId ? Number(clienteId) : null,
        metodo_pago:   metodoPago,
        observaciones,
        items: carrito.map(i => ({ producto_id: i.productoId, cantidad: i.cantidad })),
      };
      const result = await api.createVenta(ventaData);
      setComprobante(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const nuevaVenta = () => {
    setCarrito([]); setClienteId(''); setMetodoPago('efectivo');
    setObservaciones(''); setComprobante(null); setError(null);
  };

  // ── Comprobante ───────────────────────────────────────────────────────────
  if (comprobante) {
    const venta = comprobante;
    const items = venta.detalles || [];
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: '#0d7a8a' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#0d3d4a' }}>¡Venta Registrada!</h2>
          <p style={{ color: '#4a8f9e' }}>Comprobante {venta.numero_comprobante} creado exitosamente</p>
        </div>

        <div id="comprobante-print" className="card p-8">
          <div className="pb-4 mb-4" style={{ borderBottom: '1px solid #cef0f8' }}>
            <h3 className="text-xl font-bold" style={{ color: '#0d3d4a' }}>Comprobante de Venta</h3>
            <div className="mt-2 text-sm space-y-1" style={{ color: '#2d7a8a' }}>
              <p>Nota N°: <span className="font-medium" style={{ color: '#0d3d4a' }}>{venta.numero_comprobante}</span></p>
              <p>Fecha: <span className="font-medium" style={{ color: '#0d3d4a' }}>{formatDateTime(venta.fecha || new Date().toISOString())}</span></p>
              <p>Método de Pago: <span className="font-medium capitalize" style={{ color: '#0d3d4a' }}>{venta.metodo_pago}</span></p>
            </div>
          </div>

          <table className="table mb-4">
            <thead><tr><th>Producto</th><th className="text-right">P.Unit.</th><th className="text-right">Cant.</th><th className="text-right">Subtotal</th></tr></thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={{ color: '#0d3d4a', fontWeight: 500 }}>{item.producto_nombre || item.nombre}</td>
                  <td className="text-right">{formatCurrency(item.precio_unitario)}</td>
                  <td className="text-right">{item.cantidad}</td>
                  <td className="text-right font-medium" style={{ color: '#0d3d4a' }}>{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-4 space-y-2" style={{ borderTop: '1px solid #cef0f8' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#4a8f9e' }}>Subtotal</span>
              <span style={{ color: '#0f4a59' }}>{formatCurrency(venta.subtotal || totales.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#4a8f9e' }}>IVA</span>
              <span style={{ color: '#0f4a59' }}>{formatCurrency(venta.impuestos || totales.iva)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold" style={{ borderTop: '1px solid #b8e8f0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ color: '#0d3d4a' }}>TOTAL</span>
              <span style={{ color: '#0d7a8a' }}>{formatCurrency(venta.total)}</span>
            </div>
          </div>

          {venta.observaciones && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #cef0f8' }}>
              <p className="text-sm"><span style={{ color: '#4a8f9e' }}>Observaciones: </span><span style={{ color: '#0f4a59' }}>{venta.observaciones}</span></p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={() => window.print()}><Printer size={18} /> Imprimir</button>
          <button className="btn-primary flex items-center gap-2" onClick={nuevaVenta}><RotateCcw size={18} /> Nueva Venta</button>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Nueva Venta</h1>
        <p className="page-subtitle">Registrar una nueva operación de venta</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Product Search + Cart */}
        <div className="xl:col-span-2 space-y-4">
          {/* Client Selector */}
          <div className="card p-4">
            <label className="label">Cliente (opcional)</label>
            <select className="select" value={clienteId} onChange={e => setClienteId(e.target.value)}>
              <option value="">Consumidor Final</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social} - {c.numero_documento}</option>
              ))}
            </select>
          </div>

          {/* Product Search */}
          <div className="card p-4" ref={searchRef}>
            <label className="label">Buscar Producto</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Buscar por nombre o SKU..."
                value={busqueda}
                onChange={handleSearchChange}
              />
              {buscando && <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 animate-spin" />}
            </div>

            {showResults && resultados.length > 0 && (
              <div className="mt-2 rounded-xl overflow-hidden max-h-60 overflow-y-auto" style={{ backgroundColor: 'white', border: '1px solid #b8e8f0', boxShadow: '0 4px 16px rgba(13,95,110,0.10)' }}>
                {resultados.map(prod => (
                  <button
                    key={prod.id}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                    style={{ borderBottom: '1px solid #dff4f8' }}
                    onClick={() => agregarProducto(prod)}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f0f8fa'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#0d3d4a' }}>{prod.nombre}</p>
                      <p className="text-xs" style={{ color: '#4a8f9e' }}>{prod.sku} • Stock: {prod.stock_actual}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm font-semibold" style={{ color: '#0d7a8a' }}>{formatCurrency(prod.precio_venta_final)}</p>
                      <Plus size={14} style={{ color: '#4a8f9e' }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showResults && resultados.length === 0 && !buscando && busqueda.length >= 2 && (
              <p className="mt-2 text-sm px-1" style={{ color: '#4a8f9e' }}>No se encontraron productos</p>
            )}
          </div>

          {/* Cart Table */}
          <div className="card overflow-hidden">
            {carrito.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingCart size={48} className="mx-auto mb-3" style={{ color: '#b8e8f0' }} />
                <p style={{ color: '#4a8f9e' }}>El carrito está vacío</p>
                <p className="text-sm mt-1" style={{ color: '#6ab3c0' }}>Buscá productos para agregarlos</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="text-right">P.Unitario</th>
                      <th className="text-center">Cant.</th>
                      <th className="text-right">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.map(item => {
                      const c = calcularItem(item);
                      return (
                        <tr key={item.productoId}>
                          <td>
                            <p className="font-medium" style={{ color: '#0d3d4a' }}>{item.nombre}</p>
                            <p className="text-xs" style={{ color: '#4a8f9e' }}>{item.sku}</p>
                          </td>
                          <td className="text-right" style={{ color: '#0f4a59' }}>{formatCurrency(item.precioUnitarioNeto * (1 + item.iva / 100))}</td>
                          <td>
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-1 rounded-lg transition-colors" style={{ color: '#4a8f9e' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#cef0f8'; e.currentTarget.style.color = '#0d3d4a'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#4a8f9e'; }}
                                onClick={() => actualizarCantidad(item.productoId, -1)}>
                                <Minus size={16} />
                              </button>
                              <span className="font-semibold w-8 text-center" style={{ color: '#0d3d4a' }}>{item.cantidad}</span>
                              <button className="p-1 rounded-lg transition-colors" style={{ color: '#4a8f9e' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#cef0f8'; e.currentTarget.style.color = '#0d3d4a'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#4a8f9e'; }}
                                onClick={() => actualizarCantidad(item.productoId, 1)}>
                                <Plus size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="text-right font-semibold" style={{ color: '#0d3d4a' }}>{formatCurrency(c.total)}</td>
                          <td>
                            <button className="p-1.5 rounded-lg transition-colors" style={{ color: '#9dd4de' }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(185,28,28,0.10)'; e.currentTarget.style.color = '#b91c1c'; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9dd4de'; }}
                              onClick={() => eliminarItem(item.productoId)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="card p-5">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#0d3d4a' }}>Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: '#4a8f9e' }}>Subtotal</span>
                <span style={{ color: '#0f4a59' }}>{formatCurrency(totales.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#4a8f9e' }}>IVA</span>
                <span style={{ color: '#0f4a59' }}>{formatCurrency(totales.iva)}</span>
              </div>
              <div className="pt-3 flex justify-between" style={{ borderTop: '1px solid #b8e8f0' }}>
                <span className="text-lg font-bold" style={{ color: '#0d3d4a' }}>TOTAL</span>
                <span className="text-lg font-bold" style={{ color: '#0d7a8a' }}>{formatCurrency(totales.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#2d7a8a' }}>Método de Pago</h3>
            <div className="grid grid-cols-1 gap-2">
              {[{ key: 'efectivo', label: 'Efectivo' }, { key: 'transferencia', label: 'Transferencia' }, { key: 'cuenta_corriente', label: 'Cta. Corriente' }].map(m => (
                <button
                  key={m.key}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={metodoPago === m.key
                    ? { backgroundColor: 'rgba(13,122,138,0.15)', border: '1.5px solid rgba(13,122,138,0.45)', color: '#0d7a8a', fontWeight: 600 }
                    : { backgroundColor: 'white', border: '1px solid #b8e8f0', color: '#2d7a8a' }}
                  onMouseEnter={e => { if (metodoPago !== m.key) { e.currentTarget.style.backgroundColor = '#f0f8fa'; e.currentTarget.style.borderColor = '#9dd4de'; } }}
                  onMouseLeave={e => { if (metodoPago !== m.key) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#b8e8f0'; } }}
                  onClick={() => setMetodoPago(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Observations */}
          <div className="card p-5">
            <label className="label">Observaciones</label>
            <textarea
              className="input resize-none h-20"
              placeholder="Notas sobre la venta..."
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <button
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
            onClick={confirmarVenta}
            disabled={enviando || carrito.length === 0}
          >
            {enviando ? <Loader2 size={20} className="animate-spin" /> : <ShoppingCart size={20} />}
            {enviando ? 'Procesando...' : 'Confirmar Venta'}
          </button>
        </div>
      </div>
    </div>
  );
}
