import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5453,
    strictPort: true,          // fail fast if 5453 is already taken
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5454,                // vite preview uses the next slot
    strictPort: true,
  },
})
