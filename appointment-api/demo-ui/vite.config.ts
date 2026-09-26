import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/demo/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/slots': 'http://localhost:3000',
      '/bookings': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
}));
