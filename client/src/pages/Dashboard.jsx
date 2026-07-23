import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Activity, AlertTriangle, Loader2 } from 'lucide-react';
import { api, formatCurrency } from '../supabaseClient';
import StatsCard from '../components/StatsCard';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 size={40} className="animate-spin text-primary-500" />
    </div>
  );

  if (error) return (
    <div className="card p-8 text-center">
      <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2" style={{ color: '#0d3d4a' }}>Error al cargar el dashboard</h2>
      <p className="text-surface-400">{error}</p>
      <button className="btn-primary mt-4" onClick={() => window.location.reload()}>Reintentar</button>
    </div>
  );

  const ventasMes = data?.ventas_mes || { cantidad: 0, total: 0 };
  const ventasHoy = data?.ventas_hoy || { cantidad: 0, total: 0 };
  const resumen = data?.resumen || {};
  const topProductos = data?.top_productos || [];
  const alertasStock = data?.productos_stock_bajo || [];
  const ticketPromedio = ventasMes.cantidad > 0 ? ventasMes.total / ventasMes.cantidad : 0;
  const maxVendido = topProductos.length > 0 ? Math.max(...topProductos.map(p => p.total_vendido || 0)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general de tu negocio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas del Mes"
          value={formatCurrency(ventasMes.total)}
          subtitle="Total facturado este mes"
          icon={<DollarSign size={24} />}
          color="emerald"
        />
        <StatsCard
          title="Operaciones"
          value={ventasMes.cantidad}
          subtitle="Ventas realizadas este mes"
          icon={<ShoppingBag size={24} />}
          color="blue"
        />
        <StatsCard
          title="Ticket Promedio"
          value={formatCurrency(ticketPromedio)}
          subtitle="Promedio por venta"
          icon={<TrendingUp size={24} />}
          color="primary"
        />
        <StatsCard
          title="Ventas Hoy"
          value={formatCurrency(ventasHoy.total)}
          subtitle="Facturado hoy"
          icon={<Activity size={24} />}
          color="amber"
        />
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0d3d4a' }}>Productos Más Vendidos</h3>
          {topProductos.length === 0 ? (
            <p className="text-surface-500 text-sm">No hay datos de ventas disponibles</p>
          ) : (
            <div className="space-y-3">
              {topProductos.map((p, i) => {
                const cantidad = p.total_vendido || 0;
                const pct = maxVendido > 0 ? (cantidad / maxVendido) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="truncate mr-2" style={{ color: '#0f4a59' }}>{p.nombre}</span>
                      <span className="font-medium flex-shrink-0" style={{ color: '#2d7a8a' }}>{cantidad} uds</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ backgroundColor: '#cef0f8' }}>
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0d7a8a, #4dbfd4)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats & Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0d3d4a' }}>Acciones Rápidas</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#dff4f8' }}>
              <span style={{ color: '#2d7a8a' }}>Total Productos</span>
              <span className="font-semibold" style={{ color: '#0d3d4a' }}>{resumen.total_productos || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#dff4f8' }}>
              <span style={{ color: '#2d7a8a' }}>Total Clientes</span>
              <span className="font-semibold" style={{ color: '#0d3d4a' }}>{resumen.total_clientes || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#dff4f8' }}>
              <span style={{ color: '#2d7a8a' }}>Productos con Stock Bajo</span>
              <span className="font-semibold" style={{ color: '#b45309' }}>{resumen.stock_critico || 0}</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <a href="/nueva-venta" className="btn-primary text-center text-sm">Nueva Venta</a>
            <a href="/productos" className="btn-secondary text-center text-sm">Ver Productos</a>
          </div>
        </div>
      </div>

      {/* Stock Alerts */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-amber-400" />
          <h3 className="text-lg font-semibold" style={{ color: '#0d3d4a' }}>Alertas de Stock Crítico</h3>
        </div>
        {alertasStock.length === 0 ? (
          <p className="text-surface-500 text-sm">No hay productos con stock crítico. ¡Todo en orden!</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {alertasStock.map((p, i) => (
                  <tr key={i}>
                    <td className="font-mono text-xs">{p.sku}</td>
                    <td className="font-medium" style={{ color: '#0d3d4a' }}>{p.nombre}</td>
                    <td className="font-semibold">
                      <span className={p.stock_actual === 0 ? 'text-red-400' : 'text-amber-400'}>
                        {p.stock_actual}
                      </span>
                    </td>
                    <td>{p.stock_minimo}</td>
                    <td>
                      {p.stock_actual === 0
                        ? <span className="badge-danger">Sin Stock</span>
                        : <span className="badge-warning">Stock Bajo</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
