import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { api, formatCurrency, formatDate, formatDateTime } from '../supabaseClient';
import Modal from '../components/Modal';

const emptyForm = { tipo_documento: 'CUIT', numero_documento: '', razon_social: '', contacto: '', email: '', telefono: '', direccion: '' };

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (search) params.q = search;
    api.getProveedores(params)
      .then(setProveedores)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowModal(true);
  };

  const abrirEditar = (p) => {
    setForm({
      tipo_documento: p.tipo_documento || 'CUIT',
      numero_documento: p.numero_documento || '',
      razon_social: p.razon_social || '',
      contacto: p.contacto || '',
      email: p.email || '',
      telefono: p.telefono || '',
      direccion: p.direccion || '',
    });
    setEditId(p.id);
    setShowModal(true);
  };

  const guardar = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = {
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento,
        razon_social: form.razon_social,
        contacto: form.contacto,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
      };
      if (editId) {
        await api.updateProveedor(editId, data);
      } else {
        await api.createProveedor(data);
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
    if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      await api.deleteProveedor(id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">Gestión de proveedores</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={abrirCrear}>
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Buscar por nombre o CUIT..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && cargar()}
            />
          </div>
          <button className="btn-secondary" onClick={cargar}>Buscar</button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
      ) : proveedores.length === 0 ? (
        <div className="card p-12 text-center">
          <Truck size={48} className="text-surface-700 mx-auto mb-3" />
          <p className="text-surface-500">No se encontraron proveedores</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Razón Social</th>
                  <th>CUIT</th>
                  <th>Contacto</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map(p => (
                  <tr key={p.id}>
                    <td className="text-white font-medium">{p.razon_social || '-'}</td>
                    <td className="font-mono text-xs">{p.numero_documento || '-'}</td>
                    <td>{p.contacto || '-'}</td>
                    <td>{p.email || '-'}</td>
                    <td>{p.telefono || '-'}</td>
                    <td>{p.direccion || '-'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-500 hover:text-white transition-colors" onClick={() => abrirEditar(p)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/20 text-surface-500 hover:text-red-400 transition-colors" onClick={() => eliminar(p.id)}>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar Proveedor' : 'Nuevo Proveedor'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Razón Social *</label>
              <input className="input" value={form.razon_social} onChange={e => setForm(p => ({ ...p, razon_social: e.target.value }))} placeholder="Razón social del proveedor" />
            </div>
            <div>
              <label className="label">Persona de Contacto</label>
              <input className="input" value={form.contacto} onChange={e => setForm(p => ({ ...p, contacto: e.target.value }))} placeholder="Nombre de contacto" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo Documento</label>
              <select className="select" value={form.tipo_documento} onChange={e => setForm(p => ({ ...p, tipo_documento: e.target.value }))}>
                <option value="CUIT">CUIT</option>
                <option value="CUIL">CUIL</option>
                <option value="DNI">DNI</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="label">Número Documento</label>
              <input className="input" value={form.numero_documento} onChange={e => setForm(p => ({ ...p, numero_documento: e.target.value }))} placeholder="20-12345678-9" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@ejemplo.com" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="+54 11 1234-5678" />
            </div>
          </div>
          <div>
            <label className="label">Dirección</label>
            <input className="input" value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} placeholder="Calle 123" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={guardar} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {editId ? 'Actualizar' : 'Crear Proveedor'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
