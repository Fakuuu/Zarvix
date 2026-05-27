import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import SelectorEmpleado from '../components/SelectorEmpleado';
import TurnoModal from '../components/TurnoModal';
import NuevoEmpleadoModal from '../components/NuevoEmpleadoModal';
import CalendarioMensual from '../components/CalendarioMensual';
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

// ── Exportar ─────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function lunesDeHoy() {
  const hoy = new Date();
  const dow = hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (dow === 0 ? 6 : dow - 1));
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function semanaDesdeLunes(lunes) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}

function formatDiaExport(d, idxSemana, horarios) {
  const nombre = DIAS_SEMANA[idxSemana];
  const key    = toKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const t1     = horarios[key]?.[1] ?? null;
  const t2     = horarios[key]?.[2] ?? null;

  if (!t1 && !t2) return `${nombre}: ${idxSemana === 6 ? '*FIESTA*' : '*LIBRE*'}`;

  const e1 = String(t1.horaEntrada).slice(0, 5);
  const s1 = String(t1.horaSalida).slice(0, 5);
  if (t2) {
    const e2 = String(t2.horaEntrada).slice(0, 5);
    const s2 = String(t2.horaSalida).slice(0, 5);
    return `${nombre}: ${e1}-${s1} a ${e2}-${s2}`;
  }
  return `${nombre}: ${e1}-${s1}`;
}

function bloquesSemana(semanas, horarios) {
  const fd = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
  return semanas.map((dias) => {
    const cabecera = `*${fd(dias[0])}-${fd(dias[6])}*`;
    const lineas   = dias.map((d, i) => formatDiaExport(d, i, horarios));
    return [cabecera, ...lineas].join('\n');
  });
}

function generarMensajeSemana(horarios) {
  return bloquesSemana([semanaDesdeLunes(lunesDeHoy())], horarios)[0];
}

function generarMensajeMes(horarios, anyo, mes) {
  // Último día del mes → domingo de esa semana = límite final
  const ultimoDia = new Date(anyo, mes, 0);
  const dowUlt    = ultimoDia.getDay();
  const ultimoDom = new Date(ultimoDia);
  ultimoDom.setDate(ultimoDia.getDate() + (dowUlt === 0 ? 0 : 7 - dowUlt));
  ultimoDom.setHours(0, 0, 0, 0);

  const semanas = [];
  let lunes = lunesDeHoy();
  while (lunes <= ultimoDom) {
    semanas.push(semanaDesdeLunes(lunes));
    const siguiente = new Date(lunes);
    siguiente.setDate(lunes.getDate() + 7);
    lunes = siguiente;
  }
  return bloquesSemana(semanas, horarios).join('\n\n');
}

// ── Hook de animación para modales ───────────────────────────────────────────

function useModalAnim(isOpen, duration = 300) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), duration);
      return () => clearTimeout(t);
    }
  }, [isOpen, duration]);

  return { mounted, visible };
}

// ── Helpers rango personalizado ───────────────────────────────────────────────

function lunesDe(fecha) {
  const d = new Date(fecha); d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function domingoDe(fecha) {
  const d = new Date(fecha); d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? 0 : 7 - dow));
  return d;
}

function toInputDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseInputDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function generarMensajeRango(horarios, inicioDate, finDate) {
  const semanas = [];
  let lunes = lunesDe(inicioDate);
  const domingo = domingoDe(finDate);
  while (lunes <= domingo) {
    semanas.push(semanaDesdeLunes(lunes));
    const sig = new Date(lunes);
    sig.setDate(sig.getDate() + 7);
    lunes = sig;
  }
  return bloquesSemana(semanas, horarios).join('\n\n');
}

async function fetchHorariosRango(empleadoId, inicioDate, finDate) {
  const meses = [];
  const cursor = new Date(inicioDate.getFullYear(), inicioDate.getMonth(), 1);
  const finMes = new Date(finDate.getFullYear(), finDate.getMonth(), 1);
  while (cursor <= finMes) {
    meses.push({ a: cursor.getFullYear(), m: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const resultados = await Promise.all(
    meses.map(({ a, m }) => client.get(`/api/horarios/${empleadoId}/${a}/${m}`).then((r) => r.data))
  );
  const idx = {};
  resultados.flat().forEach((t) => {
    const k = String(t.fecha).slice(0, 10);
    if (!idx[k]) idx[k] = {};
    idx[k][t.turnoNum] = t;
  });
  return idx;
}

// ── RangoModal ────────────────────────────────────────────────────────────────

function RangoModal({ isOpen, empleadoId, onGenerar, onClose }) {
  const { mounted, visible } = useModalAnim(isOpen);
  if (!mounted) return null;
  const hoy = new Date();
  const [inicio,   setInicio]   = useState(toInputDate(lunesDe(hoy)));
  const [fin,      setFin]      = useState(toInputDate(domingoDe(hoy)));
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  const inicioDate  = parseInputDate(inicio);
  const finDate     = parseInputDate(fin);
  const lunesReal   = lunesDe(inicioDate);
  const domingoReal = domingoDe(finDate);
  const invalido    = lunesReal > domingoReal;
  const ajustado    = toInputDate(inicioDate) !== toInputDate(lunesReal) ||
                      toInputDate(finDate)    !== toInputDate(domingoReal);

  const fmtDia = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

  async function handleGenerar() {
    if (invalido) return;
    setCargando(true);
    setError('');
    try {
      const hrs = await fetchHorariosRango(empleadoId, lunesReal, domingoReal);
      const inicioKey = toKey(lunesReal.getFullYear(), lunesReal.getMonth() + 1, lunesReal.getDate());
      const finKey    = toKey(domingoReal.getFullYear(), domingoReal.getMonth() + 1, domingoReal.getDate());
      const hayTurnos = Object.entries(hrs).some(
        ([k, t]) => k >= inicioKey && k <= finKey && Object.keys(t).length > 0
      );
      const mensaje = generarMensajeRango(hrs, lunesReal, domingoReal);
      onGenerar(mensaje, !hayTurnos);
    } catch {
      setError('Error al cargar los turnos. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay${visible ? ' modal-open' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl bg-white shadow-xl flex flex-col modal-panel${visible ? ' modal-open' : ''}`}>

        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Rango personalizado</h2>
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
        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Fecha inicio
            </label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Fecha fin
            </label>
            <input
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-colors"
            />
          </div>

          {/* Info / aviso de ajuste */}
          {!invalido && (
            <div className={[
              'rounded-xl px-3.5 py-2.5 text-xs leading-snug',
              ajustado
                ? 'bg-amber-50 border border-amber-200 text-amber-700'
                : 'bg-gray-50 border border-gray-200 text-gray-500',
            ].join(' ')}>
              {ajustado ? (
                <>
                  <span className="font-semibold">Ajustado a semanas completas:</span>
                  {' '}{fmtDia(lunesReal)} → {fmtDia(domingoReal)}
                </>
              ) : (
                <>
                  Se exportará del{' '}
                  <span className="font-semibold">{fmtDia(lunesReal)}</span>
                  {' '}al{' '}
                  <span className="font-semibold">{fmtDia(domingoReal)}</span>
                </>
              )}
            </div>
          )}

          {invalido && (
            <p className="text-xs text-red-500 font-medium">
              La fecha de fin debe ser igual o posterior a la de inicio.
            </p>
          )}

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>

        {/* Pie */}
        <div className="px-5 pb-5 pt-1 flex gap-2 justify-end border-t border-gray-100">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerar}
            disabled={invalido || cargando}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
          >
            {cargando && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {cargando ? 'Cargando…' : 'Generar'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── ExportModal ───────────────────────────────────────────────────────────────

function ExportModal({ isOpen, titulo, mensaje, advertencia, onClose }) {
  const { mounted, visible } = useModalAnim(isOpen);
  const [copiado, setCopiado] = useState(false);
  if (!mounted) return null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* silent */ }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay${visible ? ' modal-open' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-white shadow-xl flex flex-col max-h-[85vh] modal-panel${visible ? ' modal-open' : ''}`}>

        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{titulo}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Listo para copiar y pegar en WhatsApp</p>
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

        {/* Mensaje — desplazable */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
          {advertencia && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-700 shrink-0">
              No hay turnos registrados en este rango. El mensaje muestra todos los días como libres.
            </div>
          )}
          <pre className="text-sm text-gray-800 bg-gray-50 rounded-xl border border-gray-200 px-4 py-4 whitespace-pre-wrap font-sans leading-relaxed select-all">
            {mensaje}
          </pre>
        </div>

        {/* Pie */}
        <div className="shrink-0 px-5 pb-5 pt-3 flex gap-2 justify-end border-t border-gray-100">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={copiar}
            className={[
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              copiado
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-green-600 text-white hover:bg-green-700',
            ].join(' ')}
          >
            {copiado ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>

      </div>
    </div>
  );
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
  const [vistaActual,        setVistaActual]        = useState('dia');

  // Transición entre días (push)
  const [dayTrans, setDayTrans] = useState({ active: false, fromDia: HOY_D, toDia: HOY_D, dir: 'forward' });
  const dayTransTimer = useRef(null);

  // Modals
  const [modalAbierto,         setModalAbierto]         = useState(false);
  const [modalEmpleadoAbierto, setModalEmpleadoAbierto] = useState(false);
  const [exportModalAbierto,   setExportModalAbierto]   = useState(false);
  const [exportData,           setExportData]           = useState({ titulo: '', mensaje: '', advertencia: false });
  const [exportMenuAbierto,    setExportMenuAbierto]    = useState(false);
  const [rangoModalAbierto,    setRangoModalAbierto]    = useState(false);
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
    if (dia <= 1 || dayTrans.active) return;
    const newDia = dia - 1;
    setDia(newDia);
    setDayTrans({ active: true, fromDia: dia, toDia: newDia, dir: 'backward' });
    clearTimeout(dayTransTimer.current);
    dayTransTimer.current = setTimeout(
      () => setDayTrans((s) => ({ ...s, active: false })), 250
    );
  }

  function irDespues() {
    if (dia >= totalDias || dayTrans.active) return;
    const newDia = dia + 1;
    setDia(newDia);
    setDayTrans({ active: true, fromDia: dia, toDia: newDia, dir: 'forward' });
    clearTimeout(dayTransTimer.current);
    dayTransTimer.current = setTimeout(
      () => setDayTrans((s) => ({ ...s, active: false })), 250
    );
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

  function irADia(a, m, d) {
    setAnyo(a); setMes(m); setDia(d);
    setVistaActual('dia');
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

  function handleExportar(tipo) {
    setExportMenuAbierto(false);
    if (tipo === 'rango') {
      setRangoModalAbierto(true);
      return;
    }
    const titulo  = tipo === 'mes' ? 'Exportar mes' : 'Exportar semana';
    const mensaje = tipo === 'mes'
      ? generarMensajeMes(horarios, anyo, mes)
      : generarMensajeSemana(horarios);
    setExportData({ titulo, mensaje, advertencia: false });
    setExportModalAbierto(true);
  }

  function handleRangoGenerado(mensaje, advertencia) {
    setRangoModalAbierto(false);
    setExportData({ titulo: 'Rango personalizado', mensaje, advertencia });
    setExportModalAbierto(true);
  }

  // ── Render de tarjetas del día (reutilizado en transición push) ─────────────

  function renderCards(d, interactive) {
    const key    = toKey(anyo, mes, d);
    const turnos = horarios[key] ?? {};
    const t1     = turnos[1] ?? null;
    const t2     = turnos[2] ?? null;
    const esFDSd = (() => { const dow = new Date(anyo, mes - 1, d).getDay(); return dow === 0 || dow === 6; })();

    return (
      <div className="space-y-3">
        {t1 && (
          <TurnoCard
            turno={t1} scheme="green" label="Turno 1"
            isAdmin={isAdmin && interactive}
            onClick={() => interactive && abrirModal(1, t1, { 1: t1, 2: t2 })}
          />
        )}
        {t2 && (
          <TurnoCard
            turno={t2} scheme="blue" label="Turno 2"
            isAdmin={isAdmin && interactive}
            onClick={() => interactive && abrirModal(2, t2, { 1: t1, 2: t2 })}
          />
        )}
        {!t1 && !t2 && (
          <div className={[
            'flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border border-dashed',
            esFDSd ? 'border-gray-200 bg-gray-50/60' : 'border-gray-200 bg-white',
          ].join(' ')}>
            <span className="text-sm text-gray-400">Sin turno registrado</span>
            {isAdmin && interactive && (
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
        {t1 && !t2 && isAdmin && interactive && (
          <button
            type="button"
            onClick={() => abrirModal(2, null, { 1: t1, 2: null })}
            className="w-full text-sm font-medium text-blue-500 hover:text-blue-700 border border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 py-3 rounded-2xl bg-white transition-colors"
          >
            + Añadir turno 2 (jornada partida)
          </button>
        )}
      </div>
    );
  }

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
          {empleadoId && (
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setExportMenuAbierto((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors whitespace-nowrap"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.474l6.733-3.366A2.519 2.519 0 0 1 13 4.5Z" />
                </svg>
                Exportar
                <svg className={`h-3.5 w-3.5 transition-transform ${exportMenuAbierto ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>

              {exportMenuAbierto && (
                <>
                  {/* Overlay para cerrar al hacer clic fuera */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setExportMenuAbierto(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleExportar('semana')}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Esta semana
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => handleExportar('mes')}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Este mes
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => handleExportar('rango')}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Rango personalizado
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4 pb-28 flex flex-col gap-3">

        {/* Indicador de mes con navegación y toggle de vista */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={irMesAntes}
              aria-label="Mes anterior"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10.78 3.22a.75.75 0 0 1 0 1.06L7.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-600 select-none min-w-[130px] text-center">
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
          <button
            type="button"
            onClick={() => setVistaActual((v) => v === 'dia' ? 'mes' : 'dia')}
            className="text-sm font-medium text-green-700 border border-green-300 bg-white hover:bg-green-50 hover:border-green-500 px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
          >
            {vistaActual === 'dia' ? 'Ver mes' : 'Ver día'}
          </button>
        </div>

        {/* Vista mensual o diaria */}
        {vistaActual === 'mes' ? (
          <div key="mes" className="fade-in">
            {!empleadoId ? (
              <div className="flex-1 flex items-center justify-center py-16 text-gray-400 text-sm">
                Selecciona un empleado para ver sus turnos.
              </div>
            ) : (
              <CalendarioMensual
                anyo={anyo}
                mes={mes}
                horarios={horarios}
                onDiaClick={irADia}
              />
            )}
          </div>
        ) : (
          <div key="dia">
            {/* Navegador de día (también captura el swipe) */}
            <div
              className={[
                'flex items-center gap-2 bg-white rounded-2xl border px-3 py-3 shadow-sm mb-3',
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
            ) : dayTrans.active ? (
              /* Transición push: dos slots simultáneos */
              <div className="relative overflow-hidden">
                <div
                  className={`absolute inset-0 pointer-events-none ${dayTrans.dir === 'forward' ? 'slide-exit-left' : 'slide-exit-right'}`}
                  aria-hidden="true"
                >
                  {renderCards(dayTrans.fromDia, false)}
                </div>
                <div
                  className={dayTrans.dir === 'forward' ? 'slide-enter-right' : 'slide-enter-left'}
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                >
                  {renderCards(dayTrans.toDia, true)}
                </div>
              </div>
            ) : (
              <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                {renderCards(dia, true)}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Botón flotante + (admin) */}
      {isAdmin && empleadoId && (
        <button
          key={empleadoId}
          type="button"
          onClick={() => abrirModal(1, turno1, { 1: turno1, 2: turno2 })}
          aria-label={turno1 ? 'Editar turno' : 'Añadir turno'}
          className="fixed bottom-[4.5rem] right-4 z-40 w-14 h-14 rounded-full bg-green-600 text-white shadow-xl hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center fab-appear"
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

      {/* Modal de rango personalizado */}
      <RangoModal
        isOpen={rangoModalAbierto}
        empleadoId={empleadoId}
        onGenerar={handleRangoGenerado}
        onClose={() => setRangoModalAbierto(false)}
      />

      {/* Modal de exportar */}
      <ExportModal
        isOpen={exportModalAbierto}
        titulo={exportData.titulo}
        mensaje={exportData.mensaje}
        advertencia={exportData.advertencia}
        onClose={() => setExportModalAbierto(false)}
      />
    </div>
  );
}
