// src/lib/uiTokens.js
// 纯 UI 设计令牌与文案（不含任何医学数值）。

// 每种疾病的主题色（与 riskConfig 中各结局 color 一致：t2d=emerald / cvd=blue / ht=rose）
export const ACCENT = {
  emerald: { text: 'text-emerald-600', soft: 'bg-emerald-50', ring: 'ring-emerald-200', dot: 'bg-emerald-500', grad: 'from-emerald-400 to-teal-400', border: 'border-emerald-200' },
  blue:    { text: 'text-blue-600',    soft: 'bg-blue-50',    ring: 'ring-blue-200',    dot: 'bg-blue-500',    grad: 'from-blue-500 to-cyan-400',   border: 'border-blue-200' },
  rose:    { text: 'text-rose-600',    soft: 'bg-rose-50',    ring: 'ring-rose-200',    dot: 'bg-rose-500',    grad: 'from-rose-400 to-pink-400',    border: 'border-rose-200' },
};

// 结局 → 主题色 + 简称（避免改动 riskConfig，本表只补充 UI 字段）
export const OUTCOME_UI = {
  t2d: { accent: 'emerald', short: '糖尿病' },
  cvd: { accent: 'blue',    short: '心血管病' },
  ht:  { accent: 'rose',    short: '高血压' },
};

// 风险等级 → 颜色类
export function levelMeta(level) {
  if (level === '高危') return { key: 'high', text: 'text-rose-600',    bar: 'bg-gradient-to-r from-rose-400 to-red-500',     chip: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-500' };
  if (level === '中危') return { key: 'mid',  text: 'text-amber-600',   bar: 'bg-gradient-to-r from-amber-300 to-amber-500',  chip: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' };
  return                       { key: 'low',  text: 'text-emerald-600', bar: 'bg-gradient-to-r from-emerald-300 to-teal-500', chip: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
}

// 三层评估步骤的标题与说明
export const STEP_META = [
  { n: 1, title: '基础信息', desc: '人口学 · 生活方式 · 家族史' },
  { n: 2, title: '血液检查', desc: '血压 · 血糖 · 血脂 · 用药' },
  { n: 3, title: '血管影像', desc: 'ABI · baPWV · CCA-IMT' },
];

// 第一层中文序号
export const CN_ORDINAL = ['一', '二', '三'];
