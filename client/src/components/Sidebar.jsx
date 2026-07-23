import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Receipt, Package, Users, Truck, ClipboardList, X, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/nueva-venta', icon: ShoppingCart, label: 'Nueva Venta' },
  { to: '/ventas', icon: Receipt, label: 'Ventas' },
  { to: '/productos', icon: Package, label: 'Productos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/proveedores', icon: Truck, label: 'Proveedores' },
  { to: '/kardex', icon: ClipboardList, label: 'Kárdex' },
];

// Fénix color palette — dark teal sidebar
const DARK_TEAL  = '#0d4f5e';   // sidebar bg
const CREAM      = '#f0f8fa';   // light text
const LIGHT_BLUE = '#b8e8f0';   // muted text
const SOFT_TEAL  = '#9dd4de';   // borders / icons muted
const TEAL_ACTIVE = '#4dbfd4';  // active highlight

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-[260px] z-50
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{ backgroundColor: DARK_TEAL, borderRight: `1px solid rgba(77,191,212,0.20)` }}
      >
        {/* ─── Logo ─── */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.30)' }}>
              <img src="/logo.jpg" alt="Fénix Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight tracking-wide" style={{ color: CREAM }}>
                Fénix
              </div>
              <div className="text-xs leading-tight" style={{ color: LIGHT_BLUE }}>
                Almacén de Limpieza
              </div>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: SOFT_TEAL }}
            onClick={onToggle}
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(157,212,222,0.50)' }}>
            Menú
          </p>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => { if (isOpen) onToggle(); }}
                style={isActive ? {
                  backgroundColor: 'rgba(77,191,212,0.18)',
                  color: TEAL_ACTIVE,
                  borderLeft: `3px solid ${TEAL_ACTIVE}`,
                  borderRadius: '0.75rem',
                } : {
                  color: LIGHT_BLUE,
                  borderLeft: '3px solid transparent',
                  borderRadius: '0.75rem',
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 block"
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.color = CREAM;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = LIGHT_BLUE;
                  }
                }}
              >
                <Icon size={18} style={{ color: isActive ? TEAL_ACTIVE : SOFT_TEAL, flexShrink: 0 }} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* ─── User + Logout Footer ─── */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(77,191,212,0.20)', border: '1px solid rgba(77,191,212,0.35)' }}>
              <UserCircle size={18} style={{ color: TEAL_ACTIVE }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: CREAM }}>
                {user?.displayName || user?.username}
              </p>
              <p className="text-xs capitalize" style={{ color: 'rgba(157,212,222,0.65)' }}>
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ color: 'rgba(157,212,222,0.70)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(185,28,28,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'rgba(157,212,222,0.70)'; }}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
