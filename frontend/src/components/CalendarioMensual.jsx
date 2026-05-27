const DIAS_CAB = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function pad2(n) { return String(n).padStart(2, '0'); }
function toKey(a, m, d) { return `${a}-${pad2(m)}-${pad2(d)}`; }

export default function CalendarioMensual({ anyo, mes, horarios, onDiaClick }) {
  const hoy = new Date();
  const HOY_KEY = toKey(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());

  const firstDay = new Date(anyo, mes - 1, 1);
  const dow = firstDay.getDay();
  const offset = dow === 0 ? 6 : dow - 1;

  const diasMes = new Date(anyo, mes, 0).getDate();

  const prevMes = mes === 1 ? 12 : mes - 1;
  const prevAnyo = mes === 1 ? anyo - 1 : anyo;
  const diasPrevMes = new Date(prevAnyo, prevMes, 0).getDate();

  const nextMes = mes === 12 ? 1 : mes + 1;
  const nextAnyo = mes === 12 ? anyo + 1 : anyo;

  const celdas = [];

  for (let i = offset - 1; i >= 0; i--) {
    celdas.push({ d: diasPrevMes - i, m: prevMes, a: prevAnyo, externo: true });
  }
  for (let d = 1; d <= diasMes; d++) {
    celdas.push({ d, m: mes, a: anyo, externo: false });
  }
  const restantes = celdas.length % 7 === 0 ? 0 : 7 - (celdas.length % 7);
  for (let d = 1; d <= restantes; d++) {
    celdas.push({ d, m: nextMes, a: nextAnyo, externo: true });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Cabecera días de la semana */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DIAS_CAB.map((d, i) => (
          <div
            key={d}
            className={[
              'py-2 text-center text-xs font-semibold uppercase tracking-wide select-none',
              i >= 5 ? 'text-indigo-400' : 'text-gray-400',
            ].join(' ')}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Cuadrícula */}
      <div className="grid grid-cols-7">
        {celdas.map((celda, idx) => {
          const key = toKey(celda.a, celda.m, celda.d);
          const turnos = celda.externo ? {} : (horarios[key] ?? {});
          const t1 = turnos[1] ?? null;
          const t2 = turnos[2] ?? null;
          const esHoy = key === HOY_KEY;
          const esFDS = idx % 7 >= 5;
          const esPasado = !celda.externo && key < HOY_KEY;
          const sinTurno = !t1 && !t2;

          const e1 = t1 ? String(t1.horaEntrada).slice(0, 5) : null;
          const s1 = t1 ? String(t1.horaSalida).slice(0, 5) : null;
          const e2 = t2 ? String(t2.horaEntrada).slice(0, 5) : null;
          const s2 = t2 ? String(t2.horaSalida).slice(0, 5) : null;

          return (
            <button
              key={idx}
              type="button"
              disabled={celda.externo}
              onClick={() => onDiaClick(celda.a, celda.m, celda.d)}
              className={[
                'relative flex flex-col items-center justify-start pt-1.5 pb-1 px-0.5 min-h-[4rem]',
                'border-b border-r border-gray-100 overflow-hidden transition-colors',
                celda.externo
                  ? 'cursor-default'
                  : 'active:bg-green-50/60',
                !celda.externo && esFDS ? 'bg-gray-50/70' : '',
                esHoy ? 'ring-2 ring-inset ring-green-500 bg-green-50/30' : '',
              ].join(' ')}
            >
              {/* Número */}
              <span className={[
                'text-sm font-semibold leading-none mb-0.5 select-none',
                celda.externo       ? 'text-gray-300'  :
                esHoy               ? 'text-green-600' :
                esPasado && sinTurno ? 'text-gray-300'  :
                esFDS               ? 'text-indigo-500' :
                'text-gray-800',
              ].join(' ')}>
                {celda.d}
              </span>

              {/* Horas de turno */}
              {t1 && (
                <span className="text-[8px] leading-tight text-green-700 font-medium w-full text-center truncate px-0.5">
                  {e1}-{s1}
                </span>
              )}
              {t2 && (
                <span className="text-[8px] leading-tight text-blue-600 font-medium w-full text-center truncate px-0.5">
                  {e2}-{s2}
                </span>
              )}

              {/* Puntos indicadores */}
              {!celda.externo && (t1 || t2) && (
                <div className="flex gap-0.5 mt-0.5">
                  {t1 && <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />}
                  {t2 && <span className="w-1.5 h-1.5 rounded-full bg-[#378ADD]" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
