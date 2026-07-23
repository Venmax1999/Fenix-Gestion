import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { api, formatCurrency, formatDate, formatDateTime } from '../supabaseClient';
import Modal from '../components/Modal';

const emptyForm = { tipo_documento: 'DNI', numero_documento: '', razon_social: '', nombre_fantasia: '', email: '', telefono: '', direccion: '', ciudad: '', provincia: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
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
    api.getClientes(params)
      .then(setClientes)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowModal(true);
  };

  const abrirEditar = (c) => {
    setForm({
      tipo_documento: c.tipo_documento || 'DNI',
      numero_documento: c.numero_documento || '',
      razon_social: c.razon_social || '',
      nombre_fantasia: c.nombre_fantasia || '',
      email: c.email || '',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
      ciudad: c.ciudad || '',
      provincia: c.provincia || '',
    });
    setEditId(c.id);
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
        nombre_fantasia: form.nombre_fantasia,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        ciudad: form.ciudad,
        provincia: form.provincia,
      };
      if (editId) {
        await api.updateCliente(editId, data);
      } else {
        await api.createCliente(data);
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
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      await api.deleteCliente(id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gestión de clientes</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={abrirCrear}>
          <Plus size={18} /> Nuevo Cliente
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
              placeholder="Buscar por nombre, CUIT o documento..."
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
      ) : clientes.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={48} className="text-surface-700 mx-auto mb-3" />
          <p className="text-surface-500">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>CUIT / DNI</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Ciudad</th>
                  <th className="text-right">Saldo CC</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id}>
                    <td className="text-white font-medium">{c.nombre_fantasia || c.razon_social}</td>
                    <td className="font-mono text-xs">{c.numero_documento || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.telefono || '-'}</td>
                    <td>{c.ciudad || '-'}</td>
                    <td className="text-right">
                      <span className={`font-semibold ${(c.saldo_cuenta_corriente || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatCurrency(c.saldo_cuenta_corriente || 0)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-500 hover:text-white transition-colors" onClick={() => abrirEditar(c)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/20 text-surface-500 hover:text-red-400 transition-colors" onClick={() => eliminar(c.id)}>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar Cliente' : 'Nuevo Cliente'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Razón Social *</label>
              <input className="input" value={form.razon_social} onChange={e => setForm(p => ({ ...p, razon_social: e.target.value }))} placeholder="Razón social" />
            </div>
            <div>
              <label className="label">Nombre Fantasía</label>
              <input className="input" value={form.nombre_fantasia} onChange={e => setForm(p => ({ ...p, nombre_fantasia: e.target.value }))} placeholder="Nombre de fantasía" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo Documento</label>
              <select className="select" value={form.tipo_documento} onChange={e => setForm(p => ({ ...p, tipo_documento: e.target.value }))}>
                <option value="DNI">DNI</option>
                <option value="CUIT">CUIT</option>
                <option value="CUIL">CUIL</option>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Ciudad</label>
              <input className="input" value={form.ciudad} onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} placeholder="Ciudad" />
            </div>
            <div>
              <label className="label">Provincia</label>
              <input className="input" value={form.provincia} onChange={e => setForm(p => ({ ...p, provincia: e.target.value }))} placeholder="Provincia" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary flex items-center gap-2" onClick={guardar} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {editId ? 'Actualizar' : 'Crear Cliente'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
