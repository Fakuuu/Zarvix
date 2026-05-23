import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [cargando,  setCargando]  = useState(false);

  // Si ya hay sesión activa, redirige directamente al calendario
  useEffect(() => {
    if (isAdmin) navigate('/', { replace: true });
  }, [isAdmin, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) return;

    setCargando(true);
    setError('');
    try {
      await login(password);
      navigate('/', { replace: true });
    } catch {
      setError('Contraseña incorrecta.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <span
            className="text-4xl font-bold tracking-tight text-green-600 select-none"
            style={{ fontVariant: 'small-caps' }}
          >
            Zarvix
          </span>
          <p className="mt-2 text-sm text-gray-500">Gestor de horarios laborales</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-8">
          <h1 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            Acceso administrador
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                autoComplete="current-password"
                autoFocus
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando || !password}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? 'Verificando…' : 'Entrar como Admin'}
            </button>
          </form>
        </div>

        {/* Volver */}
        <p className="mt-4 text-center text-sm text-gray-400">
          <button
            onClick={() => navigate('/')}
            className="hover:text-gray-600 underline transition-colors"
          >
            Volver al calendario
          </button>
        </p>

      </div>
    </div>
  );
}
