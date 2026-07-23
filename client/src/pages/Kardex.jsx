import { useState, useEffect } from 'react';
import { ClipboardList, Search, Plus, Loader2, AlertTriangle, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
import { api, formatCurrency, formatDate, formatDateTime } from '../supabaseClient';
import Modal from '../components/Modal';

export default function Kardex() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({ producto_id: '', fecha_desde: '', fecha_hasta: '', tipo: '' });
  const [productos, setProductos] = useState([]);
  const [showAjuste, setShowAjuste] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({ producto_id: '', tipo: 'entrada', cantidad: '', motivo: '' });
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (filtros.producto_id) params.producto_id = filtros.producto_id;
    if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
    if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;
    if (filtros.tipo) params.tipo = filtros.tipo;
    api.getMovimientos(params)
      .then(setMovimientos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => {
    api.getProductos().then(setProductos).catch(() => {});
  }, []);

  const tipoBadge = (tipo) => {
    switch (tipo) {
      case 'entrada': return <span className="badge-success flex items-center gap-1"><ArrowDownCircle size={12} /> Entrada</span>;
      case 'salida': return <span className="badge-danger flex items-center gap-1"><ArrowUpCircle size={12} /> Salida</span>;
      case 'venta': return <span className="badge-info flex items-center gap-1"><ArrowUpCircle size={12} /> Venta</span>;
      case 'ajuste': return <span className="badge-warning flex items-center gap-1"><RefreshCw size={12} /> Ajuste</span>;
      case 'ajuste_entrada': return <span className="badge-success flex items-center gap-1"><ArrowDownCircle size={12} /> Ajuste +</span>;
      case 'ajuste_salida': return <span className="badge-danger flex items-center gap-1"><ArrowUpCircle size={12} /> Ajuste -</span>;
      default: return <span className="badge-info">{tipo || 'N/A'}</span>;
    }
  };

  const guardarAjuste = async () => {
    if (!ajusteForm.producto_id || !ajusteForm.cantidad) {
      setError('Completá producto y cantidad');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createAjuste({
        producto_id: Number(ajusteForm.producto_id),
        tipo: ajusteForm.tipo,
        cantidad: Number(ajusteForm.cantidad),
        motivo: ajusteForm.motivo,
      });
      setShowAjuste(false);
      setAjusteForm({ producto_id: '', tipo: 'entrada', cantidad: '', motivo: '' });
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Kardex</h1>
          <p className="page-subtitle">Movimientos de stock e inventario</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAjuste(true)}>
          <Plus size={18} /> Ajuste de Stock
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">Producto</label>
            <select className="select" value={filtros.producto_id} onChange={e => setFiltros(p => ({ ...p, producto_id: e.target.value }))}>
              <option value="">Todos</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Desde</label>
            <input type="date" className="input" value={filtros.fecha_desde} onChange={e => setFiltros(p => ({ ...p, fecha_desde: e.target.value }))} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" className="input" value={filtros.fecha_hasta} onChange={e => setFiltros(p => ({ ...p, fecha_hasta: e.target.value }))} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="select" value={filtros.tipo} onChange={e => setFiltros(p => ({ ...p, tipo: e.target.value }))}>
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="venta">Venta</option>
              <option value="ajuste">Ajuste</option>
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
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
      ) : movimientos.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList size={48} className="text-surface-700 mx-auto mb-3" />
          <p className="text-surface-500">No se encontraron movimientos</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Tipo</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Stock Resultante</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={m.id || i}>
                    <td>{formatDateTime(m.fecha || m.created_at)}</td>
                    <td className="text-white font-medium">{m.producto_nombre || '-'}</td>
                    <td className="font-mono text-xs">{m.producto_sku || '-'}</td>
                    <td>{tipoBadge(m.tipo)}</td>
                    <td className="text-right">
                      <span className={`font-semibold ${
                        m.tipo === 'entrada' || m.tipo === 'ajuste_entrada' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {m.tipo === 'entrada' || m.tipo === 'ajuste_entrada' ? '+' : '-'}{m.cantidad}
                      </span>
                    </td>
                    <td className="text-right text-white font-medium">{m.stock_posterior ?? '-'}</td>
                    <td className="text-surface-400 text-sm max-w-[200px] truncate">{m.motivo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      <Modal isOpen={showAjuste} onClose={() => setShowAjuste(false)} title="Ajuste de Stock" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Producto *</label>
            <select className="select" value={ajusteForm.producto_id} onChange={e => setAjusteForm(p => ({ ...p, producto_id: e.target.value }))}>
              <option value="">Seleccionar producto</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.sku}) - Stock: {p.stock_actual}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tipo de Ajuste *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2 ${
                  ajusteForm.tipo === 'entrada'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-surface-800/50 border-surface-700/50 text-surface-400 hover:bg-surface-800'
                }`}
                onClick={() => setAjusteForm(p => ({ ...p, tipo: 'entrada' }))}
              >
                <ArrowDownCircle size={16} /> Entrada
              </button>
              <button
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2 ${
                  ajusteForm.tipo === 'salida'
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-surface-800/50 border-surface-700/50 text-surface-400 hover:bg-surface-800'
                }`}
                onClick={() => setAjusteForm(p => ({ ...p, tipo: 'salida' }))}
              >
                <ArrowUpCircle size={16} /> Salida
              </button>
            </div>
          </div>
          <div>
            <label className="label">Cantidad *</label>
            <input className="input" type="number" min="1" value={ajusteForm.cantidad} onChange={e => setAjusteForm(p => ({ ...p, cantidad: e.target.value }))} placeholder="0" />
          </div>
          <div>
            <label className="label">Motivo</label>
            <textarea className="input resize-none h-20" value={ajusteForm.motivo} onChange={e => setAjusteForm(p => ({ ...p, motivo: e.target.value }))} placeholder="Motivo del ajuste (ej: Inventario físico, devolución, etc.)" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowAjuste(false)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={guardarAjuste} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Registrar Ajuste
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
