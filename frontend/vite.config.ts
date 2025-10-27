import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        onProxyReq(proxyReq) {
          console.log('--> [proxy]', proxyReq.method, proxyReq.path);
        },
        onProxyRes(proxyRes, req, res) {
          console.log('<-- [proxy]', req.method, req.url, proxyRes.statusCode);
        },
      },
      '/ws': {
        target: 'ws://backend:8000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
