import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const formProxy = { target: 'http://127.0.0.1:5000', changeOrigin: true }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/api/submit-email(?:\\?.*)?$': formProxy,
      '^/api/submit-con(?:\\?.*)?$': formProxy,
      '^/api/submit-cv(?:\\?.*)?$': formProxy,
    },
  },
})
