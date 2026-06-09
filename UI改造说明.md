# UI/UX 改造说明（交付说明）

> 对象：`health-risk-app/`（多结局慢性病风险预测小程序）
> 范围：**仅 UI/UX 重做与组件拆分**。未改动任何医学计算、未改动部署/`base`/Git、未新增「全因死亡」结局。

---

## 一、医学逻辑红线 —— 全部保持原样

- **`src/riskConfig.js`**：变量定义、回归系数 βᵢ、人群均值 x̄ᵢ、baseline survival S₀、C-index、诊断规则、健康建议文案 —— **一个数字都没改**（文件为原样复制）。
- **`app_coefficients_tier3.csv`**：原样保留，未改动。
- Cox 公式 `Risk(t) = 1 − S₀(t)^exp(LP)`、`LP = Σβᵢ(xᵢ − x̄ᵢ)`、缺失→人群均值估算、诊断阈值检测与「疑似已患/已诊断」排除、运动量「高/低强度 MET 自动换算」、三层渐进计算 —— 逻辑**只搬运、未改写**，计算结果与原版完全一致。
- **未改动**：`vite.config.js`（含 `base`）、`.github/workflows/deploy.yml`、`package.json`/`package-lock.json`、`eslint.config.js`、`.gitignore`。

---

## 二、新的页面架构

```
首页 LandingPage
  → 三步问卷 FormWizard（顶部 Stepper：基础信息 / 血液检查 / 血管影像）
  → 风险面板 RiskDashboard（三张 RiskCard + 选中后的疾病详情）
```

- **LandingPage**：导航栏、左文右图的 Hero（主/副标题 + 开始评估）、可信指标条（C-index 最高 0.75、房山家系队列、纯本地计算）、三个功能卡片、四步流程、CTA 与医学免责声明。
- **FormWizard + Stepper**：三步进度指示，可点击已到达的步骤回跳；每层有说明卡片并提示「留空将用人群均值估算」，并显示本层已填写数量。第一层按「基本信息 / 生活方式 / 行为习惯 / 家族史与既往病史」分组；第二层为血压 / 血糖 / 血脂 / 用药；保留运动量自动换算。
- **RiskDashboard**：顶部状态条（当前层级 / 已用指标数 / 继续补充检查指标 / 修改本层 / 重置）。三张风险卡片（T2D/CVD/HT），含横向风险条（标注低/中/高危 10%、20% 分界）与等级标签；点击任一卡片在下方展开该疾病详情（风险解释、健康建议、模型透明度 Top5 贡献度、公式、诊断提示横幅、免责声明）。「疑似已患 / 已诊断」结局自动改为提示，不再给出新发风险。

---

## 三、组件拆分（不再把逻辑堆在 App.jsx）

```
src/
├── App.jsx                       # 仅做流程编排与状态管理
├── index.css                     # 全局样式 + 动画（保留原动画，新增入场/字体/聚焦光环）
├── riskConfig.js                 # 【未改】医学配置
├── lib/
│   ├── riskEngine.js             # Cox 计算 / 均值填补 / 排除判断（原样搬运；并再导出 checkDiagnostics）
│   ├── validation.js             # 输入范围校验
│   └── uiTokens.js               # 纯 UI 令牌：配色、等级颜色、步骤文案（无医学数值）
├── utils/
│   └── formatters.js             # riskLevel / usedCount / 运动量换算
└── components/
    ├── Logo.jsx
    ├── Header.jsx
    ├── LandingPage.jsx
    ├── Stepper.jsx
    ├── FormWizard.jsx
    ├── RiskBar.jsx
    ├── RiskCard.jsx
    ├── RiskDashboard.jsx
    ├── DiseaseDetail.jsx
    ├── ModelTransparencyPanel.jsx
    ├── DiagnosticAlert.jsx
    └── HealthAdviceCard.jsx
```

> 说明：为避免改动 `riskConfig.js`，疾病「简称」与主题色在 `lib/uiTokens.js` 的 `OUTCOME_UI` 中补充（不含任何医学数值）。

---

## 四、视觉规范

- 主色蓝→青渐变；低危 emerald / 中危 amber / 高危 rose；疑似已患为 slate + amber 警示。
- 卡片白底、`rounded-3xl`、柔和阴影；浅灰蓝渐变背景；图标使用 `lucide-react`；轻量 hover/入场动效（位移/缩放，不使用 opacity 以避免首帧闪烁）；移动端响应式。
- 字体：Noto Sans SC（在 `index.html` 引入）。

---

## 五、依赖与构建

- **未新增任何依赖**，技术栈不变：React 19 + Vite(rolldown) + Tailwind CSS v4（`@tailwindcss/vite`）+ lucide-react + clsx/tailwind-merge。
- 仅用到 Tailwind 既有工具类与少量自定义 CSS（见 `index.css`）。
- `index.html` 仅新增标题与 Google Fonts 链接（如需完全离线，可改为本地字体或移除该 `<link>`，不影响功能）。

### 构建自检建议（交回后请执行）

```bash
cd health-risk-app
npm install
npm run build      # 应当通过
npm run preview    # 本地预览
# 可选：npm run lint
```

> 我的运行环境无法执行 `npm`，故未能在本地跑通 `npm run build`。代码已按 React 19 / Tailwind v4 规范编写、import 路径已逐一核对。**请在交回后务必跑一次 `npm run build` 确认**；若有任何报错，把报错贴回，我据此修。

---

## 六、可视预览（无需构建即可查看）

`preview/health-risk-app-preview.html` 是一个**自包含的单文件预览**（用 React UMD + Tailwind CDN 重建了同一套界面与计算），双击即可在浏览器打开，用于在 `npm run build` 之前直观查看改造效果。它不是项目的一部分，无需交回作者。
