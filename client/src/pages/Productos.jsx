import { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { api, formatCurrency, formatDate, formatDateTime } from '../supabaseClient';
import Modal from '../components/Modal';

const emptyForm = { sku: '', nombre: '', descripcion: '', categoria_id: '', costo: '', margen_sugerido: '', precio_venta_final: '', tasa_impuesto: '21', stock_actual: '5', stock_minimo: '2' };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (search) params.q = search;
    if (catFilter) params.categoria_id = catFilter;
    if (stockFilter) params.stock_critico = stockFilter;
    api.getProductos(params)
      .then(setProductos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => { api.getCategorias().then(setCategorias).catch(() => {}); }, []);

  const precioNeto = () => {
    const final = Number(form.precio_venta_final) || 0;
    const iva = Number(form.tasa_impuesto) || 0;
    return final / (1 + (iva / 100));
  };

  const abrirCrear = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowModal(true);
  };

  const abrirEditar = (p) => {
    setForm({
      sku: p.sku || '',
      nombre: p.nombre || '',
      descripcion: p.descripcion || '',
      categoria_id: p.categoria_id?.toString() || '',
      costo: p.costo?.toString() || '',
      precio_venta_final: p.precio_venta_final?.toString() || '',
      tasa_impuesto: p.tasa_impuesto?.toString() || '21',
      stock_actual: p.stock_actual?.toString() || '',
      stock_minimo: p.stock_minimo?.toString() || '',
    });
    setEditId(p.id);
    setShowModal(true);
  };

  const guardar = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!form.nombre) return setError('El nombre es obligatorio');

      const data = {
        sku: form.sku,
        nombre: form.nombre,
        descripcion: form.descripcion,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        costo: Number(form.costo) || 0,
        precio_venta_neto: (Number(form.precio_venta_final) || 0) / (1 + (Number(form.tasa_impuesto) || 21) / 100),
        tasa_impuesto: Number(form.tasa_impuesto) || 21,
        stock_actual: Number(form.stock_actual) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
      };
      if (editId) {
        await api.updateProducto(editId, data);
      } else {
        await api.createProducto(data);
      }
      setShowModal(false);
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.deleteProducto(id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const stockBadge = (p) => {
    if (p.stock_actual === 0) return <span className="badge-danger">Sin Stock</span>;
    if (p.stock_actual <= (p.stock_minimo || 0)) return <span className="badge-warning">Bajo</span>;
    return <span className="badge-success">OK</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">Gestión del catálogo de productos</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={abrirCrear}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Buscar por nombre o SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && cargar()}
              />
            </div>
          </div>
          <select className="select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select className="select" value={stockFilter} onChange={e => { setStockFilter(e.target.value); }}>
            <option value="">Todo el stock</option>
            <option value="1">Stock bajo</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button className="btn-secondary text-sm" onClick={cargar}>Filtrar</button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
      ) : productos.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={48} className="text-surface-700 mx-auto mb-3" />
          <p className="text-surface-500">No se encontraron productos</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-right">P.Compra</th>
                  <th className="text-right">P.Venta</th>
                  <th className="text-right">Stock</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.sku}</td>
                    <td className="text-white font-medium">{p.nombre}</td>
                    <td>{p.categoria_nombre || '-'}</td>
                    <td className="text-right">{formatCurrency(p.costo)}</td>
                    <td className="text-right text-white font-medium">{formatCurrency(p.precio_venta_final)}</td>
                    <td className="text-right font-semibold">{p.stock_actual}</td>
                    <td>{stockBadge(p)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-500 hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); abrirEditar(p); }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/20 text-surface-500 hover:text-red-400 transition-colors" onClick={(e) => { e.stopPropagation(); eliminar(p.id); }}>
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

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">SKU (Opcional)</label>
              <input className="input" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} placeholder="Auto (Ej: 001)" />
            </div>
            <div>
              <label className="label">Nombre *</label>
              <input className="input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del producto" />
            </div>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input resize-none h-20" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción del producto" />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select className="select" value={form.categoria_id} onChange={e => setForm(p => ({ ...p, categoria_id: e.target.value }))}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl" style={{ backgroundColor: '#f0f8fa', border: '1px dashed #b8e8f0' }}>
            <div>
              <label className="label" style={{ color: '#4a8f9e' }}>Margen de Ganancia (%)</label>
              <input className="input bg-white" type="number" step="0.01" value={form.margen_sugerido || ''} onChange={e => setForm(p => ({ ...p, margen_sugerido: e.target.value }))} placeholder="Ej: 30" />
            </div>
            <div className="flex flex-col justify-center">
               <span className="text-xs font-medium mb-1" style={{ color: '#4a8f9e' }}>Precio Sugerido (Costo + Margen)</span>
               <span className="font-bold text-lg" style={{ color: '#0d7a8a' }}>{formatCurrency((parseFloat(form.costo) || 0) * (1 + (parseFloat(form.margen_sugerido) || 0) / 100))}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Costo</label>
              <input className="input" type="number" step="0.01" value={form.costo} onChange={e => setForm(p => ({ ...p, costo: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Precio Venta Final *</label>
              <input className="input" type="number" step="0.01" value={form.precio_venta_final} onChange={e => setForm(p => ({ ...p, precio_venta_final: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label className="label">IVA %</label>
              <select className="select" value={form.tasa_impuesto} onChange={e => setForm(p => ({ ...p, tasa_impuesto: e.target.value }))}>
                <option value="0">0%</option>
                <option value="10.5">10.5%</option>
                <option value="21">21%</option>
                <option value="27">27%</option>
              </select>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
            <span className="text-sm text-surface-400">Precio Neto (sin IVA): </span>
            <span className="text-lg font-bold text-primary-400">{formatCurrency(precioNeto())}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Stock Actual</label>
              <input className="input" type="number" value={form.stock_actual} onChange={e => setForm(p => ({ ...p, stock_actual: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="label">Stock Mínimo</label>
              <input className="input" type="number" value={form.stock_minimo} onChange={e => setForm(p => ({ ...p, stock_minimo: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={guardar} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {editId ? 'Actualizar' : 'Crear Producto'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
