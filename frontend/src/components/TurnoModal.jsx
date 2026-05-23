import { useState, useEffect } from 'react';
import client from '../api/client';

const NOMBRE_TURNO = { 1: 'Turno 1 (mañana)', 2: 'Turno 2 (tarde)' };

export default function TurnoModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  turnoExistente,
  fecha,
  turnoNum,
  empleadoId,
}) {
  const [horaEntrada,   setHoraEntrada]   = useState('');
  const [horaSalida,    setHoraSalida]    = useState('');
  const [notas,         setNotas]         = useState('');
  const [error,         setError]         = useState('');
  const [guardando,     setGuardando]     = useState(false);
  const [eliminando,    setEliminando]    = useState(false);
  const [confirmarDel,  setConfirmarDel]  = useState(false);

  // Rellena el formulario con los datos existentes al abrir
  useEffect(() => {
    if (isOpen) {
      setHoraEntrada(turnoExistente?.horaEntrada ?? '');
      setHoraSalida(turnoExistente?.horaSalida   ?? '');
      setNotas(turnoExistente?.notas             ?? '');
      setError('');
      setConfirmarDel(false);
    }
  }, [isOpen, turnoExistente]);

  if (!isOpen) return null;

  // ─── Guardar ────────────────────────────────────────────────────────────────

  async function handleGuardar(e) {
    e.preventDefault();
    if (!horaEntrada || !horaSalida) {
      setError('La hora de entrada y salida son obligatorias.');
      return;
    }
    if (horaSalida <= horaEntrada) {
      setError('La hora de salida debe ser posterior a la de entrada.');
      return;
    }

    setGuardando(true);
    setError('');
    try {
      const { data } = await client.post('/api/horarios', {
        empleadoId,
        fecha,
        turnoNum,
        horaEntrada,
        horaSalida,
        notas: notas.trim() || null,
      });
      onSave(data);
      onClose();
    } catch {
      setError('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  // ─── Eliminar ───────────────────────────────────────────────────────────────

  async function handleEliminar() {
    if (!confirmarDel) {
      setConfirmarDel(true);
      return;
    }
    setEliminando(true);
    setError('');
    try {
      await client.delete(`/api/horarios/${turnoExistente.id}`);
      onDelete(turnoExistente.id);
      onClose();
    } catch {
      setError('Error al eliminar. Inténtalo de nuevo.');
    } finally {
      setEliminando(false);
      setConfirmarDel(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const esEdicion = Boolean(turnoExistente);
  const [anyoStr, mesStr, diaStr] = fecha.split('-');
  const fechaLegible = `${diaStr}/${mesStr}/${anyoStr}`;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panel */}
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {esEdicion ? 'Editar turno' : 'Nuevo turno'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {fechaLegible} · {NOMBRE_TURNO[turnoNum]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="px-6 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora entrada <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaEntrada}
                onChange={(e) => { setHoraEntrada(e.target.value); setError(''); }}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora salida <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaSalida}
                onChange={(e) => { setHoraSalida(e.target.value); setError(''); }}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Observaciones, incidencias…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-2 pt-1">

            {/* Eliminar — solo en edición */}
            {esEdicion && (
              <button
                type="button"
                onClick={handleEliminar}
                disabled={eliminando}
                className={[
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  confirmarDel
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border border-red-300 text-red-600 hover:bg-red-50',
                ].join(' ')}
              >
                {eliminando
                  ? 'Eliminando…'
                  : confirmarDel
                    ? '¿Confirmar?'
                    : 'Eliminar'}
              </button>
            )}

            {/* Espaciador */}
            <div className="flex-1" />

            {/* Cancelar */}
            <button
              type="button"
              onClick={onClose}
              disabled={guardando || eliminando}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            {/* Guardar */}
            <button
              type="submit"
              disabled={guardando || eliminando}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>

          </div>

          {/* Aviso de confirmación */}
          {confirmarDel && (
            <p className="text-xs text-red-500 text-right -mt-1">
              Pulsa «¿Confirmar?» de nuevo para eliminar definitivamente.
              <button
                type="button"
                onClick={() => setConfirmarDel(false)}
                className="ml-2 underline"
              >
                Cancelar
              </button>
            </p>
          )}

        </form>
      </div>
    </div>
  );
}
