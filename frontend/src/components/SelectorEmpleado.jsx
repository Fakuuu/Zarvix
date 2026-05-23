import { useState, useEffect } from 'react';
import client from '../api/client';

export default function SelectorEmpleado({ empleadoId, onEmpleadoChange }) {
  const [empleados, setEmpleados] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    client.get('/api/empleados')
      .then(({ data }) => {
        setEmpleados(data);
        // Selecciona el primero automáticamente si no hay ninguno elegido
        if (data.length > 0 && !empleadoId) {
          onEmpleadoChange(data[0].id);
        }
      })
      .catch(() => setError('No se pudieron cargar los empleados.'))
      .finally(() => setCargando(false));
  // Solo al montar; el padre controla empleadoId después
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando) {
    return (
      <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200" />
    );
  }

  if (error) {
    return (
      <span className="text-sm text-red-500">{error}</span>
    );
  }

  if (empleados.length === 0) {
    return (
      <span className="text-sm text-gray-400">Sin empleados registrados.</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="selector-empleado" className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Empleado
      </label>
      <select
        id="selector-empleado"
        value={empleadoId ?? ''}
        onChange={(e) => onEmpleadoChange(Number(e.target.value))}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        {empleados.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
