import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Nginxのproxy_passで使用しているホスト名を許可する
    allowedHosts: ['frontend'],
  },
})
