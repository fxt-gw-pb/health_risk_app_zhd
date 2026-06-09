import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署时的子路径，需与仓库名一致
  // 部署仓库：fxt-gw-pb/health_risk_app_zhd
  base: '/health_risk_app_zhd/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5199,
  },
})