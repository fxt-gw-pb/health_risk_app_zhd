# 部署指南

本项目 = 前端（Vite/React 静态站）+ 后端（`api/` DeepSeek 代理 serverless 函数）。
代码已做到 **Vercel / GitHub Pages 两用**，构建时自动切换 `base`（Vercel 注入的 `VERCEL=1` → `/`；否则 `/health_risk_app_zhd/`）。

> ⚠️ **GitHub Pages 是纯静态托管，跑不了 `api/` 后端**——DeepSeek 抽取/RAG 问答会失效（前端自动降级为确定性版本）。**要完整 AI 体验，请用 Vercel。**

---

## 一、部署到 Vercel（推荐，完整 AI）

### 方式 A：网页连仓库（最简单）

1. 打开 https://vercel.com → **Add New… → Project** → Import 仓库 `fxt-gw-pb/health_risk_app_zhd`。
2. **Framework Preset** 会自动识别为 **Vite**；Build Command `npm run build`、Output `dist`（已由 `vercel.json` 固定，无需改）。
3. 展开 **Environment Variables**，添加（至少第一个）：
   | Name | Value |
   |---|---|
   | `DEEPSEEK_API_KEY` | 你的 DeepSeek 密钥 |
   | `DEEPSEEK_MODEL` | `deepseek-chat`（可选，默认即此）|
   | `DEEPSEEK_BASE_URL` | `https://api.deepseek.com`（可选）|
4. **Production Branch**：默认是仓库默认分支（`main`）。当前新功能在 `feat/ai-health-copilot`——
   先把它合并进 `main`，或在 Vercel 项目 *Settings → Git → Production Branch* 改为 `feat/ai-health-copilot`。
5. **Deploy**。完成后访问 Vercel 给的域名，即完整的 chat + DeepSeek + RAG。

### 方式 B：命令行（CLI）

```bash
npm i -g vercel
cd <仓库目录>
vercel                       # 首次：登录 + 关联项目（按提示，框架选 Vite）
vercel env add DEEPSEEK_API_KEY     # 粘贴密钥；环境选 Production（也可加 Preview）
vercel --prod                # 生产部署
```

### 部署后自检
- 打开站点 → 走一遍问诊 → 报告点「为什么会这样」应出现**流式回答 + 参考来源**；
- 报告后输入框问「高血压能喝酒吗」应得到**引用知识库的回答**；
- 若 AI 不工作：多半是 `DEEPSEEK_API_KEY` 没配或配错环境（确认勾选了 Production），改完需 **Redeploy**。

> 备注：`api/answer.js` 为流式 SSE，`vercel.json` 已设 `maxDuration: 60`，并用 `includeFiles` 确保知识库 `api/rag/**` 被打进函数。

---

## 二、GitHub Pages（仅静态，AI 降级）

仓库已有 `.github/workflows/deploy.yml`，**推送到 `main` 即自动构建并发布**到
`https://fxt-gw-pb.github.io/health_risk_app_zhd/`。
新 chat-first UI、三层问诊、风险计算（本地）均正常；但**无后端**，AI 抽取/RAG 问答会回退到确定性版本。
适合只想展示界面、不需要在线 AI 的场景。

---

## 三、密钥安全

- 真实密钥只存：**本地 `.env`**（已 gitignore）/ **Vercel 环境变量**。
- 仓库内 **永不出现**密钥（`.env.example` 仅占位）；前端打包产物 `dist` 不含密钥；前端只调用自家 `/api/*`。
