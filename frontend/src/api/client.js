// Cliente axios centralizado para toda la app.
// Añade el JWT al header y gestiona caché offline en IndexedDB:
//  - Respuestas GET exitosas se guardan en IDB con su timestamp.
//  - Si la petición falla por red (sin conexión), se devuelve el dato cacheado
//    como si fuera una respuesta normal { data, fromCache: true }.

import axios from 'axios';
import { idbGet, idbSet } from '../lib/idb';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor de petición: añade el token si existe
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('zarvix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de respuesta: cachea GET y sirve caché offline
client.interceptors.response.use(
  async (response) => {
    if (response.config.method === 'get') {
      const key = response.config.url;
      await idbSet(key, response.data);
    }
    return response;
  },
  async (error) => {
    const cfg = error.config;
    // Solo intentar caché en errores de red (sin respuesta del servidor)
    // y solo para GET (las mutaciones fallan con aviso claro al usuario)
    if (!error.response && cfg?.method === 'get') {
      const cached = await idbGet(cfg.url);
      if (cached !== null) {
        return { data: cached, fromCache: true, status: 200, config: cfg };
      }
    }
    return Promise.reject(error);
  }
);

export default client;
