// Cliente axios centralizado para toda la app.
// Usa VITE_API_URL como base y adjunta automáticamente el JWT
// almacenado en localStorage al header Authorization de cada petición.

import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor de petición: añade el token si existe
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('zarvix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
