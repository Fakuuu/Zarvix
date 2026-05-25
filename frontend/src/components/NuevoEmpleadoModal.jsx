import { useState, useEffect } from 'react';
import client from '../api/client';

export default function NuevoEmpleadoModal({ isOpen, onClose, onCreado }) {
  const [nombre,   setNombre]   = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (isOpen) {
      setNombre('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const nombreTrim = nombre.trim();
    if (!nombreTrim) return;
    setGuardando(true);
    setError(null);
    try {
      await client.post('/api/empleados', { nombre: nombreTrim });
      onCreado();
      onClose();
    } catch {
      setError('No se pudo crear el empleado.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Nuevo empleado</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="nombre-empleado" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="nombre-empleado"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
              placeholder="Ej. Juan García"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !nombre.trim()}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
