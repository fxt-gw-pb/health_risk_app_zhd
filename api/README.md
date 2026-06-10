# 后端代理（DeepSeek）

AI 调用经此代理转发，**密钥只存后端环境变量**（本地 `.env` / 线上平台环境变量），绝不进入前端或仓库。前端只调用 `/api/*`。

## 端点

| 端点 | 方法 | 用途 |
|---|---|---|
| `/api/extract` | POST | 自由文本 → 指标值（DeepSeek JSON 模式）。请求 `{text, varSpec}`，返回 `{ok, value}` 或 `{ok:false, clarify}`。范围校验另由前端冻结内核 `validateInput` 兜底。 |
| `/api/answer` | POST（SSE） | 分层解读 / 「为什么」/ 自由问答。请求 `{messages?, question?, riskContext?, chunks?}`，流式返回 `data: {type:'delta'|'replace'|'done', text}`。 |

## 安全边界

- **系统 Prompt 即护栏**（`_lib/safety.js`）：只做生活方式/科普/指标与风险解释/就医提醒；禁止药物、剂量、诊断、治疗、处方、急诊指导；域外问题统一话术回绝。
- **出口过滤**：对模型累计输出做禁项（药名/剂量/诊断断言）扫描，命中即替换为安全话术并结束。
- **风险数值不进 AI**：只传风险等级 + Top5 因子标签；风险计算永远在前端本地（冻结内核）。
- 检索（`chunks`）在 P5 由 BM25-lite 注入；P4 为空，模型只给保守通用建议。

## 本地开发

1. 复制 `.env.example` 为 `.env`，填入 `DEEPSEEK_API_KEY`。
2. `npm run dev` —— Vite 插件 `devApi`（见 `vite.config.js`）把本目录函数挂到 `/api/*`，直接联调。

## 部署

- 函数为 Vercel Node 风格（`export default function handler(req,res)`），`_lib/` 下划线前缀不会被识别为路由。
- 整体部署到 Vercel：把 `vite.config.js` 的 `base` 改回 `'/'`，`DEEPSEEK_API_KEY` 配到项目环境变量；`api/` 自动成为 `/api/*` 函数。
- 若前端继续留在 GitHub Pages（静态，无后端），需把后端单独部署（如 Vercel）并在前端用其绝对地址 + 处理 CORS。
