// Raíz de la aplicación.
// Define las rutas con react-router-dom:
//   /       -> CalendarioPage (vista consulta y admin)
//   /login  -> LoginPage (formulario de acceso admin)

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import CalendarioPage from './pages/CalendarioPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CalendarioPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NetworkProvider>
  );
}
