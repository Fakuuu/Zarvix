import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import SelectorEmpleado from '../components/SelectorEmpleado';
import SelectorMes from '../components/SelectorMes';
import Calendario from '../components/Calendario';
import TurnoModal from '../components/TurnoModal';

function mesYanyoActual() {
  const hoy = new Date();
  return { anyo: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
}

export default function CalendarioPage() {
  const { isAdmin } = useAuth();

  const { anyo: anyoInicial, mes: mesInicial } = mesYanyoActual();
  const [empleadoId,  setEmpleadoId]  = useState(null);
  const [anyo,        setAnyo]        = useState(anyoInicial);
  const [mes,         setMes]         = useState(mesInicial);
  const [reloadKey,   setReloadKey]   = useState(0);

  // Estado del modal
  const [modalAbierto,   setModalAbierto]   = useState(false);
  const [turnoModal,     setTurnoModal]     = useState({
    fecha: '',
    turnoNum: 1,
    turnoExistente: null,
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleMesChange(nuevoAnyo, nuevoMes) {
    setAnyo(nuevoAnyo);
    setMes(nuevoMes);
  }

  // Recibe fecha (YYYY-MM-DD), turnoNum y el objeto de turno existente (o null)
  function handleTurnoClick(fecha, turnoNum, turnoExistente) {
    setTurnoModal({ fecha, turnoNum, turnoExistente });
    setModalAbierto(true);
  }

  // TurnoModal ya ha llamado a la API; solo hay que cerrar y recargar
  function handleSave() {
    setModalAbierto(false);
    setReloadKey((k) => k + 1);
  }

  function handleDelete() {
    setModalAbierto(false);
    setReloadKey((k) => k + 1);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-4">

        {/* Barra de controles */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
          <SelectorEmpleado
            empleadoId={empleadoId}
            onEmpleadoChange={setEmpleadoId}
          />
          <SelectorMes
            anyo={anyo}
            mes={mes}
            onMesChange={handleMesChange}
          />
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 shadow-sm">
          <Calendario
            empleadoId={empleadoId}
            anyo={anyo}
            mes={mes}
            isAdmin={isAdmin}
            onTurnoClick={handleTurnoClick}
            reloadKey={reloadKey}
          />
        </div>

      </main>

      {/* Modal de turno — solo relevante en modo admin */}
      {isAdmin && (
        <TurnoModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          onSave={handleSave}
          onDelete={handleDelete}
          turnoExistente={turnoModal.turnoExistente}
          fecha={turnoModal.fecha}
          turnoNum={turnoModal.turnoNum}
          empleadoId={empleadoId}
        />
      )}
    </div>
  );
}
