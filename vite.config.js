import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { wifiSyncPlugin } from './wifi-sync-plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wifiSyncPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true
  }
})

