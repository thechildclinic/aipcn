import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // SECURITY: Remove API key exposure from frontend
    // All AI calls should go through backend API
    'process.env.NODE_ENV': JSON.stringify('development'),
    'process.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:3001'),
    'process.env.VITE_APP_NAME': JSON.stringify('AIPC'),
    'process.env.VITE_APP_VERSION': JSON.stringify('1.0.0'),
  },
  server: {
    port: 7298,
    proxy: {
      // Proxy API calls to backend during development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})
