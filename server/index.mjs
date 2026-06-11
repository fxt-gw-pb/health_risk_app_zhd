// server/index.mjs
// 可独立部署的后端（腾讯云 SCF Web 函数 / 阿里云 FC Custom Runtime / 任意 Node 主机）。
// 复用 ../api 的两个 handler，加 CORS，监听端口。零外部 npm 依赖。
import http from 'node:http';
import extract from '../api/extract.js';
import answer from '../api/answer.js';

// SCF Web 函数默认 9000；阿里云 FC 注入 FC_SERVER_PORT；其余看 PORT。
const PORT = process.env.PORT || process.env.FC_SERVER_PORT || 9000;

function setCors(res) {
  // 前端在 GitHub Pages（github.io），跨域调用本后端，放开 CORS。
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

const server = http.createServer((req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  // 用 endsWith 容忍函数 URL 可能带的路径前缀（如 /release/api/extract）。
  const path = (req.url || '').split('?')[0];
  if (path.endsWith('/api/extract')) return extract(req, res);
  if (path.endsWith('/api/answer')) return answer(req, res);
  if (path === '/' || path === '' || path.endsWith('/health')) {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true, service: 'health-copilot-api', hasKey: !!process.env.DEEPSEEK_API_KEY }));
  }
  res.statusCode = 404;
  res.end('not found');
});

server.listen(PORT, '0.0.0.0', () => console.log(`[api] listening on :${PORT}`));
