import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv'

// 本地开发：把 api/ 下的 serverless 函数挂到 /api/*，让 `npm run dev` 即可联调。
// 生产部署到 Vercel 时，api/ 会被自动识别为函数，本插件不参与（apply:'serve'）。
function devApi() {
  return {
    name: 'dev-api',
    apply: 'serve',
    async configureServer(server) {
      dotenv.config() // 读取根目录 .env 到 process.env（仅服务端，不进前端打包）
      const { default: extract } = await import('./api/extract.js')
      const { default: answer } = await import('./api/answer.js')
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/extract')) return extract(req, res)
        if (req.url?.startsWith('/api/answer')) return answer(req, res)
        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署时的子路径，需与仓库名一致
  // 部署仓库：fxt-gw-pb/health_risk_app_zhd
  // 注意：若整体部署到 Vercel（含后端），需把 base 改回 '/'。
  base: '/health_risk_app_zhd/',
  plugins: [
    react(),
    tailwindcss(),
    devApi(),
  ],
  server: {
    port: 5199,
  },
})
