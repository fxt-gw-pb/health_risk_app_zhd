# 宣传材料

健康风险助手小程序的宣传与介绍素材，用于医创赛汇报、答辩与推广。

## 目录

```
宣传材料/
├─ 截图/                关键页面移动端截图（iPhone 视口 390×844 @2x，真机拍摄级清晰）
│  ├─ 01_welcome.png          首页（营销长图）：定位、三类慢病、三步流程、信任标签
│  ├─ 02_chat_intro.png       进入问诊：助手自我介绍 + 免责声明 + 第一题 + 「跳过问答」入口
│  ├─ 03_select_question.png  选择题：快捷选项 + 答题确认条「已记录 · 年龄：45」
│  ├─ 04_bmi_autocalc.png     ★ 身高体重自动算 BMI，实时预览「BMI ≈ 22.5（正常）」
│  ├─ 05_confirm_feedback.png ★ 答题确认反馈：AI 回显纳入模型的取值
│  ├─ 06_layer_summary.png    本层定性解读（不剧透风险值）+ 继续补充/看报告分支
│  ├─ 07_report.png           ★ 健康风险报告：一句话总结 + 三疾病卡片 + 风险条 + 为什么
│  ├─ 07b_report_full.png     完整对话 → 报告长图（含 Top5 影响因素 / 模型透明度）
│  └─ 08_free_chat.png        自由聊天入口：身份声明 + 「开始健康评估」按钮
├─ 二维码/
│  ├─ qrcode.png         品牌蓝二维码（推荐线上/屏幕使用）
│  ├─ qrcode_black.png   纯黑二维码（印刷最稳妥）
│  └─ qrcode.svg         矢量版（可无损放大）
├─ 海报AI提示词.md       两个独立生图提示词（竖屏长海报 / 横屏 16:9）
└─ README.md
```

## 二维码

指向线上地址：**https://fxt-gw-pb.github.io/health_risk_app_zhd/**
（segno 生成，纠错等级 H、version 6，已留安静区，可直接印刷或贴图。）

## 截图复现

截图由 `puppeteer-core` 驱动系统 Chrome、在移动端视口下走通确定性问诊流自动生成。复现步骤：

```bash
npm run dev                 # 本地启动（http://localhost:5199/health_risk_app_zhd/）
npm install --no-save puppeteer-core
node 宣传材料/screenshot.mjs  # 移动视口逐页截图（脚本随本目录一并提供）
```

> 注：截图在无 DeepSeek 密钥的环境下生成，走的是本地确定性流程；AI 自由问答的实际回答需配置后端密钥。
