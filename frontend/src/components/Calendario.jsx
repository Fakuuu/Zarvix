import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const DIAS_CORTO  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_LARGO  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// getDay() devuelve 0=Dom; lo convertimos a 0=Lun
function indiceSemana(fecha) {
  return (fecha.getDay() + 6) % 7;
}

// "HH:MM" - "HH:MM" → minutos de diferencia (nunca negativo)
function parseMinutos(entrada, salida) {
  const toMin = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const diff = toMin(salida) - toMin(entrada);
  return diff > 0 ? diff : 0;
}

function formatHoras(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Extrae "YYYY-MM-DD" de un valor de fecha que llega de la API (ISO string o Date)
function fechaKey(val) {
  return String(val).slice(0, 10);
}

function padDos(n) {
  return String(n).padStart(2, '0');
}

// "HH:MM" → 'Mañana' si antes de las 12, 'Tarde' si a partir de las 12
function etiquetaTurno(horaEntrada) {
  return parseInt(horaEntrada.split(':')[0], 10) < 12 ? 'Mañana' : 'Tarde';
}

export default function Calendario({ empleadoId, anyo, mes, isAdmin, onTurnoClick, reloadKey }) {
  // { 'YYYY-MM-DD': { 1: turnoObj, 2: turnoObj } }
  const [horarios, setHorarios]   = useState({});
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState(null);

  const cargarHorarios = useCallback(async () => {
    if (!empleadoId) return;
    setCargando(true);
    setError(null);
    try {
      const { data } = await client.get(`/api/horarios/${empleadoId}/${anyo}/${mes}`);
      const indexado = {};
      data.forEach((t) => {
        const k = fechaKey(t.fecha);
        if (!indexado[k]) indexado[k] = {};
        indexado[k][t.turnoNum] = t;
      });
      setHorarios(indexado);
    } catch {
      setError('No se pudieron cargar los horarios.');
    } finally {
      setCargando(false);
    }
  }, [empleadoId, anyo, mes, reloadKey]);

  useEffect(() => { cargarHorarios(); }, [cargarHorarios]);

  // ─── Cálculos del calendario ────────────────────────────────────────────────

  const totalDias    = new Date(anyo, mes, 0).getDate();
  const primerDia    = new Date(anyo, mes - 1, 1);
  const offsetInicio = indiceSemana(primerDia);      // celdas vacías al principio

  let totalMinutos = 0;
  Object.values(horarios).forEach((turnos) => {
    Object.values(turnos).forEach((t) => {
      totalMinutos += parseMinutos(t.horaEntrada, t.horaSalida);
    });
  });

  const hoyObj = new Date();
  const esHoy  = (d) =>
    hoyObj.getFullYear() === anyo &&
    hoyObj.getMonth() + 1 === mes &&
    hoyObj.getDate() === d;

  const toKey = (d) => `${anyo}-${padDos(mes)}-${padDos(d)}`;

  // ─── Guardias ───────────────────────────────────────────────────────────────

  if (!empleadoId) {
    return (
      <div className="text-center py-16 text-gray-400">
        Selecciona un empleado para ver su calendario.
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16 text-gray-500">
        Cargando horarios…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        {error}
        <button
          onClick={cargarHorarios}
          className="ml-2 underline text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full">

      {/* Cabecera días de semana — solo en md+ */}
      <div className="hidden md:grid md:grid-cols-7 mb-1">
        {DIAS_CORTO.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-gray-400 uppercase py-2 tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-1">

        {/* Celdas vacías de desplazamiento inicial */}
        {Array.from({ length: offsetInicio }).map((_, i) => (
          <div key={`offset-${i}`} className="hidden md:block" />
        ))}

        {/* Un día por celda */}
        {Array.from({ length: totalDias }, (_, i) => i + 1).map((dia) => {
          const key       = toKey(dia);
          const fecha     = new Date(anyo, mes - 1, dia);
          const diaSemIdx = indiceSemana(fecha);
          const esFDS     = diaSemIdx >= 5;
          const turno1    = horarios[key]?.[1];
          const turno2    = horarios[key]?.[2];
          const hoy       = esHoy(dia);

          return (
            <div
              key={dia}
              className={[
                'min-h-[96px] rounded-lg border p-2 flex flex-col gap-1 transition-colors',
                hoy   ? 'border-green-500 bg-green-50'   : '',
                !hoy && esFDS ? 'bg-gray-50 border-gray-200' : '',
                !hoy && !esFDS ? 'bg-white border-gray-200'  : '',
              ].join(' ')}
            >
              {/* Número y nombre del día */}
              <div className="flex items-baseline gap-1.5">
                <span className={`text-sm font-bold leading-none ${hoy ? 'text-green-600' : 'text-gray-700'}`}>
                  {dia}
                </span>
                {/* Nombre largo en móvil, corto en desktop */}
                <span className="text-xs text-gray-400 md:hidden">
                  {DIAS_LARGO[diaSemIdx]}
                </span>
                <span className="hidden md:inline text-xs text-gray-400">
                  {DIAS_CORTO[diaSemIdx]}
                </span>
              </div>

              {/* ── Turno 1 (verde) ── */}
              {turno1 ? (
                <div
                  role={isAdmin ? 'button' : undefined}
                  tabIndex={isAdmin ? 0 : undefined}
                  onClick={() => isAdmin && onTurnoClick(key, 1, turno1, { 1: turno1, 2: turno2 ?? null })}
                  onKeyDown={(e) => isAdmin && e.key === 'Enter' && onTurnoClick(key, 1, turno1, { 1: turno1, 2: turno2 ?? null })}
                  className={[
                    'rounded px-2 py-1 text-xs bg-green-100 border border-green-300',
                    isAdmin ? 'cursor-pointer hover:bg-green-200 active:opacity-70' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-green-800">
                      {turno1.horaEntrada} – {turno1.horaSalida}
                    </span>
                    <span className="text-[10px] font-medium text-green-700 opacity-70 shrink-0">
                      {etiquetaTurno(turno1.horaEntrada)}
                    </span>
                  </div>
                  {turno1.notas && (
                    <p className="text-green-700 mt-0.5 truncate">{turno1.notas}</p>
                  )}
                </div>
              ) : isAdmin ? (
                <button
                  onClick={() => onTurnoClick(key, 1, null, { 1: null, 2: turno2 ?? null })}
                  className="text-xs text-green-500 hover:text-green-700 hover:bg-green-50 rounded px-1 py-0.5 text-left border border-dashed border-green-300 transition-colors"
                >
                  + Turno 1
                </button>
              ) : null}

              {/* ── Turno 2 (azul) — solo se muestra si turno 1 existe ── */}
              {turno2 ? (
                <div
                  role={isAdmin ? 'button' : undefined}
                  tabIndex={isAdmin ? 0 : undefined}
                  onClick={() => isAdmin && onTurnoClick(key, 2, turno2, { 1: turno1 ?? null, 2: turno2 })}
                  onKeyDown={(e) => isAdmin && e.key === 'Enter' && onTurnoClick(key, 2, turno2, { 1: turno1 ?? null, 2: turno2 })}
                  className={[
                    'rounded px-2 py-1 text-xs bg-blue-100 border border-blue-300',
                    isAdmin ? 'cursor-pointer hover:bg-blue-200 active:opacity-70' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-blue-800">
                      {turno2.horaEntrada} – {turno2.horaSalida}
                    </span>
                    <span className="text-[10px] font-medium text-blue-700 opacity-70 shrink-0">
                      {etiquetaTurno(turno2.horaEntrada)}
                    </span>
                  </div>
                  {turno2.notas && (
                    <p className="text-blue-700 mt-0.5 truncate">{turno2.notas}</p>
                  )}
                </div>
              ) : isAdmin && turno1 ? (
                <button
                  onClick={() => onTurnoClick(key, 2, null, { 1: turno1 ?? null, 2: null })}
                  className="text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded px-1 py-0.5 text-left border border-dashed border-blue-300 transition-colors"
                >
                  + Turno 2
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Total de horas del mes */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end items-center gap-2 text-sm text-gray-600">
        <span>Total horas trabajadas en el mes:</span>
        <span className="font-bold text-gray-900 text-base">
          {totalMinutos > 0 ? formatHoras(totalMinutos) : '—'}
        </span>
      </div>

    </div>
  );
}
