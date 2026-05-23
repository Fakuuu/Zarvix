const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function SelectorMes({ anyo, mes, onMesChange }) {
  function anterior() {
    if (mes === 1) {
      onMesChange(anyo - 1, 12);
    } else {
      onMesChange(anyo, mes - 1);
    }
  }

  function siguiente() {
    if (mes === 12) {
      onMesChange(anyo + 1, 1);
    } else {
      onMesChange(anyo, mes + 1);
    }
  }

  return (
    <div className="flex items-center gap-1">

      <button
        onClick={anterior}
        aria-label="Mes anterior"
        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10.78 3.22a.75.75 0 0 1 0 1.06L7.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" />
        </svg>
      </button>

      <span className="min-w-[130px] text-center text-sm font-semibold text-gray-800 select-none">
        {MESES[mes - 1]} {anyo}
      </span>

      <button
        onClick={siguiente}
        aria-label="Mes siguiente"
        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5.22 3.22a.75.75 0 0 0 0 1.06L8.94 8 5.22 11.72a.75.75 0 1 0 1.06 1.06l4.25-4.25a.75.75 0 0 0 0-1.06L6.28 3.22a.75.75 0 0 0-1.06 0Z" />
        </svg>
      </button>

    </div>
  );
}
