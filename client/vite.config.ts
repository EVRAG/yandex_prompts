import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Разрешить доступ со всех хостов
    allowedHosts: [
      'roseanna-unphotographable-sharron.ngrok-free.dev',
      'localhost',
      '127.0.0.1',
    ],
  },
});
