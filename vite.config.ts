import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
    jsxImportSource: 'react'
  })],
  mode: 'production',
  define: {
    // Environment variables for production
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'https://aipcn.onrender.com'),
    'process.env.VITE_APP_NAME': JSON.stringify(process.env.VITE_APP_NAME || 'AIPC Healthcare Platform'),
    'process.env.VITE_APP_VERSION': JSON.stringify('1.0.0'),
  },
  server: {
    port: 7298,
    proxy: {
      // Proxy API calls to backend during development
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for security
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['@google/genai']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  publicDir: 'public',
  base: '/'
})
