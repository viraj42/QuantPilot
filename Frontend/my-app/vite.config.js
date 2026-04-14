import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    base: "./",   // ✅ IMPORTANT
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://10.97.43.39:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})