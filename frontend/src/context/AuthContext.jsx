import { createContext, useContext, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

// Decodifica el payload de un JWT sin verificar la firma.
// Solo para comprobar la expiración en el cliente.
function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function tokenValido(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  // exp está en segundos; Date.now() en milisegundos
  return payload && payload.exp * 1000 > Date.now();
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('zarvix_token');
    if (tokenValido(stored)) return stored;
    // Token ausente o expirado: lo limpiamos silenciosamente
    localStorage.removeItem('zarvix_token');
    return null;
  });

  const isAdmin = Boolean(token);

  // Lanza el error al caller para que el formulario lo gestione
  async function login(password) {
    const { data } = await client.post('/api/auth/login', { password });
    localStorage.setItem('zarvix_token', data.token);
    setToken(data.token);
  }

  function logout() {
    localStorage.removeItem('zarvix_token');
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ isAdmin, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
