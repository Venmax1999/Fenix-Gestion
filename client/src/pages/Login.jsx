import { useState } from 'react';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Completá email y contraseña');
      return;
    }
    setLoading(true);
    try {
      let finalEmail = email.trim();
      if (!finalEmail.includes('@')) {
        finalEmail = `${finalEmail}@fenix.com`;
      }
      await login(finalEmail, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: '#f0f8fa',
        backgroundImage:
          'radial-gradient(ellipse at 20% 20%, rgba(77,191,212,0.18) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 80% 80%, rgba(26,143,166,0.12) 0%, transparent 55%)',
      }}
    >
      <div className="w-full max-w-sm">

        {/* ── Logo + Brand ── */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-28 h-28 rounded-2xl overflow-hidden mb-4"
            style={{ boxShadow: '0 8px 32px rgba(13,95,110,0.22)' }}
          >
            <img src="/logo.jpg" alt="Fénix Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold tracking-wide" style={{ color: '#0d5f6e' }}>Fénix</h1>
          <p className="text-sm mt-1 font-medium" style={{ color: '#2d7a8a' }}>Almacén de Limpieza · Sistema de Gestión</p>
        </div>

        {/* ── Card ── */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: 'rgba(255,255,255,0.90)',
            border: '1px solid rgba(157,212,222,0.50)',
            boxShadow: '0 4px 24px rgba(13,95,110,0.10)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#0d3d4a' }}>
            Iniciar sesión
          </h2>
          <p className="text-xs mb-6" style={{ color: '#4a8f9e' }}>
            Ingresá tu usuario (o email) y contraseña para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Usuario o Email</label>
              <input
                type="text"
                className="input"
                placeholder="admin o usuario@fenix.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9dd4de' }}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{
                  backgroundColor: 'rgba(185,28,28,0.07)',
                  border: '1px solid rgba(185,28,28,0.22)',
                  color: '#b91c1c',
                }}
              >
                <span className="text-base">⚠️</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Verificando...</>
                : <><LogIn size={18} /> Ingresar</>
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: '#9dd4de' }}>
          Fénix Almacén de Limpieza · Sistema de Gestión v2.0
        </p>
      </div>
    </div>
  );
}
