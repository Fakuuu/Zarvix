import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import SelectorEmpleado from '../components/SelectorEmpleado';
import TurnoModal from '../components/TurnoModal';
import NuevoEmpleadoModal from '../components/NuevoEmpleadoModal';
import client from '../api/client';

const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MESES_ES_MIN = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function pad2(n) { return String(n).padStart(2, '0'); }
function toKey(a, m, d) { return `${a}-${pad2(m)}-${pad2(d)}`; }

function parseMin(entrada, salida) {
  const toM = (s) => { const [h, m] = String(s).slice(0, 5).split(':').map(Number); return h * 60 + m; };
  const d = toM(salida) - toM(entrada);
  return d > 0 ? d : 0;
}

function fmtHoras(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── TurnoCard ────────────────────────────────────────────────────────────────

function TurnoCard({ turno, scheme, label, isAdmin, onClick }) {
  const entrada = String(turno.horaEntrada).slice(0, 5);
  const salida  = String(turno.horaSalida).slice(0, 5);
  const mins    = parseMin(entrada, salida);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const durStr  = mins > 0 ? (m === 0 ? `${h}h` : `${h}h ${m}m`) : null;
  const esMañana = parseInt(entrada.split(':')[0], 10) < 12;

  const bg      = scheme === 'green' ? 'bg-green-50 border-green-200'   : 'bg-blue-50 border-blue-200';
  const timeClr = scheme === 'green' ? 'text-green-900'                 : 'text-blue-900';
  const metaClr = scheme === 'green' ? 'text-green-600'                 : 'text-blue-600';
  const dotClr  = scheme === 'green' ? 'bg-green-500'                   : 'bg-blue-500';
  const notesClr= scheme === 'green' ? 'text-green-700'                 : 'text-blue-700';

  return (
    <div
      role={isAdmin ? 'button' : undefined}
      tabIndex={isAdmin ? 0 : undefined}
      onClick={isAdmin ? onClick : undefined}
      onKeyDown={isAdmin ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={[
        'rounded-2xl border px-5 py-4 flex flex-col gap-2',
        bg,
        isAdmin ? 'cursor-pointer active:brightness-95 transition-all' : '',
      ].join(' ')}
    >
      {/* Metainfo row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotClr}`} />
          <span className={`text-xs font-semibold uppercase tracking-wide ${metaClr}`}>{label}</span>
          <span className={`text-xs ${metaClr} opacity-60`}>· {esMañana ? 'Mañana' : 'Tarde'}</span>
        </div>
        <div className="flex items-center gap-2">
          {durStr && <span className={`text-xs font-bold ${metaClr}`}>{durStr}</span>}
          {isAdmin && (
            <svg className={`h-3.5 w-3.5 ${metaClr} opacity-50`} viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.013 2.513a1.75 1.75 0 0 1 2.475 2.474L6.226 12.25a2.751 2.751 0 0 1-.892.58l-2.185.78a.75.75 0 0 1-.96-.96l.78-2.185a2.75 2.75 0 0 1 .58-.892l7.464-7.06Z" />
            </svg>
          )}
        </div>
      </div>

      {/* Hora grande */}
      <div className={`text-3xl font-bold tracking-tight ${timeClr}`}>
        {entrada} → {salida}
      </div>

      {/* Notas */}
      {turno.notas && (
        <p className={`text-sm ${notesClr} opacity-80 leading-snug`}>{turno.notas}</p>
      )}
    </div>
  );
}

// ── CalendarioPage ───────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const { isAdmin } = useAuth();

  const hoyObj  = new Date();
  const HOY_A   = hoyObj.getFullYear();
  const HOY_M   = hoyObj.getMonth() + 1;
  const HOY_D   = hoyObj.getDate();

  const [empleadoId,         setEmpleadoId]         = useState(null);
  const [empleadosReloadKey, setEmpleadosReloadKey] = useState(0);
  const [anyo,               setAnyo]               = useState(HOY_A);
  const [mes,                setMes]                = useState(HOY_M);
  const [dia,                setDia]                = useState(HOY_D);
  const [horarios,           setHorarios]           = useState({});
  const [cargando,           setCargando]           = useState(false);
  const [reloadKey,          setReloadKey]          = useState(0);

  // Animación
  const [animDir,     setAnimDir]     = useState('in-right');
  const [animVersion, setAnimVersion] = useState(0);

  // Modals
  const [modalAbierto,         setModalAbierto]         = useState(false);
  const [modalEmpleadoAbierto, setModalEmpleadoAbierto] = useState(false);
  const [turnoModal,           setTurnoModal]           = useState({
    fecha: '', turnoNum: 1, turnoExistente: null, turnosDelDia: null,
  });

  // Swipe
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const totalDias = new Date(anyo, mes, 0).getDate();

  // ── Carga del mes ────────────────────────────────────────────────────────────

  const cargarHorarios = useCallback(async () => {
    if (!empleadoId) { setHorarios({}); return; }
    setCargando(true);
    try {
      const { data } = await client.get(`/api/horarios/${empleadoId}/${anyo}/${mes}`);
      const idx = {};
      data.forEach((t) => {
        const k = String(t.fecha).slice(0, 10);
        if (!idx[k]) idx[k] = {};
        idx[k][t.turnoNum] = t;
      });
      setHorarios(idx);
    } catch {
      setHorarios({});
    } finally {
      setCargando(false);
    }
  }, [empleadoId, anyo, mes, reloadKey]);

  useEffect(() => { cargarHorarios(); }, [cargarHorarios]);

  // ── Navegación por días ──────────────────────────────────────────────────────

  function irAntes() {
    if (dia <= 1) return;
    setAnimDir('in-left');
    setAnimVersion((v) => v + 1);
    setDia((d) => d - 1);
  }

  function irDespues() {
    if (dia >= totalDias) return;
    setAnimDir('in-right');
    setAnimVersion((v) => v + 1);
    setDia((d) => d + 1);
  }

  // ── Navegación por meses ─────────────────────────────────────────────────────

  function irMesAntes() {
    const a = mes === 1 ? anyo - 1 : anyo;
    const m = mes === 1 ? 12 : mes - 1;
    setAnyo(a); setMes(m);
    setDia(a === HOY_A && m === HOY_M ? HOY_D : 1);
    setAnimVersion((v) => v + 1);
  }

  function irMesDespues() {
    const a = mes === 12 ? anyo + 1 : anyo;
    const m = mes === 12 ? 1 : mes + 1;
    setAnyo(a); setMes(m);
    setDia(a === HOY_A && m === HOY_M ? HOY_D : 1);
    setAnimVersion((v) => v + 1);
  }

  // ── Swipe ────────────────────────────────────────────────────────────────────

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    // Solo activar swipe si el gesto es más horizontal que vertical
    if (Math.abs(dx) > 50 && Math.abs(dx) > dy * 1.5) {
      if (dx > 0) irDespues();
      else irAntes();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  // ── Modal ────────────────────────────────────────────────────────────────────

  function abrirModal(turnoNum, turnoExistente, turnosDelDia) {
    setTurnoModal({ fecha: toKey(anyo, mes, dia), turnoNum, turnoExistente, turnosDelDia });
    setModalAbierto(true);
  }

  function handleSave()   { setModalAbierto(false); setReloadKey((k) => k + 1); }
  function handleDelete() { setModalAbierto(false); setReloadKey((k) => k + 1); }

  // ── Datos del día ────────────────────────────────────────────────────────────

  const fechaKey   = toKey(anyo, mes, dia);
  const turnosDia  = horarios[fechaKey] ?? {};
  const turno1     = turnosDia[1] ?? null;
  const turno2     = turnosDia[2] ?? null;
  const hoyKey     = toKey(HOY_A, HOY_M, HOY_D);
  const esFDS      = (() => { const d = new Date(anyo, mes - 1, dia).getDay(); return d === 0 || d === 6; })();
  const esHoy      = fechaKey === hoyKey;
  const nombreDia  = DIAS_ES[new Date(anyo, mes - 1, dia).getDay()];

  // ── Resumen de horas ─────────────────────────────────────────────────────────

  let minHechos = 0;
  let minTotales = 0;
  Object.entries(horarios).forEach(([k, turnos]) => {
    Object.values(turnos).forEach((t) => {
      const m = parseMin(t.horaEntrada, t.horaSalida);
      minTotales += m;
      if (k <= hoyKey) minHechos += m;
    });
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      {/* Barra de empleado */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <SelectorEmpleado
            empleadoId={empleadoId}
            onEmpleadoChange={setEmpleadoId}
            reloadKey={empleadosReloadKey}
          />
          {isAdmin && (
            <button
              type="button"
              onClick={() => setModalEmpleadoAbierto(true)}
              className="px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 whitespace-nowrap"
            >
              + Nuevo empleado
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4 pb-28 flex flex-col gap-3">

        {/* Indicador de mes con navegación */}
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={irMesAntes}
            aria-label="Mes anterior"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.78 3.22a.75.75 0 0 1 0 1.06L7.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-600 select-none min-w-[140px] text-center">
            {MESES_ES[mes - 1]} {anyo}
          </span>
          <button
            onClick={irMesDespues}
            aria-label="Mes siguiente"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.22 3.22a.75.75 0 0 0 0 1.06L8.94 8 5.22 11.72a.75.75 0 1 0 1.06 1.06l4.25-4.25a.75.75 0 0 0 0-1.06L6.28 3.22a.75.75 0 0 0-1.06 0Z" />
            </svg>
          </button>
        </div>

        {/* Navegador de día (también captura el swipe) */}
        <div
          className={[
            'flex items-center gap-2 bg-white rounded-2xl border px-3 py-3 shadow-sm',
            esHoy ? 'border-green-400 bg-green-50/40' : 'border-gray-200',
          ].join(' ')}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={irAntes}
            disabled={dia <= 1}
            aria-label="Día anterior"
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-20 disabled:pointer-events-none"
          >
            <svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.78 3.22a.75.75 0 0 1 0 1.06L7.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" />
            </svg>
          </button>

          <div className="flex-1 text-center select-none">
            <div className={`text-lg font-bold leading-tight ${esHoy ? 'text-green-600' : esFDS ? 'text-indigo-600' : 'text-gray-900'}`}>
              {nombreDia} {dia}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {MESES_ES_MIN[mes - 1]} {anyo}
              {esHoy && <span className="ml-1.5 text-green-500 font-semibold">· Hoy</span>}
            </div>
          </div>

          <button
            onClick={irDespues}
            disabled={dia >= totalDias}
            aria-label="Día siguiente"
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-20 disabled:pointer-events-none"
          >
            <svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.22 3.22a.75.75 0 0 0 0 1.06L8.94 8 5.22 11.72a.75.75 0 1 0 1.06 1.06l4.25-4.25a.75.75 0 0 0 0-1.06L6.28 3.22a.75.75 0 0 0-1.06 0Z" />
            </svg>
          </button>
        </div>

        {/* Contenido del día */}
        {!empleadoId ? (
          <div className="flex-1 flex items-center justify-center py-16 text-gray-400 text-sm">
            Selecciona un empleado para ver sus turnos.
          </div>
        ) : cargando ? (
          <div className="space-y-3">
            <div className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
            <div className="h-24 rounded-2xl bg-gray-200 animate-pulse opacity-60" />
          </div>
        ) : (
          <div
            key={animVersion}
            className={`space-y-3 slide-${animDir}`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {turno1 && (
              <TurnoCard
                turno={turno1}
                scheme="green"
                label="Turno 1"
                isAdmin={isAdmin}
                onClick={() => abrirModal(1, turno1, { 1: turno1, 2: turno2 })}
              />
            )}

            {turno2 && (
              <TurnoCard
                turno={turno2}
                scheme="blue"
                label="Turno 2"
                isAdmin={isAdmin}
                onClick={() => abrirModal(2, turno2, { 1: turno1, 2: turno2 })}
              />
            )}

            {/* Sin turno */}
            {!turno1 && !turno2 && (
              <div className={[
                'flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border border-dashed',
                esFDS ? 'border-gray-200 bg-gray-50/60' : 'border-gray-200 bg-white',
              ].join(' ')}>
                <span className="text-sm text-gray-400">Sin turno registrado</span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => abrirModal(1, null, { 1: null, 2: null })}
                    className="text-sm font-medium text-green-600 border border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    + Añadir turno
                  </button>
                )}
              </div>
            )}

            {/* Añadir turno 2 si solo existe turno 1 */}
            {turno1 && !turno2 && isAdmin && (
              <button
                type="button"
                onClick={() => abrirModal(2, null, { 1: turno1, 2: null })}
                className="w-full text-sm font-medium text-blue-500 hover:text-blue-700 border border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 py-3 rounded-2xl bg-white transition-colors"
              >
                + Añadir turno 2 (jornada partida)
              </button>
            )}
          </div>
        )}

      </main>

      {/* Botón flotante + (admin) */}
      {isAdmin && empleadoId && (
        <button
          type="button"
          onClick={() => abrirModal(1, turno1, { 1: turno1, 2: turno2 })}
          aria-label={turno1 ? 'Editar turno' : 'Añadir turno'}
          className="fixed bottom-[4.5rem] right-4 z-40 w-14 h-14 rounded-full bg-green-600 text-white shadow-xl hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center"
        >
          {turno1 ? (
            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
            </svg>
          ) : (
            <svg className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          )}
        </button>
      )}

      {/* Barra de resumen de horas (fija abajo) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3">
          {!empleadoId ? (
            <p className="text-center text-xs text-gray-400">Selecciona un empleado</p>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
              <span className="text-gray-500">
                Hechas:{' '}
                <span className="font-semibold text-gray-900">
                  {minHechos > 0 ? fmtHoras(minHechos) : '—'}
                </span>
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">
                Total mes:{' '}
                <span className="font-semibold text-gray-900">
                  {minTotales > 0 ? fmtHoras(minTotales) : '—'}
                </span>
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">
                Pendientes:{' '}
                <span className="font-semibold text-gray-900">
                  {minTotales > minHechos ? fmtHoras(minTotales - minHechos) : '—'}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modal de turno */}
      {isAdmin && (
        <TurnoModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          onSave={handleSave}
          onDelete={handleDelete}
          turnoExistente={turnoModal.turnoExistente}
          turnosDelDia={turnoModal.turnosDelDia}
          fecha={turnoModal.fecha}
          turnoNum={turnoModal.turnoNum}
          empleadoId={empleadoId}
        />
      )}

      {/* Modal de nuevo empleado */}
      {isAdmin && (
        <NuevoEmpleadoModal
          isOpen={modalEmpleadoAbierto}
          onClose={() => setModalEmpleadoAbierto(false)}
          onCreado={() => setEmpleadosReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
