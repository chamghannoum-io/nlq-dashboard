import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
    proxy: {
      '/webhook': {
        target: 'https://n8n-test.iohealth.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
