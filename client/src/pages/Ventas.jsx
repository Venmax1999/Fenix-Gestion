import { useState, useEffect } from 'react';
import { Receipt, Search, Eye, Trash2, FileText, Loader2, AlertTriangle, X } from 'lucide-react';
import { api, formatCurrency, formatDate, formatDateTime } from '../supabaseClient';
import Modal from '../components/Modal';

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generarPDF(venta) {
  const fecha = new Date(venta.fecha || venta.created_at);
  const fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const filas = (venta.detalles || []).map(d => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #cef0f8;color:#0d3d4a">${d.producto_sku || ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #cef0f8;color:#0d3d4a">${d.producto_nombre || '-'}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #cef0f8;text-align:right;color:#0d3d4a">${d.cantidad}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #cef0f8;text-align:right;color:#0d3d4a">${formatCurrency(d.precio_unitario)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #cef0f8;text-align:right;font-weight:600;color:#0d3d4a">${formatCurrency(d.total_linea || d.precio_unitario * d.cantidad)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nota de Venta ${venta.numero_comprobante}</title>
  <style>
    @page { size: A4; margin: 18mm 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0d3d4a; background: white; font-size: 13px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }

    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #b8e8f0; }
    .brand-name { font-size: 26px; font-weight: 700; color: #0d5f6e; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #4a8f9e; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-badge { background: #0d5f6e; color: white; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; }
    .invoice-num { font-size: 22px; font-weight: 700; color: #0d7a8a; margin-top: 6px; text-align: right; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .info-box { background: #f0f8fa; border: 1px solid #cef0f8; border-radius: 8px; padding: 14px; }
    .info-label { font-size: 10px; color: #4a8f9e; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px; }
    .info-value { font-size: 14px; color: #0d3d4a; font-weight: 500; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #0d5f6e; }
    thead th { padding: 10px 8px; text-align: left; color: white; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    thead th:not(:first-child) { text-align: right; }

    .totals { margin-left: auto; width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; color: #2d7a8a; font-size: 13px; }
    .total-row.final { border-top: 2px solid #b8e8f0; margin-top: 8px; padding-top: 10px; font-size: 18px; font-weight: 700; color: #0d3d4a; }
    .total-row.final span:last-child { color: #0d7a8a; }

    .obs-box { background: #f0f8fa; border: 1px solid #cef0f8; border-radius: 8px; padding: 12px; margin-top: 20px; }
    .obs-label { font-size: 10px; color: #4a8f9e; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px; }

    .footer { margin-top: 36px; text-align: center; font-size: 11px; color: #9dd4de; border-top: 1px solid #cef0f8; padding-top: 14px; }
    .metodo-badge { display: inline-block; background: #cef0f8; color: #0d5f6e; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-name">Raíces</div>
      <div class="brand-sub">Tienda Natural</div>
    </div>
    <div style="text-align:right">
      <div class="invoice-badge">NOTA DE VENTA</div>
      <div class="invoice-num">${venta.numero_comprobante}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Fecha de emisión</div>
      <div class="info-value">${fechaStr}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Cliente</div>
      <div class="info-value">${venta.cliente_nombre || 'Consumidor Final'}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Método de Pago</div>
      <div class="info-value"><span class="metodo-badge">${(venta.metodo_pago || 'efectivo').replace('_', ' ')}</span></div>
    </div>
    <div class="info-box">
      <div class="info-label">Estado</div>
      <div class="info-value" style="color:#0d7a8a;font-weight:700;text-transform:capitalize">${venta.estado || 'completada'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:90px">SKU</th>
        <th>Producto</th>
        <th style="width:70px">Cant.</th>
        <th style="width:120px">P. Unit.</th>
        <th style="width:130px">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${filas}
    </tbody>
  </table>

  <div class="totals">
    ${venta.subtotal != null ? `<div class="total-row"><span>Subtotal (neto)</span><span>${formatCurrency(venta.subtotal)}</span></div>` : ''}
    ${venta.impuestos != null ? `<div class="total-row"><span>IVA (21%)</span><span>${formatCurrency(venta.impuestos)}</span></div>` : ''}
    <div class="total-row final">
      <span>TOTAL</span>
      <span>${formatCurrency(venta.total)}</span>
    </div>
  </div>

  ${venta.observaciones ? `<div class="obs-box"><div class="obs-label">Observaciones</div><div>${venta.observaciones}</div></div>` : ''}

  <div class="footer">
    Raíces Tienda Natural &nbsp;·&nbsp; Nota de Venta · Documento generado el ${new Date().toLocaleDateString('es-AR')}
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(html);
  w.document.close();
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({ fecha_desde: '', fecha_hasta: '', cliente_id: '', estado: '' });
  const [clientes, setClientes] = useState([]);

  // Detail modal
  const [detalle, setDetalle] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);

  // Delete confirmation
  const [ventaAEliminar, setVentaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
    if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;
    if (filtros.cliente_id) params.cliente_id = filtros.cliente_id;
    if (filtros.estado) params.estado = filtros.estado;
    api.getVentas(params)
      .then(setVentas)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => { api.getClientes().then(setClientes).catch(() => {}); }, []);

  const verDetalle = async (id) => {
    try {
      const data = await api.getVenta(id);
      setDetalle(data);
      setShowDetalle(true);
    } catch (e) { setError(e.message); }
  };

  const descargarPDF = async (venta) => {
    // If we already have detalles, use directly; otherwise fetch
    if (venta.detalles) {
      generarPDF(venta);
    } else {
      try {
        const data = await api.getVenta(venta.id);
        generarPDF(data);
      } catch (e) { setError(e.message); }
    }
  };

  const confirmarEliminar = async () => {
    if (!ventaAEliminar) return;
    setEliminando(true);
    try {
      await api.deleteVenta(ventaAEliminar.id);
      setVentaAEliminar(null);
      cargar(); // refresh list
    } catch (e) {
      setError(e.message);
      setVentaAEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const estadoBadge = (estado) => {
    switch (estado) {
      case 'completada': return <span className="badge-success">Completada</span>;
      case 'pendiente':  return <span className="badge-warning">Pendiente</span>;
      case 'anulada':    return <span className="badge-danger">Anulada</span>;
      default: return <span className="badge-info">{estado || 'N/A'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Ventas</h1>
        <p className="page-subtitle">Historial de todas las ventas realizadas</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div><label className="label">Desde</label>
            <input type="date" className="input" value={filtros.fecha_desde} onChange={e => setFiltros(p => ({ ...p, fecha_desde: e.target.value }))} />
          </div>
          <div><label className="label">Hasta</label>
            <input type="date" className="input" value={filtros.fecha_hasta} onChange={e => setFiltros(p => ({ ...p, fecha_hasta: e.target.value }))} />
          </div>
          <div><label className="label">Cliente</label>
            <select className="select" value={filtros.cliente_id} onChange={e => setFiltros(p => ({ ...p, cliente_id: e.target.value }))}>
              <option value="">Todos</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_fantasia || c.razon_social}</option>)}
            </select>
          </div>
          <div><label className="label">Estado</label>
            <select className="select" value={filtros.estado} onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}>
              <option value="">Todos</option>
              <option value="completada">Completada</option>
              <option value="pendiente">Pendiente</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={cargar}>
              <Search size={16} /> Buscar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#b91c1c' }}>
          <AlertTriangle size={16} /> {error}
          <button className="ml-auto" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin" style={{ color: '#6a7a48' }} /></div>
      ) : ventas.length === 0 ? (
        <div className="card p-12 text-center">
          <Receipt size={48} className="mx-auto mb-3" style={{ color: '#9dd4de' }} />
          <p style={{ color: '#4a8f9e' }}>No se encontraron ventas</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Método Pago</th>
                  <th className="text-right">Total</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map(v => (
                  <tr key={v.id}>
                    <td className="font-mono text-xs" style={{ color: '#0d6e7e', fontWeight: 600 }}>
                      {v.numero_comprobante || `#${v.id}`}
                    </td>
                    <td style={{ color: '#2d7a8a' }}>{formatDateTime(v.fecha || v.created_at)}</td>
                    <td style={{ color: '#0d3d4a', fontWeight: 500 }}>{v.cliente_nombre || 'Consumidor Final'}</td>
                    <td className="capitalize" style={{ color: '#2d7a8a' }}>{v.metodo_pago || '-'}</td>
                    <td className="text-right font-semibold" style={{ color: '#0d3d4a' }}>{formatCurrency(v.total)}</td>
                    <td>{estadoBadge(v.estado)}</td>
                    <td>
                      {/* ── 3 action buttons ── */}
                      <div className="flex items-center justify-center gap-1">
                        {/* Ver detalle */}
                        <button
                          title="Ver detalle"
                          onClick={() => verDetalle(v.id)}
                          className="p-1.5 rounded-lg transition-all duration-150"
                          style={{ color: '#1a8fa6' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(26,143,166,0.14)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                        >
                          <Eye size={16} />
                        </button>

                        {/* Descargar PDF */}
                        <button
                          title="Descargar / Imprimir PDF"
                          onClick={() => descargarPDF(v)}
                          className="p-1.5 rounded-lg transition-all duration-150"
                          style={{ color: '#4a8f9e' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(138,106,80,0.14)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                        >
                          <FileText size={16} />
                        </button>

                        {/* Eliminar */}
                        <button
                          title="Eliminar venta"
                          onClick={() => setVentaAEliminar(v)}
                          className="p-1.5 rounded-lg transition-all duration-150"
                          style={{ color: '#b91c1c' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(185,28,28,0.10)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      <Modal isOpen={showDetalle} onClose={() => setShowDetalle(false)}
        title={`Venta ${detalle?.numero_comprobante || '#' + (detalle?.id || '')}`} size="lg">
        {detalle && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="label">Fecha:</span>
                <p style={{ color: '#0d3d4a', fontWeight: 500 }}>{formatDateTime(detalle.fecha || detalle.created_at)}</p>
              </div>
              <div>
                <span className="label">Cliente:</span>
                <p style={{ color: '#0d3d4a', fontWeight: 500 }}>{detalle.cliente_nombre || 'Consumidor Final'}</p>
              </div>
              <div>
                <span className="label">Método de Pago:</span>
                <p className="capitalize" style={{ color: '#0d3d4a', fontWeight: 500 }}>{detalle.metodo_pago || '-'}</p>
              </div>
              <div>
                <span className="label">Estado:</span>
                <p>{estadoBadge(detalle.estado)}</p>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-right">P.Unit.</th>
                    <th className="text-right">Cant.</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(detalle.detalles || []).map((d, i) => (
                    <tr key={i}>
                      <td style={{ color: '#0d3d4a', fontWeight: 500 }}>{d.producto_nombre || '-'}</td>
                      <td className="text-right">{formatCurrency(d.precio_unitario)}</td>
                      <td className="text-right">{d.cantidad}</td>
                      <td className="text-right font-medium" style={{ color: '#0d3d4a' }}>{formatCurrency(d.total_linea || d.precio_unitario * d.cantidad)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 space-y-2" style={{ borderTop: '1px solid #cef0f8' }}>
              {detalle.subtotal != null && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#4a8f9e' }}>Subtotal</span>
                  <span style={{ color: '#0f4a59' }}>{formatCurrency(detalle.subtotal)}</span>
                </div>
              )}
              {detalle.impuestos != null && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#4a8f9e' }}>Impuestos (IVA 21%)</span>
                  <span style={{ color: '#0f4a59' }}>{formatCurrency(detalle.impuestos)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-1" style={{ borderTop: '1px solid #b8e8f0' }}>
                <span style={{ color: '#0d3d4a' }}>Total</span>
                <span style={{ color: '#0d7a8a' }}>{formatCurrency(detalle.total)}</span>
              </div>
            </div>

            {detalle.observaciones && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#dff4f8', border: '1px solid #cef0f8' }}>
                <p className="text-xs mb-1" style={{ color: '#4a8f9e' }}>Observaciones</p>
                <p className="text-sm" style={{ color: '#0d3d4a' }}>{detalle.observaciones}</p>
              </div>
            )}

            {/* PDF button inside modal */}
            <div className="pt-2 flex justify-end">
              <button className="btn-secondary flex items-center gap-2" onClick={() => descargarPDF(detalle)}>
                <FileText size={16} /> Descargar PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      {ventaAEliminar && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(13,95,110,0.4)' }}
            onClick={() => !eliminando && setVentaAEliminar(null)} />
          <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{ backgroundColor: '#faf8f5', border: '1px solid #b8e8f0' }}>
            {/* Icon */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(185,28,28,0.10)', border: '1px solid rgba(185,28,28,0.22)' }}>
              <Trash2 size={26} style={{ color: '#b91c1c' }} />
            </div>
            <h3 className="text-lg font-semibold text-center mb-1" style={{ color: '#0d3d4a' }}>
              ¿Eliminar venta?
            </h3>
            <p className="text-sm text-center mb-1" style={{ color: '#4a8f9e' }}>
              Se eliminará la venta
            </p>
            <p className="text-base font-bold text-center mb-2" style={{ color: '#0d6e7e' }}>
              {ventaAEliminar.numero_comprobante}
            </p>
            <p className="text-xs text-center mb-6" style={{ color: '#b45309', backgroundColor: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.22)', borderRadius: '0.5rem', padding: '8px' }}>
              ⚠️ El stock de los productos será restaurado automáticamente.
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1"
                onClick={() => setVentaAEliminar(null)}
                disabled={eliminando}>
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="flex-1 flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200"
                style={{ backgroundColor: '#b91c1c', color: 'white', padding: '0.625rem 1.25rem', border: 'none', cursor: eliminando ? 'not-allowed' : 'pointer', opacity: eliminando ? 0.7 : 1 }}
              >
                {eliminando ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
