import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 本地开发：把 api/ 下的 serverless 函数挂到 /api/*，让 `npm run dev` 即可联调。
// 生产部署到 Vercel 时，api/ 会被自动识别为函数，本插件不参与（apply:'serve'）。
function devApi() {
  return {
    name: 'dev-api',
    apply: 'serve',
    async configureServer(server) {
      const { config } = await import('dotenv') // 仅 dev 需要；不作为构建期依赖
      config() // 读取根目录 .env 到 process.env（仅服务端，不进前端打包）
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
  // Vercel 构建时（自动注入 VERCEL=1）用根路径 '/'；
  // GitHub Pages / 本地用仓库子路径（与仓库名 fxt-gw-pb/health_risk_app_zhd 一致）。
  base: process.env.VERCEL ? '/' : '/health_risk_app_zhd/',
  plugins: [
    react(),
    tailwindcss(),
    devApi(),
  ],
  server: {
    port: 5199,
  },
})
