import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Toma control inmediato sin esperar recarga del cliente
        clientsClaim: true,
        skipWaiting: true,
        // SPA offline: si la navegación falla, sirve el index.html cacheado
        navigateFallback: '/index.html',
        // Las rutas de API no pasan por el SW (la app usa IndexedDB para eso)
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'Zarvix',
        short_name: 'Zarvix',
        description: 'Gestor de horarios laborales mensuales',
        theme_color: '#238636',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
