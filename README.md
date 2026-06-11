<div align="center">

# 健康风险助手 · AI Health Copilot

**面向普通居民的慢病风险评估 + 生活方式科普「对话式」AI 助手**

像聊天一样几分钟读懂未来 5 年的 **糖尿病 / 高血压 / 心血管病** 风险，并获得保守、可溯源的生活方式建议。

`React 19` · `Vite (Rolldown)` · `Tailwind v4` · `DeepSeek` · `BM25-lite RAG` · `Cox 比例风险模型`

</div>

---

## ✨ 这是什么

这是一款从「表单 → 结果」的风险预测工具，升级为 **chat-first 的 AI 健康风险助手**：

- 🗣️ **对话式问诊** —— 像聊天一样逐题回答，随时可跳过，不点输入框不弹键盘，移动端体验顺滑。
- 📊 **可解释风险报告** —— 三类慢病风险画像 + Top-5 影响因素可视化 + 模型透明度（C-index / 公式）。
- 🤖 **AI 科普与问答** —— 基于权威指南知识库（RAG）解释指标、解读风险、给生活方式建议。
- 🩺 **医疗主题界面** —— 心率脉冲头像、玻璃拟态、活体渐变与流光动效，简洁有高级感。

> **第一原则：所有医学计算 100% 不变。** AI 只负责引导 / 解释 / 科普 / 生活方式建议，**绝不参与风险计算**，风险数值与原版逐位一致（golden 测试锁定）。

---

## 🧠 核心设计

### 冻结的医学内核（风险计算）

风险预测基于**房山家系队列（2016—2024）**的 Cox 比例风险模型，全部在**浏览器本地**计算：

$$\text{Risk}(t) = 1 - S_0(t)^{\exp(LP)}, \quad LP=\sum_i \beta_i (x_i - \bar{x}_i)$$

| 预测结局 | 样本量 | 事件数 | 基线生存率 S₀(5y) | C-index（L1 / L2 / L3）|
|---|---|---|---|---|
| 新发糖尿病 | 3,904 | 961 | 0.9477 | 0.667 / 0.722 / 0.733 |
| 新发心血管病 | 3,396 | 1,898 | 0.7817 | 0.626 / 0.687 / 0.687 |
| 新发高血压 | 2,936 | 818 | 0.7955 | 0.647 / 0.728 / 0.750 |

三层渐进式评估：**① 基础信息**（年龄/BMI/腰围/作息/运动/吸烟饮酒/家族史）→ **② 血液检查**（血压/血糖/血脂/用药）→ **③ 血管影像**（ABI/baPWV/CCA-IMT）。逐层补充指标，评估越来越准。

> 内核 4 个文件带 `⚠️ FROZEN MEDICAL KERNEL` banner，统一从 `src/kernel/index.js` 调用；`src/kernel/__tests__/cox.golden.test.js` 对多组样本快照风险输出，重构全程保持一致。

### AI 层（DeepSeek + RAG）与安全边界

- **模型**：DeepSeek（OpenAI 兼容，`deepseek-chat`），仅用于文本理解、科普、解释。
- **RAG**：自研零依赖 **BM25-lite** 检索（中文一元/二元 gram），命中权威指南知识库 Top-5 注入提示词，回答末尾标注**来源与年份**。
- **三道护栏**：① 系统 Prompt 即护栏（只谈生活方式/解释，**禁止药物/剂量/诊断/治疗方案/处方/急诊指导**）；② 域护栏（无关问题统一回绝）；③ 出口安全过滤（正则拦截药名/剂量/诊断断言）。
- **隐私**：风险计算永不离开本地；只把「风险等级 + Top5 因子标签」传给后端，**不收集身份信息**，API 密钥只存服务端环境变量。

---

## 📚 RAG 知识体系（重点）

知识库面向普通居民，**只收录生活方式与指标解释，构建期即剔除药物/剂量/诊断/手术/处方**。

| 指标 | 数值 |
|---|---|
| 文档数 / 分块数 | 17 篇 / **238 块** |
| 分块类型 | 权威指南 165 · 公共卫生科普 54 · 小程序内部文档 12 · 文献综述 7 |
| 覆盖疾病（块计） | 心血管 170 · 糖尿病 138 · 高血压 129 |
| 每块溯源字段 | `source_url` · `year` · `organization_or_journal` · `disease_scope` · `content_type` … |

### 当前引用的主要参考来源

- **中国权威指南**：国家卫健委《成人高血压 / 糖尿病 / 高脂血症食养指南（2023）》、中国营养学会《中国居民膳食指南（2022）· 平衡膳食八准则》、《中国人群身体活动指南（2021）》。
- **WHO 中文实况报道**：高血压、糖尿病、心血管疾病、肥胖与超重、身体活动、健康饮食、减少钠摄入、烟草、酒精（2021–2026）。
- **里程碑随机对照试验 / 系统综述**：中国大庆研究（Pan 1997 / Gong 2019）、芬兰 DPS（Tuomilehto 2001）、美国 DPP（Knowler 2002）、DASH（Appel 1997）、DASH-Sodium（Sacks 2001）、PREDIMED（Estruch 2018）、身体活动剂量-反应 meta（Ekelund, BMJ 2019）。
- **小程序内部文档**：变量说明与指标解释、模型透明度说明。

> 📄 完整构建流程、分块/检索细节与文献全表见 **[`docs/项目技术报告.md`](docs/项目技术报告.md)**。

---

## 🏗️ 系统架构

```
┌──────────────────────────────────────────────────────────────┐
│  UI 层（React）   高级感首页 · 对话线程 · 健康风险报告           │
├──────────────────────────────────────────────────────────────┤
│  AI 外壳          对话编排 · 流式渲染 · 前端护栏兜底（可降级）    │
├──────────────────────────────────────────────────────────────┤
│  编排层           确定性问诊调度 + store(reducer) + 本地 Cox 计算 │
├──────────────────────────────────────────────────────────────┤
│  医学内核(冻结)    riskConfig / riskEngine / validation …  字节不改│
└──────────────────────────────────────────────────────────────┘
                   │ 仅传：风险等级 + Top5 因子标签
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  后端代理(serverless / Node)  /api/extract  /api/answer(SSE)    │
│  ① 域护栏 ② BM25 检索 ③ 组装 Prompt ④ DeepSeek 生成 ⑤ 出口过滤  │
└──────────────────────────────────────────────────────────────┘
```

### 项目结构

```
src/
  kernel/      冻结医学内核（统一入口 + golden 测试）
  intake/      questionFlow —— 逐题问诊 / 报告 / 「为什么」构建
  app/         store.jsx —— chat 编排（reducer + Context）
  chat/        ChatThread · Composer · MessageBubble(医疗头像) · LayerSummaryCard
  report/      HealthReport —— 一句话总结 + 三卡片 + Top5 + 透明度
  screens/     WelcomeScreen · ChatScreen
  copilot/     api · orchestrate（前端 ↔ 后端）
api/           extract · answer(SSE) · _lib(deepseek/safety/retrieve/http) · rag/chunks.json
server/        index.mjs —— 零依赖独立后端（Render / 腾讯云 SCF / 阿里云 FC 通用）
rag_knowledge_base/   raw · processed · chunks · metadata · excluded · scripts
docs/          项目技术报告.md
```

---

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（含本地 /api 中间件）
npm run dev            # http://localhost:5173

# 3. 构建生产版本
npm run build          # 产物输出至 dist/

# 4. 运行测试（医学内核 golden + 问诊/检索，21 用例）
npm test
```

### 环境变量

AI 能力需要 DeepSeek 密钥。**密钥只存于本地 `.env`（已 gitignore）与托管平台环境变量，绝不入库 / 不进前端打包产物。**

```bash
# .env（仓库根，gitignore）
DEEPSEEK_API_KEY=sk-********
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 前端可选：跨域指向国内后端（GitHub Pages + Render 场景）
VITE_API_BASE=https://your-backend.example.com
```

---

## 🌐 部署

| 入口 | 角色 | 国内访问 | AI 能力 |
|---|---|---|---|
| **GitHub Pages** | 前端（静态） | ✅ | 经 `VITE_API_BASE` 指向后端 → **完整 AI** |
| **Render** | 后端（`server/index.mjs`，零依赖） | 可达 | DeepSeek + RAG |
| **Vercel** | 前端 + 同源 `api/` 函数 | 需代理 | 完整 AI（备用） |

- 前端 `VITE_API_BASE` 留空 = 同源（Vercel / 本地 dev）；设置 = 跨域后端（Pages + Render）。
- 后端为独立 Node 服务（`node:http` + CORS + 读 `PORT`），可同时部署到 Render / 腾讯云 SCF Web 函数 / 阿里云 FC，部署步骤见 `server/README.md`。

---

## 🛡️ 安全与合规

- ✅ AI 不参与风险计算，风险数值不离开本地。
- ✅ 知识库构建期 + 出口双重剔除药物 / 剂量 / 诊断 / 治疗 / 手术，每块均带来源与年份。
- ✅ 域护栏拒答无关问题；所有回答附「不替代专业诊疗」免责声明。
- ✅ 医学内核 golden 测试锁定，输出与原版逐位一致。

> **免责声明**：本工具仅供健康风险参考与健康教育，**不构成医学诊断，也不替代专业诊疗**。如有不适或健康疑问，请及时就医并遵医嘱。

---

## 🧰 技术栈

| 类别 | 选型 |
|---|---|
| 前端 | React 19 · Vite (Rolldown) 7 · Tailwind CSS v4 · lucide-react |
| 状态 | useReducer + Context |
| AI | DeepSeek `deepseek-chat`（OpenAI 兼容） |
| 检索 | 自研 BM25-lite（零依赖，中文一元/二元 gram） |
| 后端 | Node `node:http` 独立服务 / serverless 函数（Vercel · SCF · FC 通用） |
| 测试 | Vitest（内核 golden + 问诊/检索，21 用例） |
| 部署 | GitHub Pages（Actions） · Render（Blueprint） · Vercel |

---

<div align="center">

数据来源：房山家系队列（2016–2024）· 建模方法：Cox 比例风险回归 + 弹性网变量筛选 + 三层嵌套评估

**完整技术细节见 [`docs/项目技术报告.md`](docs/项目技术报告.md)**

</div>
