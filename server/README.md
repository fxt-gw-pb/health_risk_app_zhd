# 国内可访问的后端（腾讯云 SCF / 阿里云 FC）

把 `api/`（DeepSeek 代理 + BM25 RAG）打包成一个**零依赖的独立 Node 服务**，部署到**国内云函数**，让 GitHub Pages（国内可访问）也能用上完整 AI。

- `server/index.mjs`：`node:http` 服务，复用 `api/` 两个 handler，已开 CORS，监听 `PORT/FC_SERVER_PORT/9000`。
- `scripts/pack-backend.sh`：生成 `backend.zip`（含 `scf_bootstrap` + `server/` + `api/`），用于上传。

## 0. 先打包

```bash
bash scripts/pack-backend.sh   # 生成 backend.zip
```

---

## 1. 腾讯云 SCF · Web 函数（推荐，国内秒开）

1. 控制台 → **云函数 SCF** → 新建 → **Web 函数** → 运行环境 **Node.js 18**。
2. 提交方法选「本地上传 zip」，上传 `backend.zip`。
3. **启动文件**：`scf_bootstrap`（已在包里，监听端口 **9000**，与 Web 函数默认一致）。
4. **环境变量**：加 `DEEPSEEK_API_KEY=<你的密钥>`（可选 `DEEPSEEK_MODEL`/`DEEPSEEK_BASE_URL`）。
5. **超时时间**：调到 **60 秒以上**（DeepSeek 流式回答较慢，默认 3s 会被掐断）。
6. 创建后开启 **API 网关触发器**（公网访问），拿到形如
   `https://service-xxxx-xxxxxx.gz.apigw.tencentcs.com/release` 的地址 —— 这就是后端地址。
   - 该默认域名一般国内可直接访问、免个人备案（政策偶有调整，以控制台为准）。
7. 自检：浏览器打开 `<后端地址>/health`，应返回 `{"ok":true,...,"hasKey":true}`（`hasKey` 为 true 说明密钥配好了）。

## 2. 阿里云 FC · 函数计算（Custom Runtime）

1. 控制台 → **函数计算 FC** → 创建函数 → **Web 函数 / 自定义运行时**，Node.js 18。
2. 上传 `backend.zip`。
3. **启动命令**：`node server/index.mjs`；**监听端口**：`9000`（FC 会注入 `FC_SERVER_PORT`，本服务已兼容）。
4. **环境变量**：`DEEPSEEK_API_KEY=<你的密钥>`。
5. 触发器：HTTP 触发器（公网），拿到访问地址；**实例超时**调到 60s 以上。
6. 自检：访问 `<地址>/health` 看 `hasKey:true`。

> 流式说明：若网关对响应做了缓冲，回答可能"整段一次性出现"而非逐字流式——功能不受影响（前端仍能正常显示）。

---

## 3. 让 GitHub Pages 用上这个后端

1. 仓库 → **Settings → Secrets and variables → Actions → Variables** → New variable：
   - Name：`VITE_API_BASE`
   - Value：你上面拿到的**后端地址**（不带结尾 `/`，例如 `https://service-xxxx.gz.apigw.tencentcs.com/release`）
2. 触发 Pages 重新构建：往 `main` 推一个提交，或在 **Actions → Deploy to GitHub Pages → Run workflow** 手动跑一次。
3. 构建会把该地址打进前端；之后 Pages 上的「为什么」「自由问答」「自由文本作答」会跨域调用国内后端 → **国内不用代理也能用完整 AI**。

> 不设 `VITE_API_BASE` 时，前端走同源 `/api`（Vercel 上有后端→完整；Pages 上无后端→降级）。本地 `npm run dev` 仍走 Vite 中间件，照常联调。

## 4. 安全

- 密钥只配在云函数的**环境变量**里，仓库零泄漏。
- CORS 默认 `*`；如需收紧，给云函数设环境变量 `CORS_ORIGIN=https://fxt-gw-pb.github.io`。
