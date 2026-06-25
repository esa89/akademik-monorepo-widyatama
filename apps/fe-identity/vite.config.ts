import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ui-assets': path.resolve(__dirname, '../../packages/ui/src/assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3020,
    allowedHosts: [".127.0.0.1.nip.io"],
  },
})
