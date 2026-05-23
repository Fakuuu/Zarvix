import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={{ backgroundColor: '#0D1117' }} className="w-full px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo / nombre */}
        <div className="flex items-center gap-2">
          <span className="text-green-500 font-bold text-xl tracking-tight select-none">
            Zarvix
          </span>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <>
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-widest text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
                Admin
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-white bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              Acceso Admin
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
