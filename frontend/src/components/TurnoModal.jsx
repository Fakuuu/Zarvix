import { useState, useEffect } from 'react';
import client from '../api/client';
import { useNetwork } from '../context/NetworkContext';

// 08:00 → 22:00 en intervalos de 30 min → 29 slots
const HORAS = (() => {
  const slots = [];
  for (let min = 8 * 60; min <= 22 * 60; min += 30) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
})();

function toHHMM(s) {
  return s ? String(s).slice(0, 5) : null;
}

function duracion(entrada, salida) {
  if (!entrada || !salida) return null;
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const diff = toMin(salida) - toMin(entrada);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function TimeGrid({ entrada, salida, onTap, scheme }) {
  const base = 'rounded-lg py-2.5 text-xs font-medium transition-colors touch-manipulation select-none';
  const def = scheme === 'green'
    ? `${base} bg-white border border-gray-200 text-gray-700 hover:bg-green-50 active:bg-green-100`
    : `${base} bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 active:bg-blue-100`;
  const ent = scheme === 'green'
    ? `${base} bg-green-600 text-white ring-2 ring-green-700 ring-offset-1`
    : `${base} bg-blue-600 text-white ring-2 ring-blue-700 ring-offset-1`;
  const sal = scheme === 'green'
    ? `${base} bg-green-800 text-white ring-2 ring-green-900 ring-offset-1`
    : `${base} bg-blue-800 text-white ring-2 ring-blue-900 ring-offset-1`;
  const rng = scheme === 'green'
    ? `${base} bg-green-100 text-green-800 border border-green-200`
    : `${base} bg-blue-100 text-blue-800 border border-blue-200`;

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {HORAS.map((h) => {
        let cls = def;
        if (h === entrada) cls = ent;
        else if (h === salida) cls = sal;
        else if (entrada && salida && h > entrada && h < salida) cls = rng;
        return (
          <button key={h} type="button" onClick={() => onTap(h)} className={cls}>
            {h}
          </button>
        );
      })}
    </div>
  );
}

function HintBadge({ entrada, salida, label }) {
  if (!entrada) return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      Toca la hora de entrada
    </span>
  );
  if (!salida) return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
      Ahora toca la hora de salida
    </span>
  );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      ✓ {label} completo
    </span>
  );
}

export default function TurnoModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  turnoExistente,
  turnosDelDia = null,
  fecha,
  turnoNum,
  empleadoId,
}) {
  const [entrada1,      setEntrada1]      = useState(null);
  const [salida1,       setSalida1]       = useState(null);
  const [jornadaPartida, setJornadaPartida] = useState(false);
  const [entrada2,      setEntrada2]      = useState(null);
  const [salida2,       setSalida2]       = useState(null);
  const [notas,         setNotas]         = useState('');
  const [error,         setError]         = useState('');
  const [guardando,     setGuardando]     = useState(false);
  const [eliminando,    setEliminando]    = useState(false);
  const [confirmarDel,  setConfirmarDel]  = useState(false);

  // Animación open/close
  const [mounted, setMounted] = useState(false);
  const [opened,  setOpened]  = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Resetear formulario y montar en el mismo ciclo para evitar flash de datos viejos
      setError('');
      setConfirmarDel(false);
      const t1 = turnosDelDia?.[1] ?? (turnoNum === 1 ? turnoExistente : null);
      const t2 = turnosDelDia?.[2] ?? (turnoNum === 2 ? turnoExistente : null);
      setEntrada1(toHHMM(t1?.horaEntrada) ?? null);
      setSalida1(toHHMM(t1?.horaSalida)   ?? null);
      setNotas(t1?.notas ?? '');
      if (t2) {
        setJornadaPartida(true);
        setEntrada2(toHHMM(t2.horaEntrada));
        setSalida2(toHHMM(t2.horaSalida));
      } else {
        setJornadaPartida(turnoNum === 2);
        setEntrada2(null);
        setSalida2(null);
      }
      // Montar y disparar transición en el siguiente frame
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setOpened(true)));
      return () => cancelAnimationFrame(id);
    } else {
      setOpened(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, turnoExistente, turnosDelDia, turnoNum]);

  if (!mounted) return null;

  function tap1(hora) {
    setError('');
    if (!entrada1 || salida1) { setEntrada1(hora); setSalida1(null); }
    else if (hora <= entrada1) { setEntrada1(hora); }
    else { setSalida1(hora); }
  }

  function tap2(hora) {
    setError('');
    if (!entrada2 || salida2) { setEntrada2(hora); setSalida2(null); }
    else if (hora <= entrada2) { setEntrada2(hora); }
    else { setSalida2(hora); }
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setError('');
    if (!online) {
      setError('Sin conexión. Los cambios no se pueden guardar sin internet.');
      return;
    }

    const t1Empty    = !entrada1 && !salida1;
    const t1Complete = Boolean(entrada1 && salida1);
    const t2Complete = Boolean(entrada2 && salida2);

    if (!t1Empty && !t1Complete) {
      setError(`Turno 1 incompleto: falta la hora de ${!entrada1 ? 'entrada' : 'salida'}.`);
      return;
    }
    // El turno 1 es obligatorio solo cuando no hay ya uno guardado o cuando turnoNum===1
    const t1YaGuardado = Boolean(turnosDelDia?.[1] ?? (turnoNum === 1 ? turnoExistente : null));
    if (t1Empty && !t1YaGuardado) {
      setError('El turno 1 es obligatorio.');
      return;
    }
    if (jornadaPartida && !t2Complete) {
      setError(
        (entrada2 || salida2)
          ? `Turno 2 incompleto: falta la hora de ${!entrada2 ? 'entrada' : 'salida'}.`
          : 'Selecciona las horas del turno 2 o desactiva la jornada partida.'
      );
      return;
    }

    setGuardando(true);
    try {
      let savedData = null;

      if (t1Complete) {
        const { data } = await client.post('/api/horarios', {
          empleadoId, fecha, turnoNum: 1,
          horaEntrada: entrada1, horaSalida: salida1,
          notas: notas.trim() || null,
        });
        savedData = data;
      }

      if (jornadaPartida && t2Complete) {
        const { data } = await client.post('/api/horarios', {
          empleadoId, fecha, turnoNum: 2,
          horaEntrada: entrada2, horaSalida: salida2,
          notas: null,
        });
        if (!savedData) savedData = data;
      }

      onSave(savedData);
      onClose();
    } catch {
      setError('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar() {
    if (!online) {
      setError('Sin conexión. No se puede eliminar sin internet.');
      return;
    }
    if (!confirmarDel) { setConfirmarDel(true); return; }
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

  const { online } = useNetwork();
  const esEdicion   = Boolean(turnoExistente);
  const [ay, am, ad] = fecha ? fecha.split('-') : ['', '', ''];
  const fechaLeg    = ad ? `${ad}/${am}/${ay}` : fecha;
  const dur1        = duracion(entrada1, salida1);
  const dur2        = duracion(entrada2, salida2);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay${opened ? ' modal-open' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleGuardar}
        className={`w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl bg-white shadow-xl max-h-[93vh] flex flex-col modal-panel${opened ? ' modal-open' : ''}`}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {esEdicion ? 'Editar turno' : 'Nuevo turno'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{fechaLeg}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Cuerpo desplazable */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Banner sin conexión */}
          {!online && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              Sin conexión — solo lectura. Conecta para guardar cambios.
            </div>
          )}

          {/* ── Turno 1 ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                  <span className="text-sm font-semibold text-gray-800">Turno 1</span>
                </div>
                <HintBadge entrada={entrada1} salida={salida1} label="Turno 1" />
              </div>
              {(entrada1 || salida1) && (
                <button
                  type="button"
                  onClick={() => { setEntrada1(null); setSalida1(null); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                >
                  Borrar
                </button>
              )}
            </div>
            <TimeGrid entrada={entrada1} salida={salida1} onTap={tap1} scheme="green" />
            {dur1 && (
              <p className="mt-2.5 text-center text-sm font-semibold text-green-700">
                {entrada1} → {salida1} · {dur1}
              </p>
            )}
          </div>

          {/* ── Toggle jornada partida ── */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={jornadaPartida}
              onClick={() => {
                if (jornadaPartida) { setEntrada2(null); setSalida2(null); }
                setJornadaPartida(!jornadaPartida);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${jornadaPartida ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${jornadaPartida ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-gray-700">Jornada partida</span>
          </div>

          {/* ── Turno 2 ── */}
          {jornadaPartida && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-800">Turno 2</span>
                  </div>
                  <HintBadge entrada={entrada2} salida={salida2} label="Turno 2" />
                </div>
                {(entrada2 || salida2) && (
                  <button
                    type="button"
                    onClick={() => { setEntrada2(null); setSalida2(null); }}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                  >
                    Borrar
                  </button>
                )}
              </div>
              <TimeGrid entrada={entrada2} salida={salida2} onTap={tap2} scheme="blue" />
              {dur2 && (
                <p className="mt-2.5 text-center text-sm font-semibold text-blue-700">
                  {entrada2} → {salida2} · {dur2}
                </p>
              )}
            </div>
          )}

          {/* ── Notas ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
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

        </div>

        {/* Pie de página */}
        <div className="shrink-0 border-t border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
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
                {eliminando ? 'Eliminando…' : confirmarDel ? '¿Confirmar?' : 'Eliminar'}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              disabled={guardando || eliminando}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || eliminando}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          {confirmarDel && (
            <p className="text-xs text-red-500 text-right mt-1.5">
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
        </div>

      </form>
    </div>
  );
}
