import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
<<<<<<< HEAD
    hmr: false,
=======
<<<<<<< HEAD
    hmr: {
      port: 5173,
      host: 'localhost',
    },
=======
    hmr: false,
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
