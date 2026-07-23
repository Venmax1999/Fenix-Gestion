import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { Menu, Loader2 } from 'lucide-react';
// Fénix - Almacén de Limpieza · Sistema de Gestión
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NuevaVenta from './pages/NuevaVenta';
import Ventas from './pages/Ventas';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Proveedores from './pages/Proveedores';
import Kardex from './pages/Kardex';

// ── Protected app shell ───────────────────────────────────────────────────────
function AppShell() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f8fa' }}>
      <Loader2 size={40} className="animate-spin" style={{ color: '#1a8fa6' }} />
    </div>
  );

  if (!user) return <Login />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f0f8fa' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 overflow-auto lg:ml-[260px]">
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          <button
            className="lg:hidden mb-4 p-2 rounded-xl transition-colors"
            style={{ backgroundColor: '#0d5f6e', color: '#f0f8fa' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/nueva-venta"  element={<NuevaVenta />} />
            <Route path="/ventas"       element={<Ventas />} />
            <Route path="/productos"    element={<Productos />} />
            <Route path="/clientes"     element={<Clientes />} />
            <Route path="/proveedores"  element={<Proveedores />} />
            <Route path="/kardex"       element={<Kardex />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
